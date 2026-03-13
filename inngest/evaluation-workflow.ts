import { ConvexHttpClient } from "convex/browser"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { runEvaluationWorker } from "@/convex/lib/evaluationWorker"
import { buildJobAwareResumeContext } from "@/convex/lib/resume"
import { inngest } from "./client"

function getConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL")
  }
  return new ConvexHttpClient(url)
}

function getWorkflowSecret() {
  const secret = process.env.WORKFLOW_SECRET
  if (!secret) {
    throw new Error("Missing WORKFLOW_SECRET")
  }
  return secret
}

export const evaluationWorkflow = inngest.createFunction(
  { id: "evaluation-workflow" },
  { event: "interview.completed" },
  async ({ event, step }) => {
    const convex = getConvexClient()
    const workflowSecret = getWorkflowSecret()
    const interviewId = event.data.interviewId as Id<"interviews">

    const context = await step.run("load-evaluation-context", async () => {
      return await convex.query(
        api.evaluations.getEvaluationContextForWorkflow,
        {
          interviewId,
          workflowSecret,
        }
      )
    })

    if (!context || context.existingEvaluation) {
      return {
        skipped: true,
      }
    }

    const workerResult = await step.run("run-evaluation-worker", async () => {
      const resumeContext = buildJobAwareResumeContext({
        job: context.job,
        resumeText: context.candidateProfile?.resumeText,
        yearsOfExperience: context.candidateProfile?.yearsOfExperience,
      })

      return await runEvaluationWorker({
        job: context.job,
        candidate: {
          name: context.candidate.name,
          email: context.candidate.email,
          yearsOfExperience: context.candidateProfile?.yearsOfExperience,
          resumeContext,
        },
        turns: context.transcript,
      })
    })

    await step.run("save-evaluation", async () => {
      await convex.mutation(api.evaluations.saveWorkflowEvaluation, {
        interviewId,
        workflowSecret,
        ...workerResult,
      })
    })

    return {
      recommendation: workerResult.recommendation,
      overallScore: workerResult.scores.overall,
    }
  }
)
