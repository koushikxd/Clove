import { Suspense } from "react"
import { SignUpPageClient } from "@/components/auth/signup-page-client"

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
          Loading sign up…
        </div>
      }
    >
      <SignUpPageClient />
    </Suspense>
  )
}
