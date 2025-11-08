import { ModeToggle } from "@/components/ui/mode-toggle";
import { RepositoryInput } from "@/components/repository-input";
import { RepositoryList } from "@/components/repository-list";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <ModeToggle />
      </div>

      <main className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="space-y-12">
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight">
              GitHub Issue Solver
            </h1>
            <p className="text-lg text-muted-foreground">
              Index any public GitHub repository, analyze open issues, and get
              AI-powered step-by-step solutions for easy issues.
            </p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">Index Repository</h2>
              <RepositoryInput />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Your Repositories</h2>
              <RepositoryList />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
