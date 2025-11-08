"use client";

import { useQuery } from "@tanstack/react-query";

export interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{ name: string }>;
  created_at: string;
  html_url: string;
  comments: number;
  difficulty?: "easy" | "medium" | "hard";
}

export function useIssues(
  repoUrl: string | null,
  difficulty?: "easy" | "medium" | "hard"
) {
  return useQuery({
    queryKey: ["issues", repoUrl, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (repoUrl) params.set("repoUrl", repoUrl);
      if (difficulty) params.set("difficulty", difficulty);

      const res = await fetch(`/api/repository/issues?${params}`);
      if (!res.ok) throw new Error("Failed to fetch issues");
      const data = await res.json();
      return data.issues as Issue[];
    },
    enabled: !!repoUrl,
  });
}
