"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { authClient } from "@/lib/auth-client"

export function AuthCompletePageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ensureCurrentUser = useMutation(api.appUsers.ensureCurrentUser)
  const session = authClient.useSession()
  const [error, setError] = useState("")
  const ranRef = useRef(false)

  useEffect(() => {
    if (!session.data || ranRef.current) {
      return
    }

    ranRef.current = true

    const role = searchParams.get("role")
    const invite = searchParams.get("invite")

    void ensureCurrentUser({
      roleHint: role === "candidate" || role === "recruiter" ? role : undefined,
      inviteToken: invite ?? undefined,
    })
      .then(() => {
        router.replace(invite ? `/onboarding?invite=${invite}` : "/")
      })
      .catch((err) => {
        ranRef.current = false
        setError(
          err instanceof Error ? err.message : "Failed to initialize user"
        )
      })
  }, [ensureCurrentUser, router, searchParams, session.data])

  useEffect(() => {
    if (!session.isPending && !session.data) {
      router.replace("/login")
    }
  }, [router, session.data, session.isPending])

  if (session.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
        Signing you in…
      </div>
    )
  }

  if (!session.data) {
    return null
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
      {error || "Finalizing your account…"}
    </div>
  )
}
