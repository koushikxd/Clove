import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { splitName, requireAppUser, requireAuthUser } from "./lib/auth"

export const ensureCurrentUser = mutation({
  args: {
    roleHint: v.optional(
      v.union(v.literal("recruiter"), v.literal("candidate"))
    ),
    inviteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await requireAuthUser(ctx)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (existing) {
      if (
        existing.role === "candidate" &&
        args.roleHint === "candidate" &&
        !args.inviteToken
      ) {
        throw new ConvexError(
          "Candidates can only access the app through an invite"
        )
      }

      const nextValues =
        existing.email !== authUser.email ? { email: authUser.email } : null

      if (nextValues) {
        await ctx.db.patch(existing._id, {
          ...nextValues,
          updatedAt: Date.now(),
        })
      }

      return existing._id
    }

    if (!args.roleHint) {
      throw new ConvexError("A role is required to initialize the user")
    }
    if (args.roleHint === "candidate") {
      const inviteToken = args.inviteToken
      if (!inviteToken) {
        throw new ConvexError("Candidates can only sign up through an invite")
      }

      const invite = await ctx.db
        .query("jobInvites")
        .withIndex("by_invite_token", (q) => q.eq("inviteToken", inviteToken))
        .unique()

      if (!invite) {
        throw new ConvexError("Invalid invite")
      }
    }

    const nameParts = splitName(authUser.name)
    return await ctx.db.insert("users", {
      userId: authUser._id,
      email: authUser.email,
      role: args.roleHint,
      firstName: nameParts.firstName,
      lastName: nameParts.lastName,
      onboardingStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const getViewer = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await requireAuthUser(ctx)
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (!appUser) {
      return null
    }

    const recruiterProfile =
      appUser.role === "recruiter"
        ? await ctx.db
            .query("recruiterProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
            .unique()
        : null

    const candidateProfile =
      appUser.role === "candidate"
        ? await ctx.db
            .query("candidateProfiles")
            .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
            .unique()
        : null

    return {
      authUser: {
        id: authUser._id,
        email: authUser.email,
        name: authUser.name,
      },
      appUser,
      recruiterProfile,
      candidateProfile,
    }
  },
})

export const getInviteDetails = query({
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
      inviteToken: args.inviteToken,
      invite: {
        id: invite._id,
        status: invite.status,
        email: invite.inviteEmail,
      },
      candidate: seedCandidate
        ? {
            id: seedCandidate._id,
            email: seedCandidate.email,
            name: seedCandidate.name,
          }
        : null,
      job: job
        ? {
            id: job._id,
            title: job.title,
          }
        : null,
    }
  },
})

export const completeRecruiterOnboarding = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    companyName: v.string(),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      throw new ConvexError("Only recruiters can complete recruiter onboarding")
    }

    const now = Date.now()

    await ctx.db.patch(appUser._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      onboardingStatus: "completed",
      updatedAt: now,
    })

    const existingProfile = await ctx.db
      .query("recruiterProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        companyName: args.companyName.trim(),
        updatedAt: now,
      })
      return existingProfile._id
    }

    return await ctx.db.insert("recruiterProfiles", {
      userId: authUser._id,
      appUserId: appUser._id,
      companyName: args.companyName.trim(),
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const generateResumeUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const { appUser } = await requireAppUser(ctx)
    if (appUser.role !== "candidate") {
      throw new ConvexError("Only candidates can upload resumes")
    }

    return await ctx.storage.generateUploadUrl()
  },
})

export const completeCandidateOnboarding = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phoneNumber: v.string(),
    yearsOfExperience: v.number(),
    resumeStorageId: v.id("_storage"),
    resumeFileName: v.optional(v.string()),
    resumeMimeType: v.optional(v.string()),
    resumeText: v.optional(v.string()),
    inviteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "candidate") {
      throw new ConvexError("Only candidates can complete candidate onboarding")
    }
    if (!args.inviteToken) {
      throw new ConvexError("Candidate onboarding requires a valid invite")
    }

    const inviteToken = args.inviteToken

    const invite = await ctx.db
      .query("jobInvites")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", inviteToken))
      .unique()

    if (!invite) {
      throw new ConvexError("Invalid invite")
    }
    if (invite.acceptedByUserId && invite.acceptedByUserId !== authUser._id) {
      throw new ConvexError("This invite has already been claimed")
    }

    const now = Date.now()

    await ctx.db.patch(appUser._id, {
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      onboardingStatus: "completed",
      updatedAt: now,
    })

    const existingProfile = await ctx.db
      .query("candidateProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        phoneNumber: args.phoneNumber.trim(),
        yearsOfExperience: args.yearsOfExperience,
        resumeStorageId: args.resumeStorageId,
        resumeFileName: args.resumeFileName,
        resumeMimeType: args.resumeMimeType,
        resumeText: args.resumeText,
        resumeTextUpdatedAt: args.resumeText ? now : undefined,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("candidateProfiles", {
        userId: authUser._id,
        appUserId: appUser._id,
        phoneNumber: args.phoneNumber.trim(),
        yearsOfExperience: args.yearsOfExperience,
        resumeStorageId: args.resumeStorageId,
        resumeFileName: args.resumeFileName,
        resumeMimeType: args.resumeMimeType,
        resumeText: args.resumeText,
        resumeTextUpdatedAt: args.resumeText ? now : undefined,
        createdAt: now,
        updatedAt: now,
      })
    }

    const seededCandidate = invite.seedCandidateId
      ? await ctx.db.get(invite.seedCandidateId)
      : null

    const acceptedCandidateId =
      seededCandidate &&
      seededCandidate.email.toLowerCase() === authUser.email.toLowerCase()
        ? seededCandidate._id
        : invite.acceptedCandidateId

    let candidateId = acceptedCandidateId

    if (!candidateId) {
      candidateId = await ctx.db.insert("candidates", {
        jobId: invite.jobId,
        name: `${args.firstName.trim()} ${args.lastName.trim()}`.trim(),
        email: authUser.email,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        linkedUserId: authUser._id,
        source: "manual",
        status: "accepted",
        resumeStorageId: args.resumeStorageId,
        inviteToken: invite.inviteToken,
        acceptedAt: now,
        createdAt: now,
        updatedAt: now,
      })
    } else {
      await ctx.db.patch(candidateId, {
        name: `${args.firstName.trim()} ${args.lastName.trim()}`.trim(),
        email: authUser.email,
        firstName: args.firstName.trim(),
        lastName: args.lastName.trim(),
        linkedUserId: authUser._id,
        status: "accepted",
        resumeStorageId: args.resumeStorageId,
        inviteToken: invite.inviteToken,
        acceptedAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(invite._id, {
      status: "accepted",
      acceptedByUserId: authUser._id,
      acceptedCandidateId: candidateId,
      acceptedAt: now,
      updatedAt: now,
    })

    return { ok: true }
  },
})
