"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "convex/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get("invite") ?? undefined
  const invite = useQuery(
    api.jobInvites.getPublicInvite,
    inviteToken ? { inviteToken } : "skip"
  )
  const defaultRole =
    searchParams.get("role") === "candidate" && inviteToken
      ? "candidate"
      : "recruiter"
  const [role, setRole] = useState<"recruiter" | "candidate">(defaultRole)
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inviteState = !inviteToken
    ? "absent"
    : invite === undefined
      ? "loading"
      : invite
        ? "valid"
        : "invalid"
  const candidateAllowed = inviteState === "valid"
  const candidatePending = inviteState === "loading"
  const selectedRole =
    role === "candidate" && (candidateAllowed || candidatePending)
      ? "candidate"
      : "recruiter"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (selectedRole === "candidate" && candidatePending) {
      setLoading(false)
      setError("Loading invite details. Please try again in a moment.")
      return
    }

    if (selectedRole === "candidate" && !candidateAllowed) {
      setLoading(false)
      setError("Candidate access is invite-only")
      return
    }

    const { error } = await authClient.signUp.email({
      name: email.split("@")[0] || "User",
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Failed to create account")
      return
    }

    const params = new URLSearchParams({ role: selectedRole, email })
    if (inviteToken) {
      params.set("invite", inviteToken)
    }

    router.push(`/auth/complete?${params.toString()}`)
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            {candidateAllowed
              ? "Create the invited candidate account or switch back to recruiter signup."
              : candidatePending
                ? "Loading your invite details before candidate signup."
                : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role">I am a</Label>
              <select
                id="role"
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                value={selectedRole}
                onChange={(event) =>
                  setRole(event.target.value as "recruiter" | "candidate")
                }
              >
                <option value="recruiter">Recruiter</option>
                {candidateAllowed || candidatePending ? (
                  <option value="candidate">Candidate</option>
                ) : null}
              </select>
            </div>
            {candidateAllowed ? (
              <p className="text-sm text-muted-foreground">
                Invite loaded for {invite?.job?.title ?? "this interview"}.
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="mt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={`/login?role=${selectedRole}${email ? `&email=${encodeURIComponent(email)}` : ""}${searchParams.get("invite") ? `&invite=${searchParams.get("invite")}` : ""}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
