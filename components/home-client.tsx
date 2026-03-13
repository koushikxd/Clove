"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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
    if (viewer?.appUser.role === "candidate" && candidateHomeState?.inviteToken) {
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
            onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => router.replace("/") } })}
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
            Create jobs, run sourcing, review candidates, and track demo invites.
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
                  setForm((current) => ({ ...current, title: event.target.value }))
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
            <Button type="submit" disabled={isCreating || parsedRequirements.length === 0}>
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
                  Demo invite {job.invite.status} and sent to {job.invite.inviteEmail}.
                </div>
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
