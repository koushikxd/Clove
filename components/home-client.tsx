"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { triggerJobCreatedAction } from "@/app/actions"
import { authClient } from "@/lib/auth-client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type JobType = "remote" | "onsite" | "hybrid"

export function HomeClient() {
  const router = useRouter()
  const session = authClient.useSession()
  const viewer = useQuery(api.appUsers.getViewer, session.data ? {} : "skip")
  const candidateHomeState = useQuery(
    api.interviews.getCandidateHomeState,
    session.data && viewer?.appUser.role === "candidate" ? {} : "skip"
  )

  useEffect(() => {
    if (viewer?.appUser?.onboardingStatus === "pending") {
      router.replace("/onboarding")
    }
  }, [router, viewer?.appUser?.onboardingStatus])

  useEffect(() => {
    if (
      viewer?.appUser.role === "candidate" &&
      candidateHomeState?.inviteToken
    ) {
      router.replace(`/interview/${candidateHomeState.inviteToken}`)
    }
  }, [candidateHomeState?.inviteToken, router, viewer?.appUser.role])

  if (session.isPending || (session.data && viewer === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!session.data) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clove</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered recruiting platform
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Link href="/login" className={cn(buttonVariants(), "w-full")}>
              Sign in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!viewer) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Finalizing your account…
      </div>
    )
  }

  if (viewer.appUser.onboardingStatus !== "completed") {
    return null
  }

  if (viewer.appUser.role === "candidate") {
    return (
      <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clove</h1>
            <p className="text-sm text-muted-foreground">
              Candidate dashboard is intentionally empty for this phase.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              authClient.signOut({
                fetchOptions: { onSuccess: () => router.replace("/") },
              })
            }
          >
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return <RecruiterDashboard />
}

function RecruiterDashboard() {
  const router = useRouter()
  const jobs = useQuery(api.jobs.listForRecruiter, {})
  const createJob = useMutation(api.jobs.create)
  const [isCreating, startCreateTransition] = useTransition()
  const [expandedShortlistJobId, setExpandedShortlistJobId] =
    useState<Id<"jobs"> | null>(null)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    type: "remote" as JobType,
    salaryMin: "",
    salaryMax: "",
  })

  const parsedRequirements = useMemo(
    () =>
      form.requirements
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [form.requirements]
  )
  const shortlistedCandidates = useQuery(
    api.evaluations.getShortlistedForJob,
    expandedShortlistJobId ? { jobId: expandedShortlistJobId } : "skip"
  )

  async function handleCreateJob(event: React.FormEvent) {
    event.preventDefault()
    setError("")

    startCreateTransition(async () => {
      try {
        const jobId = await createJob({
          title: form.title,
          description: form.description,
          requirements: parsedRequirements,
          location: form.location,
          type: form.type,
          salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
          salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        })

        await triggerJobCreatedAction(jobId)

        setForm({
          title: "",
          description: "",
          requirements: "",
          location: "",
          type: "remote",
          salaryMin: "",
          salaryMax: "",
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create job")
      }
    })
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Recruiter dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Create jobs, run sourcing, review candidates, and track demo
            invites.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            authClient.signOut({
              fetchOptions: { onSuccess: () => router.replace("/") },
            })
          }
        >
          Sign out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create job</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleCreateJob}>
            <div className="grid gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                required
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="requirements">Requirements</Label>
              <Input
                id="requirements"
                required
                placeholder="TypeScript, React, hiring, SaaS"
                value={form.requirements}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    requirements: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  required
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="h-9 rounded-md border bg-transparent px-3 text-sm"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as JobType,
                    }))
                  }
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">Onsite</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="salaryMin">Min salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={form.salaryMin}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        salaryMin: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="salaryMax">Max salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={form.salaryMax}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        salaryMax: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="submit"
              disabled={isCreating || parsedRequirements.length === 0}
            >
              {isCreating ? "Creating and queueing sourcing…" : "Create job"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {(jobs ?? []).map((job) => (
          <Card key={job._id}>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span>{job.title}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {job.location} · {job.type} · sourcing {job.sourcingStatus}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-sm text-muted-foreground">{job.description}</p>
              {job.searchCriteria ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="font-medium">Search criteria</p>
                  <p className="mt-1 text-muted-foreground">
                    {job.searchCriteria.query}
                  </p>
                </div>
              ) : null}
              {job.sourcingError ? (
                <p className="text-sm text-destructive">{job.sourcingError}</p>
              ) : null}
              {job.invite ? (
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  Demo invite {job.invite.status} and sent to{" "}
                  {job.invite.inviteEmail}.
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Shortlisted candidates</p>
                  <p className="text-sm text-muted-foreground">
                    Review final interview results, transcript, and contact
                    info.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setExpandedShortlistJobId((current) =>
                      current === job._id ? null : job._id
                    )
                  }
                >
                  {expandedShortlistJobId === job._id
                    ? "Hide shortlisted candidates"
                    : "View shortlisted candidates"}
                </Button>
              </div>
              {expandedShortlistJobId === job._id ? (
                <ShortlistedCandidatesSection
                  isLoading={shortlistedCandidates === undefined}
                  candidates={shortlistedCandidates ?? []}
                />
              ) : null}
              <div className="grid gap-3">
                {job.candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No sourced candidates yet.
                  </p>
                ) : null}
                {job.candidates.map((candidate) => (
                  <div
                    key={candidate._id}
                    className="rounded-md border p-4 text-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-muted-foreground">{candidate.email}</p>
                      <p className="text-muted-foreground">
                        {candidate.headline ?? "No headline"}
                      </p>
                      <p className="text-muted-foreground">
                        Status: {candidate.status}
                        {candidate.matchScore !== undefined
                          ? ` · Fit ${candidate.matchScore}/100`
                          : ""}
                      </p>
                      {candidate.matchReason ? (
                        <p className="text-muted-foreground">
                          {candidate.matchReason}
                        </p>
                      ) : null}
                      {candidate.sourceUrl ? (
                        <a
                          className="text-foreground underline underline-offset-4"
                          href={candidate.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open profile
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ShortlistedCandidatesSection({
  candidates,
  isLoading,
}: {
  candidates: Array<{
    evaluationId: string
    candidate: {
      id: string
      name: string
      email: string
      headline?: string
      location?: string
      summary?: string
      phoneNumber?: string
      yearsOfExperience?: number
    }
    interview: {
      id: string
      status: string
      completedAt?: number
      endedReason?: string
      overallScore?: number
    }
    evaluation: {
      scores: {
        technicalSkills: number
        communication: number
        problemSolving: number
        cultureFit: number
        overall: number
      }
      summary: string
      recommendation: string
      createdAt: number
    }
    transcript: Array<{
      id: string
      role: "ai" | "candidate"
      content: string
      questionIndex: number
      turnIndex: number
      createdAt: number
    }>
  }>
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Loading shortlisted candidates…
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        No shortlisted candidates yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {candidates.map((entry) => (
        <div key={entry.evaluationId} className="rounded-md border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-base font-medium">{entry.candidate.name}</p>
              <p className="text-sm text-muted-foreground">
                {entry.candidate.email}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.candidate.headline ?? "No headline available"}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.candidate.location ?? "Location unavailable"}
                {entry.candidate.yearsOfExperience !== undefined
                  ? ` · ${entry.candidate.yearsOfExperience} years experience`
                  : ""}
              </p>
              {entry.candidate.phoneNumber ? (
                <p className="text-sm text-muted-foreground">
                  Phone: {entry.candidate.phoneNumber}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="rounded-full border px-3 py-1 text-sm font-medium">
                Overall score {entry.evaluation.scores.overall}/100
              </div>
              <Button variant="outline" disabled>
                Send email
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <ScoreCard
              label="Technical"
              value={entry.evaluation.scores.technicalSkills}
            />
            <ScoreCard
              label="Communication"
              value={entry.evaluation.scores.communication}
            />
            <ScoreCard
              label="Problem solving"
              value={entry.evaluation.scores.problemSolving}
            />
            <ScoreCard
              label="Culture fit"
              value={entry.evaluation.scores.cultureFit}
            />
            <ScoreCard
              label="Overall"
              value={entry.evaluation.scores.overall}
            />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-md border p-4 text-sm">
              <p className="font-medium">Final result</p>
              <p className="mt-2 text-muted-foreground">
                {entry.evaluation.summary}
              </p>
              {entry.candidate.summary ? (
                <p className="mt-3 text-muted-foreground">
                  {entry.candidate.summary}
                </p>
              ) : null}
              {entry.interview.endedReason ? (
                <p className="mt-3 text-muted-foreground">
                  Interview ended: {entry.interview.endedReason}
                </p>
              ) : null}
            </div>

            <div className="rounded-md border p-4 text-sm">
              <p className="font-medium">Interview transcript</p>
              <div className="mt-3 grid gap-3">
                {entry.transcript.map((turn) => (
                  <div key={turn.id} className="rounded-md border p-3">
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      {turn.role === "ai" ? "AI" : "Candidate"} · Q
                      {turn.questionIndex + 1}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-foreground">
                      {turn.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}/100</p>
    </div>
  )
}
