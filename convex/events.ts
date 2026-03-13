import { v } from "convex/values"
import { action } from "./_generated/server"
import { emitWorkflowEvent } from "./lib/inngest"

export const emitJobCreated = action({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (_, args) => {
    return await emitWorkflowEvent({
      name: "job.created",
      data: {
        jobId: args.jobId,
      },
    })
  },
})

export const emitInterviewCompleted = action({
  args: {
    interviewId: v.id("interviews"),
  },
  handler: async (_, args) => {
    return await emitWorkflowEvent({
      name: "interview.completed",
      data: {
        interviewId: args.interviewId,
      },
    })
  },
})
