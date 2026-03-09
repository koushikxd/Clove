import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // ── Job postings created by recruiters ──
  jobs: defineTable({
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
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("closed")
    ),
    recruiterId: v.string(), // BetterAuth user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_recruiter", ["recruiterId"])
    .index("by_status", ["status"])
    .index("by_recruiter_status", ["recruiterId", "status"]),

  // ── Sourced / invited candidates per job ──
  candidates: defineTable({
    jobId: v.id("jobs"),
    name: v.string(),
    email: v.string(),
    linkedinUrl: v.optional(v.string()),
    source: v.union(v.literal("exa"), v.literal("manual")),
    status: v.union(
      v.literal("sourced"),
      v.literal("invited"),
      v.literal("accepted"),
      v.literal("interviewing"),
      v.literal("interviewed"),
      v.literal("shortlisted"),
      v.literal("rejected")
    ),
    resumeStorageId: v.optional(v.id("_storage")), // Convex file storage
    inviteToken: v.optional(v.string()),
    invitedAt: v.optional(v.number()),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_job", ["jobId"])
    .index("by_job_status", ["jobId", "status"])
    .index("by_email", ["email"])
    .index("by_invite_token", ["inviteToken"]),

  // ── Interview sessions ──
  interviews: defineTable({
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    totalTurns: v.number(),
    overallScore: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_candidate", ["candidateId"])
    .index("by_job", ["jobId"])
    .index("by_status", ["status"]),

  // ── Individual Q&A turns within an interview ──
  interviewTurns: defineTable({
    interviewId: v.id("interviews"),
    role: v.union(v.literal("ai"), v.literal("candidate")),
    content: v.string(),
    turnIndex: v.number(),
    isPartial: v.boolean(),
    finalizedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_interview_index", ["interviewId", "turnIndex"]),

  // ── AI evaluation of completed interviews ──
  evaluations: defineTable({
    interviewId: v.id("interviews"),
    candidateId: v.id("candidates"),
    jobId: v.id("jobs"),
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
    createdAt: v.number(),
  })
    .index("by_interview", ["interviewId"])
    .index("by_job", ["jobId"])
    .index("by_job_recommendation", ["jobId", "recommendation"]),
})
