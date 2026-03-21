import { Suspense } from "react"
import { OnboardingPageClient } from "@/components/auth/onboarding-page-client"

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
          Loading onboarding…
        </div>
      }
    >
      <OnboardingPageClient />
    </Suspense>
  )
}
