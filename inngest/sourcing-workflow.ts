import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { ConvexHttpClient } from "convex/browser"
import Exa from "exa-js"
import { Resend } from "resend"
import { z } from "zod"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { buildCandidateInviteLink } from "@/lib/invite"
import { inngest } from "./client"

const searchCriteriaSchema = z.object({
  query: z.string(),
  titles: z.array(z.string()).default([]),
  mustHaves: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
})

const sourcedCandidateSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  headline: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  sourceSnippet: z.string().optional(),
  matchScore: z.number().min(0).max(100).optional(),
  matchReason: z.string().optional(),
})

const sourcingOutputSchema = z.object({
  candidates: z.array(sourcedCandidateSchema),
})

type SearchCriteria = z.infer<typeof searchCriteriaSchema>
type SourcedCandidate = z.infer<typeof sourcedCandidateSchema>

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

async function buildSearchCriteria(job: Doc<"jobs">) {
  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: searchCriteriaSchema,
    system:
      "You create concise sourcing criteria for recruiters. Focus on job titles, must-have skills, and location signals. Keep the query practical for web search.",
    prompt: `
Job title: ${job.title}
Location: ${job.location}
Work type: ${job.type}
Salary min: ${job.salaryMin ?? "unknown"}
Salary max: ${job.salaryMax ?? "unknown"}
Requirements: ${job.requirements.join(", ")}
Description:
${job.description}
    `,
  })

  return object
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/)
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
  }
}

function extractLinkedInUrl(url: string) {
  return url.includes("linkedin.com") ? url : undefined
}

function buildSearchQuery(criteria: SearchCriteria) {
  const titlePart =
    criteria.titles.length > 0 ? `(${criteria.titles.join(" OR ")})` : ""
  const skillsPart =
    criteria.mustHaves.length > 0 ? criteria.mustHaves.join(" ") : ""
  const locationPart =
    criteria.locations.length > 0 ? criteria.locations.join(" OR ") : ""

  return [criteria.query, titlePart, skillsPart, locationPart]
    .filter(Boolean)
    .join(" ")
}

async function searchExaCandidates(criteria: SearchCriteria) {
  const exaKey = process.env.EXA_API_KEY
  if (!exaKey) {
    throw new Error("Missing EXA_API_KEY")
  }

  const exa = new Exa(exaKey)
  const query = buildSearchQuery(criteria)
  const response = await exa.search(query, {
    numResults: 8,
    type: "auto",
    contents: {
      text: {
        maxCharacters: 1200,
      },
    },
  })

  return response.results
}

async function scoreCandidates(
  job: Doc<"jobs">,
  criteria: SearchCriteria,
  results: Awaited<ReturnType<typeof searchExaCandidates>>
) {
  const normalizedInput = results.map((result) => ({
    title: result.title ?? "",
    url: result.url,
    text:
      typeof result.text === "string"
        ? result.text.slice(0, 1200)
        : "",
  }))

  const { object } = await generateObject({
    model: google("gemini-2.5-flash"),
    schema: sourcingOutputSchema,
    system:
      "You are a recruiter sourcing assistant. Extract candidate-like profiles from search results, infer the most likely person name and email when present, summarize fit, and score fit from 0 to 100. Only return records that look like individual candidates.",
    prompt: JSON.stringify({
      job: {
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        location: job.location,
        type: job.type,
      },
      searchCriteria: criteria,
      searchResults: normalizedInput,
    }),
  })

  return object.candidates
}

function dedupeCandidates(candidates: SourcedCandidate[]) {
  const seen = new Map<string, SourcedCandidate>()

  for (const candidate of candidates) {
    const key = candidate.email.toLowerCase()
    const existing = seen.get(key)
    if (!existing || (candidate.matchScore ?? 0) > (existing.matchScore ?? 0)) {
      seen.set(key, candidate)
    }
  }

  return [...seen.values()]
}

async function runSourcingWorker(job: Doc<"jobs">) {
  const criteria = await buildSearchCriteria(job)
  const exaResults = await searchExaCandidates(criteria)
  const aiCandidates = await scoreCandidates(job, criteria, exaResults)

  const hydrated = aiCandidates.map((candidate, index) => {
    const fallbackResult = exaResults[index]
    const split = splitName(candidate.name)

    return {
      ...candidate,
      firstName: candidate.firstName ?? split.firstName,
      lastName: candidate.lastName ?? split.lastName,
      sourceUrl: candidate.sourceUrl ?? fallbackResult?.url,
      linkedinUrl:
        candidate.linkedinUrl ??
        (fallbackResult ? extractLinkedInUrl(fallbackResult.url) : undefined),
      headline: candidate.headline ?? fallbackResult?.title ?? undefined,
      sourceSnippet:
        candidate.sourceSnippet ??
        (typeof fallbackResult?.text === "string"
          ? fallbackResult.text.slice(0, 280)
          : undefined),
    }
  })

  return {
    searchCriteria: criteria,
    candidates: dedupeCandidates(hydrated),
  }
}

async function sendDemoInviteEmail(payload: {
  inviteEmail: string
  inviteToken: string
  job: {
    title: string
    description: string
    location: string
    type: string
    requirements: string[]
  }
  seedCandidate: {
    name: string
    email: string
    headline?: string
    matchScore?: number
    summary?: string
  }
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL

  if (!resendApiKey || !siteUrl) {
    throw new Error("Missing invite email configuration")
  }

  const resend = new Resend(resendApiKey)
  const inviteLink = buildCandidateInviteLink({
    baseUrl: siteUrl,
    email: payload.seedCandidate.email,
    inviteToken: payload.inviteToken,
  })

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: payload.inviteEmail,
    subject: `Interview invitation for ${payload.job.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">Interview invitation</h1>
        <p style="margin: 0 0 16px;">This is the demo interview invite for the job below.</p>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <p style="margin: 0 0 8px;"><strong>${payload.job.title}</strong></p>
          <p style="margin: 0 0 8px;">${payload.job.location} · ${payload.job.type}</p>
          <p style="margin: 0 0 8px;">${payload.job.description}</p>
          <p style="margin: 0;"><strong>Requirements:</strong> ${payload.job.requirements.join(", ")}</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px;"><strong>Seed candidate from sourcing</strong></p>
          <p style="margin: 0 0 8px;">${payload.seedCandidate.name} (${payload.seedCandidate.email})</p>
          <p style="margin: 0 0 8px;">${payload.seedCandidate.headline ?? "Profile sourced from Exa"}</p>
          <p style="margin: 0;">${payload.seedCandidate.summary ?? ""}</p>
        </div>
        <a href="${inviteLink}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 600;">
          Accept invite
        </a>
      </div>
    `,
    text: [
      `Interview invitation for ${payload.job.title}`,
      `${payload.job.location} · ${payload.job.type}`,
      payload.job.description,
      `Requirements: ${payload.job.requirements.join(", ")}`,
      `Seed candidate: ${payload.seedCandidate.name} (${payload.seedCandidate.email})`,
      `Accept invite: ${inviteLink}`,
    ].join("\n"),
  })
}

export const sourcingWorkflow = inngest.createFunction(
  { id: "sourcing-workflow" },
  { event: "job.created" },
  async ({ event, step }) => {
    const convex = getConvexClient()
    const workflowSecret = getWorkflowSecret()
    const jobId = event.data.jobId as Id<"jobs">

    await step.run("mark-sourcing-started", async () => {
      await convex.mutation(api.sourcing.markSourcingStarted, {
        jobId,
        workflowSecret,
      })
    })

    try {
      const job = await step.run("load-job", async () => {
        return await convex.query(api.sourcing.getJobForWorkflow, {
          jobId,
          workflowSecret,
        })
      })

      if (!job) {
        throw new Error("Job not found")
      }

      const sourcingResult = await step.run("source-candidates", async () => {
        return await runSourcingWorker(job)
      })

      await step.run("persist-sourcing-results", async () => {
        await convex.mutation(api.sourcing.saveSourcingResults, {
          jobId,
          workflowSecret,
          searchCriteria: sourcingResult.searchCriteria,
          candidates: sourcingResult.candidates,
        })
      })

      const demoInvite = await step.run("create-demo-invite", async () => {
        if (!process.env.EMAIL_ADDRESS) {
          throw new Error("Missing EMAIL_ADDRESS")
        }

        return await convex.mutation(api.jobInvites.createOrRefreshDemoInvite, {
          jobId,
          workflowSecret,
          inviteEmail: process.env.EMAIL_ADDRESS,
        })
      })

      if (demoInvite) {
        await step.run("send-demo-invite-email", async () => {
          await sendDemoInviteEmail(demoInvite)
        })
      }

      return {
        candidateCount: sourcingResult.candidates.length,
      }
    } catch (error) {
      await step.run("mark-sourcing-failed", async () => {
        await convex.mutation(api.sourcing.markSourcingFailed, {
          jobId,
          error: error instanceof Error ? error.message : "Sourcing failed",
          workflowSecret,
        })
      })

      throw error
    }
  }
)
