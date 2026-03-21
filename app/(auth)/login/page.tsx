import { Suspense } from "react"
import { LoginPageClient } from "@/components/auth/login-page-client"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center p-6 text-sm text-muted-foreground">
          Loading sign in…
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
