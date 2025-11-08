"use client";

import { useIssues } from "@/lib/hooks/use-issues";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

interface IssueListProps {
  repoUrl: string;
  repositoryId: string;
}

export function IssueList({ repoUrl, repositoryId }: IssueListProps) {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<
    "easy" | "medium" | "hard" | undefined
  >("easy");
  const { data: issues, isLoading } = useIssues(repoUrl, difficulty);

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
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No issues found</EmptyTitle>
          <EmptyDescription>
            There are no issues matching the selected difficulty level
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs
        value={difficulty}
        onValueChange={(v) =>
          setDifficulty(v as "easy" | "medium" | "hard" | undefined)
        }
      >
        <TabsList>
          <TabsTrigger value="easy">Easy</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="hard">Hard</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {issues.map((issue) => (
          <Card
            key={issue.number}
            className="transition-all hover:shadow-md hover:border-foreground/20 cursor-pointer"
            onClick={() => {
              router.push(
                `/repository/${repositoryId}/issue/${
                  issue.number
                }?repoUrl=${encodeURIComponent(repoUrl)}`
              );
            }}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base line-clamp-2">
                    {issue.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {issue.difficulty && (
                      <Badge className={getDifficultyColor(issue.difficulty)}>
                        {issue.difficulty}
                      </Badge>
                    )}
                    {issue.labels.slice(0, 3).map((label) => (
                      <Badge key={label.name} variant="outline">
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <a
                  href={issue.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </CardHeader>
            {issue.body && (
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {issue.body}
                </p>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <MessageSquare className="h-3 w-3" />
                  <span>{issue.comments} comments</span>
                  <span>•</span>
                  <span>
                    Opened {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
