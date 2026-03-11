import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Page() {
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
