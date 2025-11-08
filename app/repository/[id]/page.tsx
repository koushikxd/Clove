"use client";

import React from "react";
import { useRepository } from "@/lib/hooks/use-repositories";
import { IssueList } from "@/components/issue-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, Code2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const {
    data: repository,
    isLoading,
    error,
  } = useRepository(unwrappedParams.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16 max-w-5xl">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Repository not found</h1>
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "The repository could not be found in the database."}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="space-y-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Repositories
            </Button>
          </Link>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  {repository.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {repository.owner}
                </p>
              </div>
              {repository.language && (
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {repository.language}
                </Badge>
              )}
            </div>

            {repository.description && (
              <p className="text-muted-foreground">{repository.description}</p>
            )}

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{repository.stars} stars</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4" />
                <span>{repository.chunksIndexed} chunks indexed</span>
              </div>
              <a
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View on GitHub</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Issues</h2>
            <IssueList
              repoUrl={repository.url}
              repositoryId={unwrappedParams.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
