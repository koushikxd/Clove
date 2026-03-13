import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import type { Doc } from "../_generated/dataModel"
import { z } from "zod"

export const evaluationWorkerSchema = z.object({
  scores: z.object({
    technicalSkills: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    cultureFit: z.number().min(0).max(100),
    overall: z.number().min(0).max(100),
  }),
  summary: z.string(),
  recommendation: z.union([
    z.literal("shortlist"),
    z.literal("reject"),
    z.literal("maybe"),
  ]),
})

export type EvaluationWorkerTurn = {
  role: "ai" | "candidate"
  content: string
  questionIndex: number
}

export async function runEvaluationWorker(args: {
  job: Doc<"jobs">
  candidate: {
    name: string
    email: string
    yearsOfExperience?: number
    resumeContext?: string
  }
  turns: EvaluationWorkerTurn[]
}) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: evaluationWorkerSchema,
    system:
      "You are an evaluation worker for a recruiting app. Review the interview transcript against the job requirements and produce a fair hiring recommendation. Reward concrete evidence, ownership, communication clarity, and problem solving. Be conservative about shortlisting when evidence is weak.",
    prompt: JSON.stringify({
      job: {
        title: args.job.title,
        description: args.job.description,
        requirements: args.job.requirements,
        location: args.job.location,
        type: args.job.type,
      },
      candidate: args.candidate,
      transcript: args.turns,
    }),
  })

  return {
    ...object,
    summary: object.summary.trim(),
  }
}
