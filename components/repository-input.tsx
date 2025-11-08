"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIndexRepository } from "@/lib/hooks/use-repositories";
import { Loader2 } from "lucide-react";

export function RepositoryInput() {
  const [repoUrl, setRepoUrl] = useState("");
  const indexRepo = useIndexRepository();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;
    indexRepo.mutate(
      { repoUrl: repoUrl.trim() },
      {
        onSuccess: () => {
          setRepoUrl("");
        },
      }
    );
  };

  const isValidGithubUrl = (url: string) => {
    return url.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="https://github.com/owner/repository"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          disabled={indexRepo.isPending}
          className="flex-1 h-12 text-base"
        />
        <Button
          type="submit"
          disabled={
            indexRepo.isPending || !repoUrl.trim() || !isValidGithubUrl(repoUrl)
          }
          size="lg"
          className="px-8"
        >
          {indexRepo.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Indexing...
            </>
          ) : (
            "Index Repository"
          )}
        </Button>
      </div>
      {indexRepo.isPending && (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            This may take a few minutes depending on repository size...
          </p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Cloning repository</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Chunking code files</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating embeddings</span>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Storing in vector database</span>
            </div>
          </div>
        </div>
      )}
      {repoUrl && !isValidGithubUrl(repoUrl) && (
        <p className="text-sm text-destructive mt-2">
          Please enter a valid GitHub repository URL
        </p>
      )}
    </form>
  );
}
