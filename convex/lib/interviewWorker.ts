import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import type { Doc } from "../_generated/dataModel"
import { z } from "zod"

const interviewWorkerSchema = z.object({
  nextQuestion: z.string().default(""),
  reasoningSummary: z.string(),
  shouldEnd: z.boolean(),
  endedReason: z.string().optional(),
})

export type WorkerTurn = {
  role: "ai" | "candidate"
  content: string
  questionIndex: number
}

export async function runInterviewWorker(args: {
  job: Doc<"jobs">
  candidate: {
    name: string
    email: string
    yearsOfExperience?: number
    resumeContext?: string
  }
  turns: WorkerTurn[]
  minQuestions: number
  maxQuestions: number
  finalizedQuestionCount: number
}) {
  if (args.finalizedQuestionCount >= args.maxQuestions) {
    return {
      nextQuestion: "",
      reasoningSummary: "Reached the maximum allowed interview questions.",
      shouldEnd: true,
      endedReason: "Reached the maximum question limit.",
    }
  }

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: interviewWorkerSchema,
    system:
      "You are an interview worker for a recruiting app. Ask one concise, high-signal interview question at a time. Ground each question in the job requirements and the candidate resume context when available. Probe claimed experience, missing evidence, depth of ownership, and tradeoffs. Never ask multiple questions in one turn.",
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
      constraints: {
        minQuestions: args.minQuestions,
        maxQuestions: args.maxQuestions,
        finalizedQuestionCount: args.finalizedQuestionCount,
      },
    }),
  })

  if (args.finalizedQuestionCount < args.minQuestions) {
    return {
      ...object,
      shouldEnd: false,
      endedReason: undefined,
      nextQuestion:
        object.nextQuestion.trim() ||
        getFallbackQuestion(args.job, args.finalizedQuestionCount),
    }
  }

  return {
    ...object,
    nextQuestion:
      object.shouldEnd && !object.nextQuestion.trim()
        ? ""
        : object.nextQuestion.trim() ||
          getFallbackQuestion(args.job, args.finalizedQuestionCount),
  }
}

function getFallbackQuestion(job: Doc<"jobs">, finalizedQuestionCount: number) {
  const requirement =
    job.requirements[finalizedQuestionCount] ?? job.requirements[0]

  if (finalizedQuestionCount === 0) {
    return `Tell me about your background and how it prepares you for this ${job.title} role.`
  }

  if (requirement) {
    return `Can you walk me through a real example where you used ${requirement}?`
  }

  return `What is one challenging problem you solved recently that is relevant to this role?`
}
