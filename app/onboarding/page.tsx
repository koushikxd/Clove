"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = authClient.useSession()
  const viewer = useQuery(api.appUsers.getViewer, session.data ? {} : "skip")
  const ensureCurrentUser = useMutation(api.appUsers.ensureCurrentUser)
  const inviteToken = searchParams.get("invite") ?? undefined
  const inviteDetails = useQuery(
    api.jobInvites.getPublicInvite,
    inviteToken ? { inviteToken } : "skip"
  )
  const initRef = useRef(false)

  useEffect(() => {
    if (session.isPending || !session.data || viewer || initRef.current) {
      return
    }

    initRef.current = true

    void ensureCurrentUser({
      roleHint: inviteToken ? "candidate" : undefined,
      inviteToken,
    }).catch(() => {
      initRef.current = false
    })
  }, [ensureCurrentUser, inviteToken, session.data, session.isPending, viewer])

  useEffect(() => {
    if (!session.isPending && !session.data) {
      const loginUrl = new URL("/login", window.location.origin)
      if (inviteToken) {
        loginUrl.searchParams.set("role", "candidate")
        loginUrl.searchParams.set("invite", inviteToken)
        if (inviteDetails?.seedCandidate?.email) {
          loginUrl.searchParams.set("email", inviteDetails.seedCandidate.email)
        }
      }
      router.replace(`${loginUrl.pathname}${loginUrl.search}`)
    }
  }, [inviteDetails?.seedCandidate?.email, inviteToken, router, session.data, session.isPending])

  useEffect(() => {
    if (viewer?.appUser.onboardingStatus === "completed") {
      if (inviteToken) {
        router.replace(`/interview/${inviteToken}`)
        return
      }
      router.replace("/")
    }
  }, [inviteToken, router, viewer?.appUser.onboardingStatus])

  if (session.isPending || (session.data && viewer === undefined)) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Loading onboarding…
      </div>
    )
  }

  if (!viewer) {
    return null
  }

  return viewer.appUser.role === "recruiter" ? (
    <RecruiterOnboarding />
  ) : (
    <CandidateOnboarding inviteToken={inviteToken} inviteDetails={inviteDetails} />
  )
}

function RecruiterOnboarding() {
  const router = useRouter()
  const completeOnboarding = useMutation(api.appUsers.completeRecruiterOnboarding)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError("")

    try {
      await completeOnboarding(form)
      router.replace("/")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recruiter onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field
              id="firstName"
              label="First name"
              value={form.firstName}
              onChange={(value) =>
                setForm((current) => ({ ...current, firstName: value }))
              }
            />
            <Field
              id="lastName"
              label="Last name"
              value={form.lastName}
              onChange={(value) =>
                setForm((current) => ({ ...current, lastName: value }))
              }
            />
            <Field
              id="companyName"
              label="Company name"
              value={form.companyName}
              onChange={(value) =>
                setForm((current) => ({ ...current, companyName: value }))
              }
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function CandidateOnboarding({
  inviteToken,
  inviteDetails,
}: {
  inviteToken?: string
  inviteDetails:
    | {
        inviteEmail: string
        seedCandidate:
          | {
              email: string
              name: string
            }
          | null
        job:
          | {
              id: string
              title: string
            }
          | null
        inviteToken: string
      }
    | null
    | undefined
}) {
  const router = useRouter()
  const generateResumeUploadUrl = useMutation(api.appUsers.generateResumeUploadUrl)
  const completeOnboarding = useMutation(api.appUsers.completeCandidateOnboarding)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resume, setResume] = useState<File | null>(null)
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    yearsOfExperience: "",
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!resume) {
      setError("Resume is required")
      return
    }

    setLoading(true)
    setError("")

    try {
      let resumeText: string | undefined
      const extractionPayload = new FormData()
      extractionPayload.append("resume", resume)
      const extractionResponse = await fetch("/api/resume/extract", {
        method: "POST",
        body: extractionPayload,
      })

      if (extractionResponse.ok) {
        const extractionResult = (await extractionResponse.json()) as {
          resumeText?: string
        }
        resumeText = extractionResult.resumeText
      }

      const uploadUrl = await generateResumeUploadUrl({})
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": resume.type || "application/pdf",
        },
        body: resume,
      })

      if (!uploadResult.ok) {
        throw new Error("Failed to upload resume")
      }

      const { storageId } = (await uploadResult.json()) as { storageId: string }

      await completeOnboarding({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        yearsOfExperience: Number(form.yearsOfExperience),
        resumeStorageId: storageId as Id<"_storage">,
        resumeFileName: resume.name,
        resumeMimeType: resume.type || "application/octet-stream",
        resumeText,
        inviteToken,
      })

      if (inviteToken) {
        router.replace(`/interview/${inviteToken}`)
        return
      }

      router.replace("/")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Candidate onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            {inviteDetails ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                Invited for {inviteDetails.job?.title ?? "a role"} as{" "}
                {inviteDetails.inviteEmail}
              </div>
            ) : null}
            <Field
              id="firstName"
              label="First name"
              value={form.firstName}
              onChange={(value) =>
                setForm((current) => ({ ...current, firstName: value }))
              }
            />
            <Field
              id="lastName"
              label="Last name"
              value={form.lastName}
              onChange={(value) =>
                setForm((current) => ({ ...current, lastName: value }))
              }
            />
            <Field
              id="phoneNumber"
              label="Phone number"
              value={form.phoneNumber}
              onChange={(value) =>
                setForm((current) => ({ ...current, phoneNumber: value }))
              }
            />
            <Field
              id="yearsOfExperience"
              label="Years of experience"
              type="number"
              value={form.yearsOfExperience}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  yearsOfExperience: value,
                }))
              }
            />
            <div className="grid gap-1.5">
              <Label htmlFor="resume">Resume</Label>
              <Input
                id="resume"
                type="file"
                accept=".pdf,.doc,.docx"
                required
                onChange={(event) =>
                  setResume(event.target.files?.[0] ?? null)
                }
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"]
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
