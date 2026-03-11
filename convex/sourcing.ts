import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { assertWorkflowSecret } from "./lib/auth"

const searchCriteriaValidator = v.object({
  query: v.string(),
  titles: v.array(v.string()),
  mustHaves: v.array(v.string()),
  locations: v.array(v.string()),
})

const sourcedCandidateValidator = v.object({
  email: v.string(),
  name: v.string(),
  firstName: v.optional(v.string()),
  lastName: v.optional(v.string()),
  linkedinUrl: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  headline: v.optional(v.string()),
  location: v.optional(v.string()),
  summary: v.optional(v.string()),
  sourceSnippet: v.optional(v.string()),
  matchScore: v.optional(v.number()),
  matchReason: v.optional(v.string()),
})

export const getJobForWorkflow = query({
  args: {
    jobId: v.id("jobs"),
    workflowSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)
    return await ctx.db.get(args.jobId)
  },
})

export const markSourcingStarted = mutation({
  args: {
    jobId: v.id("jobs"),
    workflowSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)
    await ctx.db.patch(args.jobId, {
      sourcingStatus: "running",
      sourcingError: undefined,
      sourcingStartedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const markSourcingFailed = mutation({
  args: {
    jobId: v.id("jobs"),
    error: v.string(),
    workflowSecret: v.string(),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)
    await ctx.db.patch(args.jobId, {
      sourcingStatus: "failed",
      sourcingError: args.error,
      sourcingCompletedAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const saveSourcingResults = mutation({
  args: {
    jobId: v.id("jobs"),
    workflowSecret: v.string(),
    searchCriteria: searchCriteriaValidator,
    candidates: v.array(sourcedCandidateValidator),
  },
  handler: async (ctx, args) => {
    assertWorkflowSecret(args.workflowSecret)
    const now = Date.now()

    for (const candidate of args.candidates) {
      const existing = await ctx.db
        .query("candidates")
        .withIndex("by_job_email", (q) =>
          q.eq("jobId", args.jobId).eq("email", candidate.email)
        )
        .unique()

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...candidate,
          source: "exa",
          status: existing.status,
          updatedAt: now,
        })
        continue
      }

      await ctx.db.insert("candidates", {
        jobId: args.jobId,
        ...candidate,
        source: "exa",
        status: "sourced",
        createdAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(args.jobId, {
      searchCriteria: args.searchCriteria,
      sourcingStatus: "completed",
      sourcingError: undefined,
      sourcingCompletedAt: now,
      updatedAt: now,
    })
  },
})
