import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertWorkflowSecret, requireAppUser } from "./lib/auth"

function getCandidateStatus(recommendation: "shortlist" | "reject" | "maybe") {
  if (recommendation === "shortlist") {
    return "shortlisted" as const
  }

  if (recommendation === "reject") {
    return "rejected" as const
  }

  return "interviewed" as const
}

export const getEvaluationContextForWorkflow = query({
  args: {
    interviewId: v.id("interviews"),
    workflowSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)

    const interview = await ctx.db.get(args.interviewId)
    if (!interview || interview.status !== "completed") {
      return null
    }

    const existingEvaluation = await ctx.db
      .query("evaluations")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .unique()

    const candidate = await ctx.db.get(interview.candidateId)
    const job = await ctx.db.get(interview.jobId)

    if (!candidate || !job) {
      throw new ConvexError("Evaluation context is incomplete")
    }

    const candidateProfile = candidate.linkedUserId
      ? await ctx.db
          .query("candidateProfiles")
          .withIndex("by_user_id", (q) =>
            q.eq("userId", candidate.linkedUserId!)
          )
          .unique()
      : null

    const transcript = await ctx.db
      .query("interviewTurns")
      .withIndex("by_interview_index", (q) =>
        q.eq("interviewId", interview._id)
      )
      .collect()

    return {
      interview,
      candidate,
      candidateProfile,
      job,
      existingEvaluation,
      transcript: transcript
        .filter((turn) => !turn.isPartial)
        .map((turn) => ({
          role: turn.role,
          content: turn.content,
          questionIndex: turn.questionIndex,
        })),
    }
  },
})

export const saveWorkflowEvaluation = mutation({
  args: {
    interviewId: v.id("interviews"),
    workflowSecret: v.string(),
    scores: v.object({
      technicalSkills: v.number(),
      communication: v.number(),
      problemSolving: v.number(),
      cultureFit: v.number(),
      overall: v.number(),
    }),
    summary: v.string(),
    recommendation: v.union(
      v.literal("shortlist"),
      v.literal("reject"),
      v.literal("maybe")
    ),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)

    const interview = await ctx.db.get(args.interviewId)
    if (!interview) {
      throw new ConvexError("Interview not found")
    }

    const existing = await ctx.db
      .query("evaluations")
      .withIndex("by_interview", (q) => q.eq("interviewId", args.interviewId))
      .unique()

    const now = Date.now()
    const candidateStatus = getCandidateStatus(args.recommendation)

    if (existing) {
      await ctx.db.patch(interview._id, {
        overallScore: args.scores.overall,
        updatedAt: now,
      })

      await ctx.db.patch(interview.candidateId, {
        status: candidateStatus,
        updatedAt: now,
      })

      return existing._id
    }

    const evaluationId = await ctx.db.insert("evaluations", {
      interviewId: interview._id,
      candidateId: interview.candidateId,
      jobId: interview.jobId,
      scores: args.scores,
      summary: args.summary.trim(),
      recommendation: args.recommendation,
      createdAt: now,
    })

    await ctx.db.patch(interview._id, {
      overallScore: args.scores.overall,
      updatedAt: now,
    })

    await ctx.db.patch(interview.candidateId, {
      status: candidateStatus,
      updatedAt: now,
    })

    return evaluationId
  },
})

export const getShortlistedForJob = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      return []
    }

    const job = await ctx.db.get(args.jobId)
    if (!job || job.recruiterId !== authUser._id) {
      return []
    }

    const evaluations = await ctx.db
      .query("evaluations")
      .withIndex("by_job_recommendation", (q) =>
        q.eq("jobId", args.jobId).eq("recommendation", "shortlist")
      )
      .collect()

    const shortlisted = await Promise.all(
      evaluations.map(async (evaluation) => {
        const candidate = await ctx.db.get(evaluation.candidateId)
        const interview = await ctx.db.get(evaluation.interviewId)

        if (!candidate || !interview) {
          return null
        }

        const transcript = await ctx.db
          .query("interviewTurns")
          .withIndex("by_interview_index", (q) =>
            q.eq("interviewId", interview._id)
          )
          .collect()

        const candidateProfile = candidate.linkedUserId
          ? await ctx.db
              .query("candidateProfiles")
              .withIndex("by_user_id", (q) =>
                q.eq("userId", candidate.linkedUserId!)
              )
              .unique()
          : null

        return {
          evaluationId: evaluation._id,
          candidate: {
            id: candidate._id,
            name: candidate.name,
            email: candidate.email,
            headline: candidate.headline,
            location: candidate.location,
            summary: candidate.summary,
            phoneNumber: candidateProfile?.phoneNumber,
            yearsOfExperience: candidateProfile?.yearsOfExperience,
          },
          interview: {
            id: interview._id,
            status: interview.status,
            completedAt: interview.completedAt,
            endedReason: interview.endedReason,
            overallScore: interview.overallScore,
          },
          evaluation: {
            scores: evaluation.scores,
            summary: evaluation.summary,
            recommendation: evaluation.recommendation,
            createdAt: evaluation.createdAt,
          },
          transcript: transcript
            .filter((turn) => !turn.isPartial)
            .map((turn) => ({
              id: turn._id,
              role: turn.role,
              content: turn.content,
              questionIndex: turn.questionIndex,
              turnIndex: turn.turnIndex,
              createdAt: turn.createdAt,
            })),
        }
      })
    )

    return shortlisted
      .filter((candidate) => candidate !== null)
      .sort(
        (left, right) =>
          (right?.evaluation.scores.overall ?? 0) -
          (left?.evaluation.scores.overall ?? 0)
      )
  },
})
