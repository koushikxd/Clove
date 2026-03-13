import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAppUser, assertWorkflowSecret } from "./lib/auth"

function makeInviteToken() {
  return crypto.randomUUID()
}

export const getPublicInvite = query({
  args: {
    inviteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.inviteToken) {
      return null
    }

    const inviteToken = args.inviteToken

    const invite = await ctx.db
      .query("jobInvites")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", inviteToken))
      .unique()

    if (!invite) {
      return null
    }

    const job = await ctx.db.get(invite.jobId)
    const seedCandidate = invite.seedCandidateId
      ? await ctx.db.get(invite.seedCandidateId)
      : null

    return {
      ...invite,
      job: job
        ? {
            id: job._id,
            title: job.title,
            description: job.description,
            location: job.location,
            type: job.type,
            requirements: job.requirements,
          }
        : null,
      seedCandidate: seedCandidate
        ? {
            id: seedCandidate._id,
            name: seedCandidate.name,
            email: seedCandidate.email,
            headline: seedCandidate.headline,
            matchScore: seedCandidate.matchScore,
          }
        : null,
    }
  },
})

export const createOrRefreshDemoInvite = mutation({
  args: {
    jobId: v.id("jobs"),
    workflowSecret: v.string(),
    inviteEmail: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)

    const job = await ctx.db.get(args.jobId)
    if (!job) {
      throw new ConvexError("Job not found")
    }

    const sourcedCandidates = await ctx.db
      .query("candidates")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect()

    const seedCandidate = sourcedCandidates
      .filter((candidate) => candidate.source === "exa")
      .sort(
        (left, right) => (right.matchScore ?? 0) - (left.matchScore ?? 0)
      )[0]

    if (!seedCandidate) {
      return null
    }

    const now = Date.now()
    const existingInvite = await ctx.db
      .query("jobInvites")
      .withIndex("by_job_kind", (q) =>
        q.eq("jobId", args.jobId).eq("kind", "demo")
      )
      .unique()

    const inviteToken = existingInvite?.inviteToken ?? makeInviteToken()
    const inviteId = existingInvite?._id

    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        inviteEmail: args.inviteEmail,
        inviteToken,
        seedCandidateId: seedCandidate._id,
        emailSentAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("jobInvites", {
        jobId: args.jobId,
        inviteEmail: args.inviteEmail,
        inviteToken,
        status: "pending",
        kind: "demo",
        seedCandidateId: seedCandidate._id,
        emailSentAt: now,
        createdAt: now,
        updatedAt: now,
      })
    }

    return {
      inviteId,
      inviteToken,
      inviteEmail: args.inviteEmail,
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        location: job.location,
        type: job.type,
        requirements: job.requirements,
      },
      seedCandidate: {
        id: seedCandidate._id,
        name: seedCandidate.name,
        email: seedCandidate.email,
        headline: seedCandidate.headline,
        matchScore: seedCandidate.matchScore,
        summary: seedCandidate.summary,
      },
    }
  },
})

export const getRecruiterInviteStatus = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      return null
    }

    const job = await ctx.db.get(args.jobId)
    if (!job || job.recruiterId !== authUser._id) {
      return null
    }

    const invite = await ctx.db
      .query("jobInvites")
      .withIndex("by_job_kind", (q) =>
        q.eq("jobId", args.jobId).eq("kind", "demo")
      )
      .unique()

    return invite
  },
})
