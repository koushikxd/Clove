"use server"

import { revalidatePath } from "next/cache"
import { Resend } from "resend"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server"
import { inngest } from "@/inngest/client"
import { buildCandidateInviteLink } from "@/lib/invite"

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

export async function sendDemoInviteAction(candidateId: string) {
  const payload = await fetchAuthMutation(api.candidates.issueDemoInvite, {
    candidateId: candidateId as Id<"candidates">,
  })

  const toEmail = process.env.EMAIL_ADDRESS
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL

  if (!toEmail) {
    throw new Error("Missing EMAIL_ADDRESS")
  }
  if (!siteUrl) {
    throw new Error("Missing site URL")
  }
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY")
  }

  const inviteLink = buildCandidateInviteLink({
    baseUrl: siteUrl,
    email: payload.candidateEmail,
    inviteToken: payload.inviteToken,
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: toEmail,
    subject: "Invite emails sent (from: onboarding@resend.dev)",
    html: `
      <p>This is a demo invite email. It was sent to your configured demo inbox instead of the sourced candidate.</p>
      <p><strong>Original candidate:</strong> ${payload.candidateName} (${payload.candidateEmail})</p>
      <p><strong>Job:</strong> ${payload.jobTitle}</p>
      <p><a href="${inviteLink}">Open candidate invite flow</a></p>
    `,
    text: [
      "This is a demo invite email.",
      `Original candidate: ${payload.candidateName} (${payload.candidateEmail})`,
      `Job: ${payload.jobTitle}`,
      `Invite link: ${inviteLink}`,
    ].join("\n"),
  })

  revalidatePath("/")
}
