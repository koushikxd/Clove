"use server"

import { revalidatePath } from "next/cache"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { fetchAuthQuery } from "@/lib/auth-server"
import { inngest } from "@/inngest/client"

export async function triggerJobCreatedAction(jobId: Id<"jobs">) {
  const job = await fetchAuthQuery(api.jobs.getOwnedJob, {
    jobId,
  })

  if (!job) {
    throw new Error("Job not found")
  }

  await inngest.send({
    name: "job.created",
    data: {
      jobId,
    },
  })

  revalidatePath("/")
}
