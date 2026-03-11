import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAppUser } from "./lib/auth"

function makeInviteToken() {
  return crypto.randomUUID()
}

export const issueDemoInvite = mutation({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    const { appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      throw new ConvexError("Only recruiters can send invites")
    }

    const candidate = await ctx.db.get(args.candidateId)
    if (!candidate) {
      throw new ConvexError("Candidate not found")
    }

    const job = await ctx.db.get(candidate.jobId)
    if (!job || job.recruiterId !== appUser.userId) {
      throw new ConvexError("Candidate not found")
    }

    const inviteToken = candidate.inviteToken ?? makeInviteToken()
    const now = Date.now()

    await ctx.db.patch(candidate._id, {
      inviteToken,
      status: "invited",
      invitedAt: candidate.invitedAt ?? now,
      lastDemoInviteSentAt: now,
      updatedAt: now,
    })

    return {
      candidateEmail: candidate.email,
      candidateName: candidate.name,
      inviteToken,
      jobTitle: job.title,
    }
  },
})

export const getByInviteToken = query({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("candidates")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique()
  },
})
