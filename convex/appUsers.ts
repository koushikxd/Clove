import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { splitName, requireAppUser, requireAuthUser } from "./lib/auth"

export const ensureCurrentUser = mutation({
  args: {
    roleHint: v.optional(
      v.union(v.literal("recruiter"), v.literal("candidate"))
    ),
  },
  handler: async (ctx, args) => {
    const authUser = await requireAuthUser(ctx)
    const existing = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("userId", authUser._id))
      .unique()

    if (existing) {
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

    const candidate = await ctx.db
      .query("candidates")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
      .unique()

    if (!candidate) {
      return null
    }

    const job = await ctx.db.get(candidate.jobId)

    return {
      inviteToken: args.inviteToken,
      candidate: {
        id: candidate._id,
        email: candidate.email,
        name: candidate.name,
      },
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
    inviteToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "candidate") {
      throw new ConvexError("Only candidates can complete candidate onboarding")
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
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("candidateProfiles", {
        userId: authUser._id,
        appUserId: appUser._id,
        phoneNumber: args.phoneNumber.trim(),
        yearsOfExperience: args.yearsOfExperience,
        resumeStorageId: args.resumeStorageId,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (args.inviteToken) {
      const candidate = await ctx.db
        .query("candidates")
        .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
        .unique()

      if (candidate && candidate.email.toLowerCase() === authUser.email.toLowerCase()) {
        await ctx.db.patch(candidate._id, {
          linkedUserId: authUser._id,
          resumeStorageId: args.resumeStorageId,
          status: "accepted",
          acceptedAt: now,
          updatedAt: now,
        })
      }
    }

    return { ok: true }
  },
})
