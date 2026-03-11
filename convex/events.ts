import { v } from "convex/values"
import { action } from "./_generated/server"
import { requireEnv } from "./lib/auth"

export const emitJobCreated = action({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (_, args) => {
    const baseUrl = requireEnv("NEXT_PUBLIC_SITE_URL")

    const response = await fetch(`${baseUrl}/api/inngest/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-workflow-secret": requireEnv("WORKFLOW_SECRET"),
      },
      body: JSON.stringify({
        name: "job.created",
        data: {
          jobId: args.jobId,
        },
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to emit job.created event")
    }

    return await response.json()
  },
})
