import { Suspense } from "react"
import { AuthCompletePageClient } from "@/components/auth/auth-complete-page-client"

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
          Finalizing your account…
        </div>
      }
    >
      <AuthCompletePageClient />
    </Suspense>
  )
}
