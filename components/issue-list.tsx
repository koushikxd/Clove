"use client";

import { useIssues } from "@/lib/hooks/use-issues";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ExternalLink, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getLabelStyles } from "@/lib/utils";

interface IssueListProps {
  repoUrl: string;
  repositoryId: string;
}

export function IssueList({ repoUrl, repositoryId }: IssueListProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "recommended">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: issues, isLoading } = useIssues(repoUrl, filter);

  const filteredIssues = issues?.filter(
    (issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recommendedCount = issues?.filter((i) => i.isRecommended).length || 0;

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
            There are no open issues in this repository
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as "all" | "recommended")}
          className="w-full sm:w-auto"
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-initial">
              All Issues
              <Badge variant="secondary" className="ml-2">
                {issues.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="recommended" className="flex-1 sm:flex-initial">
              <Sparkles className="h-3 w-3 mr-1" />
              Recommended
              <Badge variant="secondary" className="ml-2">
                {recommendedCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {filteredIssues && filteredIssues.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No matching issues</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-3">
          {filteredIssues?.map((issue) => (
            <Card
              key={issue.number}
              className={`transition-all hover:shadow-md cursor-pointer ${
                issue.isRecommended
                  ? "border-primary/40 hover:border-primary/60"
                  : "hover:border-foreground/20"
              }`}
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
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-semibold text-base line-clamp-2 flex-1">
                        {issue.title}
                      </h3>
                      {issue.isRecommended && (
                        <Badge
                          variant="default"
                          className="bg-primary/10 text-primary hover:bg-primary/20 shrink-0"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {issue.isRecommended && issue.recommendationReason && (
                        <span className="text-xs text-muted-foreground">
                          {issue.recommendationReason}
                        </span>
                      )}
                      {issue.complexityScore !== undefined && (
                        <Badge
                          variant="outline"
                          className={
                            issue.complexityScore < 40
                              ? "border-green-500/40 text-green-600 dark:text-green-400"
                              : issue.complexityScore < 70
                              ? "border-yellow-500/40 text-yellow-600 dark:text-yellow-400"
                              : "border-red-500/40 text-red-600 dark:text-red-400"
                          }
                        >
                          Complexity:{" "}
                          {issue.complexityScore < 40
                            ? "Low"
                            : issue.complexityScore < 70
                            ? "Medium"
                            : "High"}
                        </Badge>
                      )}
                      {issue.labels.slice(0, 3).map((label) => (
                        <Badge
                          key={label.name}
                          variant="outline"
                          style={getLabelStyles(label.color)}
                          className="font-medium"
                        >
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
                    className="text-muted-foreground hover:text-foreground shrink-0"
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
      )}
    </div>
  );
}
