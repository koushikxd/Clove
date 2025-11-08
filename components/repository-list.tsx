"use client";

import { useRepositories } from "@/lib/hooks/use-repositories";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Code2, Calendar } from "lucide-react";
import Link from "next/link";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function RepositoryList() {
  const { data: repositories, isLoading } = useRepositories();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No repositories indexed yet</EmptyTitle>
          <EmptyDescription>
            Index your first GitHub repository to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Link key={repo.id} href={`/repository/${repo.id}`}>
          <Card className="h-full transition-all hover:shadow-lg hover:border-foreground/20 cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {repo.name}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {repo.owner}
                  </p>
                </div>
                {repo.language && (
                  <Badge variant="secondary" className="shrink-0">
                    {repo.language}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {repo.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {repo.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  <span>{repo.stars}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Code2 className="h-3 w-3" />
                  <span>{repo.chunksIndexed} chunks</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  Indexed {new Date(repo.indexedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
