import { v } from "convex/values"
import { action } from "./_generated/server"
import { makeFunctionReference } from "convex/server"
import type { Doc, Id } from "./_generated/dataModel"
import { runInterviewWorker } from "./lib/interviewWorker"
import { buildJobAwareResumeContext } from "./lib/resume"

const getActionContextForInviteRef = makeFunctionReference<
  "query",
  { inviteToken: string },
  unknown
>("interviews:getActionContextForInvite")

const getInterviewStateRef = makeFunctionReference<
  "query",
  { inviteToken: string },
  unknown
>("interviews:getInterviewState")

const createInterviewSessionRef = makeFunctionReference<
  "mutation",
  {
    inviteId: Id<"jobInvites">
    candidateId: Id<"candidates">
    candidateUserId: string
    jobId: Id<"jobs">
    minQuestions: number
    maxQuestions: number
  },
  Id<"interviews">
>("interviews:createInterviewSession")

const appendAiTurnRef = makeFunctionReference<
  "mutation",
  {
    interviewId: Id<"interviews">
    questionIndex: number
    content: string
  },
  void
>("interviews:appendAiTurn")

const finalizeCandidateAnswerRef = makeFunctionReference<
  "mutation",
  {
    interviewId: Id<"interviews">
    questionIndex: number
    content: string
  },
  void
>("interviews:finalizeCandidateAnswer")

const getActionContextForInterviewRef = makeFunctionReference<
  "query",
  { interviewId: Id<"interviews"> },
  unknown
>("interviews:getActionContextForInterview")

const completeInterviewRef = makeFunctionReference<
  "mutation",
  {
    interviewId: Id<"interviews">
    endedReason: string
  },
  void
>("interviews:completeInterview")

type ActionContextTurn = {
  role: "ai" | "candidate"
  content: string
  questionIndex: number
}

type StartInterviewContext = {
  authUserId: string
  invite: {
    _id: Id<"jobInvites">
    inviteToken: string
  }
  interview: {
    _id: Id<"interviews">
    maxQuestions: number
    minQuestions: number
  } | null
  candidate: {
    _id: Id<"candidates">
    name: string
    email: string
  }
  candidateProfile: {
    resumeStorageId: Id<"_storage">
    yearsOfExperience: number
    resumeFileName?: string
    resumeMimeType?: string
    resumeText?: string
  }
  job: Doc<"jobs">
  finalizedTurns: ActionContextTurn[]
}

export const startInterview = action({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    const context = (await ctx.runQuery(getActionContextForInviteRef, {
      inviteToken: args.inviteToken,
    })) as StartInterviewContext

    if (context.interview) {
      return await ctx.runQuery(getInterviewStateRef, {
        inviteToken: args.inviteToken,
      })
    }

    const interviewId = await ctx.runMutation(createInterviewSessionRef, {
      inviteId: context.invite._id,
      candidateId: context.candidate._id,
      candidateUserId: context.authUserId,
      jobId: context.job._id,
      minQuestions: 4,
      maxQuestions: 6,
    })

    const resumeBlob = await ctx.storage.get(context.candidateProfile.resumeStorageId)
    const resumeText =
      context.candidateProfile.resumeText ?? (await resumeBlob?.text())
    const resumeContext = buildJobAwareResumeContext({
      job: context.job,
      resumeText,
      yearsOfExperience: context.candidateProfile.yearsOfExperience,
    })

    const workerResult = await runInterviewWorker({
      job: context.job,
      candidate: {
        name: context.candidate.name,
        email: context.candidate.email,
        yearsOfExperience: context.candidateProfile.yearsOfExperience,
        resumeContext,
      },
      turns: [],
      minQuestions: 4,
      maxQuestions: 6,
      finalizedQuestionCount: 0,
    })

    await ctx.runMutation(appendAiTurnRef, {
      interviewId,
      questionIndex: 0,
      content: workerResult.nextQuestion,
    })

    return await ctx.runQuery(getInterviewStateRef, {
      inviteToken: args.inviteToken,
    })
  },
})

export const submitAnswer = action({
  args: {
    interviewId: v.id("interviews"),
    questionIndex: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<unknown> => {
    await ctx.runMutation(finalizeCandidateAnswerRef, args)

    const context = (await ctx.runQuery(getActionContextForInterviewRef, {
      interviewId: args.interviewId,
    })) as StartInterviewContext & {
      interview: {
        _id: Id<"interviews">
        maxQuestions: number
        minQuestions: number
      }
    }

    const finalizedQuestionCount = context.finalizedTurns.filter(
      (turn: { role: string }) => turn.role === "ai"
    ).length

    if (finalizedQuestionCount >= context.interview.maxQuestions) {
      await ctx.runMutation(completeInterviewRef, {
        interviewId: args.interviewId,
        endedReason: "Reached the maximum question limit.",
      })
      return await ctx.runQuery(getInterviewStateRef, {
        inviteToken: context.invite.inviteToken,
      })
    }

    const resumeBlob = await ctx.storage.get(context.candidateProfile.resumeStorageId)
    const resumeText =
      context.candidateProfile.resumeText ?? (await resumeBlob?.text())
    const resumeContext = buildJobAwareResumeContext({
      job: context.job,
      resumeText,
      yearsOfExperience: context.candidateProfile.yearsOfExperience,
    })

    const workerResult = await runInterviewWorker({
      job: context.job,
      candidate: {
        name: context.candidate.name,
        email: context.candidate.email,
        yearsOfExperience: context.candidateProfile.yearsOfExperience,
        resumeContext,
      },
      turns: context.finalizedTurns.map((turn: {
        role: "ai" | "candidate"
        content: string
        questionIndex: number
      }) => ({
        role: turn.role,
        content: turn.content,
        questionIndex: turn.questionIndex,
      })),
      minQuestions: context.interview.minQuestions,
      maxQuestions: context.interview.maxQuestions,
      finalizedQuestionCount,
    })

    if (workerResult.shouldEnd) {
      await ctx.runMutation(completeInterviewRef, {
        interviewId: args.interviewId,
        endedReason:
          workerResult.endedReason ?? "Collected enough evidence to end interview.",
      })
    } else {
      await ctx.runMutation(appendAiTurnRef, {
        interviewId: args.interviewId,
        questionIndex: finalizedQuestionCount,
        content: workerResult.nextQuestion,
      })
    }

    return await ctx.runQuery(getInterviewStateRef, {
      inviteToken: context.invite.inviteToken,
    })
  },
})
