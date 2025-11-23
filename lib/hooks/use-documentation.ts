"use client";

import { useQuery } from "@tanstack/react-query";

interface FolderNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FolderNode[];
}

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Dependencies {
  [key: string]: string;
}

interface DependencyInfo {
  type: string;
  dependencies: Dependencies;
  devDependencies?: Dependencies;
}

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

interface DocumentationData {
  sections: DocumentationSection[];
  folderStructure: FolderNode;
  dependencies: DependencyInfo[];
  metadata: GitHubMetadata;
}

interface DocumentationResponse {
  documentation: DocumentationData;
  repository: {
    id: string;
    name: string;
    owner: string;
    url: string;
  };
}

export function useDocumentation(repositoryId: string) {
  return useQuery({
    queryKey: ["documentation", repositoryId],
    queryFn: async () => {
      const res = await fetch(`/api/repository/${repositoryId}/documentation`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Repository not found");
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.error);
        }
        throw new Error("Failed to fetch documentation");
      }
      const data = await res.json();
      return data as DocumentationResponse;
    },
    enabled: !!repositoryId,
    staleTime: 5 * 60 * 1000,
  });
}

