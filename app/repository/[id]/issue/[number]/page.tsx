"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useIssues } from "@/lib/hooks/use-issues";
import { SolutionViewer } from "@/components/solution-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ExternalLink, MessageSquare, Calendar } from "lucide-react";
import Link from "next/link";

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string; number: string }>;
}) {
  const unwrappedParams = React.use(params);
  const searchParams = useSearchParams();
  const repoUrl = searchParams.get("repoUrl");
  const { data: issues, isLoading } = useIssues(repoUrl, undefined);
  const issue = issues?.find(
    (i) => i.number === parseInt(unwrappedParams.number)
  );

  const getDifficultyColor = (diff?: "easy" | "medium" | "hard") => {
    switch (diff) {
      case "easy":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Skeleton className="h-10 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!issue || !repoUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Issue not found</h1>
          <Link href={`/repository/${unwrappedParams.id}`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Repository
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          <Link href={`/repository/${unwrappedParams.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Issues
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl font-bold tracking-tight flex-1">
                    {issue.title}
                  </h1>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="outline"
                    className={
                      issue.state === "open"
                        ? "border-green-500 text-green-500"
                        : ""
                    }
                  >
                    {issue.state}
                  </Badge>
                  {issue.difficulty && (
                    <Badge className={getDifficultyColor(issue.difficulty)}>
                      {issue.difficulty}
                    </Badge>
                  )}
                  {issue.labels.map((label) => (
                    <Badge key={label.name} variant="secondary">
                      {label.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>{issue.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Opened {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            {issue.body && (
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {issue.body}
                  </pre>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Solution</h2>
            <SolutionViewer
              issueTitle={issue.title}
              issueBody={issue.body || ""}
              repositoryId={unwrappedParams.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
