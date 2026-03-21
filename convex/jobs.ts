import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { requireAppUser } from "./lib/auth"

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    requirements: v.array(v.string()),
    location: v.string(),
    type: v.union(
      v.literal("remote"),
      v.literal("onsite"),
      v.literal("hybrid")
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      throw new ConvexError("Only recruiters can create jobs")
    }
    if (appUser.onboardingStatus !== "completed") {
      throw new ConvexError("Complete onboarding before creating a job")
    }

    const now = Date.now()
    return await ctx.db.insert("jobs", {
      ...args,
      title: args.title.trim(),
      description: args.description.trim(),
      requirements: args.requirements,
      location: args.location.trim(),
      status: "active",
      sourcingStatus: "queued",
      recruiterId: authUser._id,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const listForRecruiter = query({
  args: {},
  handler: async (ctx) => {
    const { authUser, appUser } = await requireAppUser(ctx)
    if (appUser.role !== "recruiter") {
      return []
    }

    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_recruiter", (q) => q.eq("recruiterId", authUser._id))
      .order("desc")
      .collect()

    return await Promise.all(
      jobs.map(async (job) => {
        const candidates = await ctx.db
          .query("candidates")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .order("desc")
          .collect()
        const invite = await ctx.db
          .query("jobInvites")
          .withIndex("by_job_kind", (q) =>
            q.eq("jobId", job._id).eq("kind", "demo")
          )
          .unique()

        return {
          ...job,
          candidates,
          candidateCount: candidates.length,
          shortlistedCount: candidates.filter(
            (candidate) => candidate.status === "shortlisted"
          ).length,
          invite,
        }
      })
    )
  },
})

export const getOwnedJob = query({
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

    return job
  },
})
