"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Repository {
  id: string;
  name: string;
  owner: string;
  url: string;
  description: string | null;
  stars: number;
  language: string | null;
  chunksIndexed: number;
  status: string;
  indexedAt: string;
  createdAt: string;
}

interface IndexRepositoryInput {
  repoUrl: string;
  branch?: string;
}

export function useRepositories() {
  return useQuery({
    queryKey: ["repositories"],
    queryFn: async () => {
      const res = await fetch("/api/repository/list");
      if (!res.ok) throw new Error("Failed to fetch repositories");
      const data = await res.json();
      return data.repositories as Repository[];
    },
  });
}

export function useRepository(id: string) {
  return useQuery({
    queryKey: ["repository", id],
    queryFn: async () => {
      const res = await fetch(`/api/repository/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Repository not found");
        throw new Error("Failed to fetch repository");
      }
      const data = await res.json();
      return data.repository as Repository;
    },
    enabled: !!id,
  });
}

export function useIndexRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: IndexRepositoryInput) => {
      const res = await fetch("/api/repository/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to index repository");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      if (data.repositoryId) {
        queryClient.invalidateQueries({
          queryKey: ["repository", data.repositoryId],
        });
      }
      toast.success("Repository indexed successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to index repository");
    },
  });
}
