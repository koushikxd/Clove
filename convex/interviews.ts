import { ConvexError, v } from "convex/values"
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import type { Doc } from "./_generated/dataModel"
import { requireAppUser } from "./lib/auth"

async function requireCandidate(ctx: QueryCtx | MutationCtx) {
  const { authUser, appUser } = await requireAppUser(ctx)
  if (appUser.role !== "candidate") {
    throw new ConvexError("Only candidates can access interviews")
  }
  if (appUser.onboardingStatus !== "completed") {
    throw new ConvexError("Complete onboarding before interviewing")
  }
  return { authUser, appUser }
}

function getTurnShape(turn: Doc<"interviewTurns">) {
  return {
    id: turn._id,
    role: turn.role,
    source: turn.source,
    content: turn.content,
    questionIndex: turn.questionIndex,
    turnIndex: turn.turnIndex,
    isPartial: turn.isPartial,
    finalizedAt: turn.finalizedAt,
    createdAt: turn.createdAt,
    updatedAt: turn.updatedAt,
  }
}

export const getCandidateHomeState = query({
  args: {},
  handler: async (ctx) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "candidate") {
      return null
    }

    const invites = await ctx.db
      .query("jobInvites")
      .withIndex("by_accepted_user_id", (q) =>
        q.eq("acceptedByUserId", authUser._id)
      )
      .collect()

    const latestInvite = invites.sort(
      (left, right) => right.updatedAt - left.updatedAt
    )[0]

    if (!latestInvite) {
      return null
    }

    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_invite", (q) => q.eq("inviteId", latestInvite._id))
      .unique()

    return {
      inviteToken: latestInvite.inviteToken,
      inviteStatus: latestInvite.status,
      interviewStatus: interview?.status ?? null,
    }
  },
})

export const getInterviewState = query({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const invite = await ctx.db
      .query("jobInvites")
      .withIndex("by_invite_token", (q) =>
        q.eq("inviteToken", args.inviteToken)
      )
      .unique()

    if (!invite) {
      throw new ConvexError("Invite not found")
    }
    if (invite.acceptedByUserId && invite.acceptedByUserId !== authUser._id) {
      throw new ConvexError("This invite belongs to another account")
    }

    const job = await ctx.db.get(invite.jobId)
    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_invite", (q) => q.eq("inviteId", invite._id))
      .unique()

    const candidate = invite.acceptedCandidateId
      ? await ctx.db.get(invite.acceptedCandidateId)
      : null

    const turns = interview
      ? (
          await ctx.db
            .query("interviewTurns")
            .withIndex("by_interview_index", (q) =>
              q.eq("interviewId", interview._id)
            )
            .collect()
        ).map(getTurnShape)
      : []

    const currentQuestion =
      interview && turns.length > 0
        ? (turns.find(
            (turn) =>
              turn.role === "ai" &&
              turn.questionIndex === interview.currentQuestionIndex &&
              !turn.isPartial
          ) ?? null)
        : null

    return {
      invite: {
        id: invite._id,
        token: invite.inviteToken,
        status: invite.status,
      },
      job: job
        ? {
            id: job._id,
            title: job.title,
            description: job.description,
            requirements: job.requirements,
            location: job.location,
            type: job.type,
          }
        : null,
      candidate: candidate
        ? {
            id: candidate._id,
            name: candidate.name,
            email: candidate.email,
          }
        : null,
      interview: interview
        ? {
            id: interview._id,
            status: interview.status,
            currentQuestionIndex: interview.currentQuestionIndex,
            minQuestions: interview.minQuestions,
            maxQuestions: interview.maxQuestions,
            endedReason: interview.endedReason,
            totalTurns: interview.totalTurns,
            startedAt: interview.startedAt,
            completedAt: interview.completedAt,
          }
        : null,
      currentQuestion,
      turns,
    }
  },
})

export const getActionContextForInvite = query({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireCandidate(ctx)
    const invite = await ctx.db
      .query("jobInvites")
      .withIndex("by_invite_token", (q) =>
        q.eq("inviteToken", args.inviteToken)
      )
      .unique()

    if (!invite) {
      throw new ConvexError("Invite not found")
    }
    if (!invite.acceptedByUserId || invite.acceptedByUserId !== authUser._id) {
      throw new ConvexError("Invite has not been claimed by this account")
    }

    const interview = await ctx.db
      .query("interviews")
      .withIndex("by_invite", (q) => q.eq("inviteId", invite._id))
      .unique()

    const candidate = invite.acceptedCandidateId
      ? await ctx.db.get(invite.acceptedCandidateId)
      : null

    if (!candidate) {
      throw new ConvexError("Candidate not found for invite")
    }

    const candidateProfile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    const job = await ctx.db.get(invite.jobId)

    if (!job || !candidateProfile) {
      throw new ConvexError("Interview context is incomplete")
    }

    const finalizedTurns = interview
      ? await ctx.db
          .query("interviewTurns")
          .withIndex("by_interview_index", (q) =>
            q.eq("interviewId", interview._id)
          )
          .collect()
      : []

    return {
      authUserId: authUser._id,
      appUserId: appUser._id,
      invite,
      interview,
      candidate,
      candidateProfile,
      job,
      finalizedTurns: finalizedTurns.filter((turn) => !turn.isPartial),
    }
  },
})

export const getActionContextForInterview = query({
  args: {
    interviewId: v.id("interviews"),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.candidateUserId !== authUser._id) {
      throw new ConvexError("Interview not found")
    }

    const invite = await ctx.db.get(interview.inviteId)
    const candidate = await ctx.db.get(interview.candidateId)
    const job = await ctx.db.get(interview.jobId)
    const candidateProfile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (!invite || !candidate || !job || !candidateProfile) {
      throw new ConvexError("Interview context is incomplete")
    }

    const finalizedTurns = await ctx.db
      .query("interviewTurns")
      .withIndex("by_interview_index", (q) =>
        q.eq("interviewId", interview._id)
      )
      .collect()

    return {
      authUserId: authUser._id,
      invite,
      interview,
      candidate,
      candidateProfile,
      job,
      finalizedTurns: finalizedTurns.filter((turn) => !turn.isPartial),
    }
  },
})

export const createInterviewSession = mutation({
  args: {
    inviteId: v.id("jobInvites"),
    candidateId: v.id("candidates"),
    candidateUserId: v.string(),
    jobId: v.id("jobs"),
    minQuestions: v.number(),
    maxQuestions: v.number(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    if (authUser._id !== args.candidateUserId) {
      throw new ConvexError("Unauthorized")
    }

    const existing = await ctx.db
      .query("interviews")
      .withIndex("by_invite", (q) => q.eq("inviteId", args.inviteId))
      .unique()

    if (existing) {
      return existing._id
    }

    const now = Date.now()
    await ctx.db.patch(args.candidateId, {
      status: "interviewing",
      updatedAt: now,
    })

    return await ctx.db.insert("interviews", {
      candidateId: args.candidateId,
      candidateUserId: args.candidateUserId,
      jobId: args.jobId,
      inviteId: args.inviteId,
      status: "in_progress",
      currentQuestionIndex: 0,
      minQuestions: args.minQuestions,
      maxQuestions: args.maxQuestions,
      startedAt: now,
      lastActivityAt: now,
      totalTurns: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const appendAiTurn = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionIndex: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.candidateUserId !== authUser._id) {
      throw new ConvexError("Interview not found")
    }

    const now = Date.now()
    await ctx.db.insert("interviewTurns", {
      interviewId: args.interviewId,
      role: "ai",
      source: "ai",
      content: args.content.trim(),
      turnIndex: interview.totalTurns,
      questionIndex: args.questionIndex,
      isPartial: false,
      finalizedAt: now,
      createdAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(interview._id, {
      currentQuestionIndex: args.questionIndex,
      totalTurns: interview.totalTurns + 1,
      lastActivityAt: now,
      updatedAt: now,
      startedAt: interview.startedAt ?? now,
      status: "in_progress",
    })
  },
})

export const upsertPartialAnswer = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionIndex: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.candidateUserId !== authUser._id) {
      throw new ConvexError("Interview not found")
    }
    if (interview.status !== "in_progress") {
      throw new ConvexError("Interview is not active")
    }

    const now = Date.now()
    const existingPartial = await ctx.db
      .query("interviewTurns")
      .withIndex("by_interview_question", (q) =>
        q
          .eq("interviewId", args.interviewId)
          .eq("questionIndex", args.questionIndex)
      )
      .collect()

    const partialTurn = existingPartial.find(
      (turn) => turn.role === "candidate" && turn.isPartial
    )

    if (partialTurn) {
      await ctx.db.patch(partialTurn._id, {
        content: args.content,
        updatedAt: now,
      })
      return partialTurn._id
    }

    return await ctx.db.insert("interviewTurns", {
      interviewId: args.interviewId,
      role: "candidate",
      source: "speech",
      content: args.content,
      turnIndex: interview.totalTurns,
      questionIndex: args.questionIndex,
      isPartial: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const finalizeCandidateAnswer = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionIndex: v.number(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.candidateUserId !== authUser._id) {
      throw new ConvexError("Interview not found")
    }
    if (interview.status !== "in_progress") {
      throw new ConvexError("Interview is not active")
    }

    const now = Date.now()
    const turnsForQuestion = await ctx.db
      .query("interviewTurns")
      .withIndex("by_interview_question", (q) =>
        q
          .eq("interviewId", args.interviewId)
          .eq("questionIndex", args.questionIndex)
      )
      .collect()

    const partialTurn = turnsForQuestion.find(
      (turn) => turn.role === "candidate" && turn.isPartial
    )

    if (partialTurn) {
      await ctx.db.patch(partialTurn._id, {
        content: args.content.trim(),
        isPartial: false,
        finalizedAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("interviewTurns", {
        interviewId: args.interviewId,
        role: "candidate",
        source: "speech",
        content: args.content.trim(),
        turnIndex: interview.totalTurns,
        questionIndex: args.questionIndex,
        isPartial: false,
        finalizedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(interview._id, {
      totalTurns: partialTurn
        ? interview.totalTurns + 1
        : interview.totalTurns + 1,
      lastActivityAt: now,
      updatedAt: now,
    })
  },
})

export const completeInterview = mutation({
  args: {
    interviewId: v.id("interviews"),
    endedReason: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser } = await requireCandidate(ctx)
    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.candidateUserId !== authUser._id) {
      throw new ConvexError("Interview not found")
    }

    const invite = await ctx.db.get(interview.inviteId)
    const now = Date.now()

    await ctx.db.patch(interview._id, {
      status: "completed",
      endedReason: args.endedReason,
      completedAt: now,
      lastActivityAt: now,
      updatedAt: now,
    })

    await ctx.db.patch(interview.candidateId, {
      status: "interviewed",
      updatedAt: now,
    })

    if (invite) {
      await ctx.db.patch(invite._id, {
        status: "completed",
        completedAt: now,
        updatedAt: now,
      })
    }
  },
})
