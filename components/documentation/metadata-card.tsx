"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, GitFork, AlertCircle, Eye, Calendar, ExternalLink } from "lucide-react";

interface GitHubMetadata {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string | null;
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  topics: string[];
  homepage: string | null;
}

interface MetadataCardProps {
  metadata: GitHubMetadata;
}

export function MetadataCard({ metadata }: MetadataCardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Repository Stats</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Star className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Stars</span>
            </div>
            <span className="text-lg font-semibold">{metadata.stars.toLocaleString()}</span>
          </div>
          
          <div className="flex flex-col p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <GitFork className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Forks</span>
            </div>
            <span className="text-lg font-semibold">{metadata.forks.toLocaleString()}</span>
          </div>

          <div className="flex flex-col p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Issues</span>
            </div>
            <span className="text-lg font-semibold">{metadata.openIssues.toLocaleString()}</span>
          </div>

          <div className="flex flex-col p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Watchers</span>
            </div>
            <span className="text-lg font-semibold">{metadata.watchers.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {metadata.language && (
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-muted-foreground">Language</span>
            <span className="font-medium">{metadata.language}</span>
          </div>
        )}
        
        {metadata.license && (
          <div className="flex justify-between items-center py-1 border-b border-border/50">
            <span className="text-muted-foreground">License</span>
            <span className="font-medium">{metadata.license}</span>
          </div>
        )}

        <div className="flex justify-between items-center py-1 border-b border-border/50">
          <span className="text-muted-foreground">Created</span>
          <span className="font-medium">{new Date(metadata.createdAt).toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-border/50">
          <span className="text-muted-foreground">Updated</span>
          <span className="font-medium">{new Date(metadata.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {metadata.homepage && (
        <a
          href={metadata.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full gap-2 p-2 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20 transition-colors"
        >
          Visit Homepage
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}

