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

export default function LoginPage() {
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

    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message ?? "Failed to sign in")
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
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {candidateAllowed
              ? "Use your invite to continue as a candidate, or switch back to recruiter sign in."
              : candidatePending
                ? "Loading your invite details before candidate sign in."
              : "Enter your email and password to continue"}
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="mt-2 flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup?role=${selectedRole}${email ? `&email=${encodeURIComponent(email)}` : ""}${searchParams.get("invite") ? `&invite=${searchParams.get("invite")}` : ""}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
