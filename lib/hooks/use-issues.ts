"use client";

import { useQuery } from "@tanstack/react-query";

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  created_at: string;
  html_url: string;
  comments: number;
  complexityScore?: number;
  isRecommended?: boolean;
  recommendationReason?: string;
}

export function useIssues(
  repoUrl: string | null,
  filter?: "all" | "recommended"
) {
  return useQuery({
    queryKey: ["issues", repoUrl, filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (repoUrl) params.set("repoUrl", repoUrl);
      if (filter && filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/repository/issues?${params}`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();
      return data.issues as Issue[];
    },
    enabled: !!repoUrl,
  });
}
