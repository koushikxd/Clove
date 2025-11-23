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
  repoPath: string | null;
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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["repositories"] });
      const previousRepos = queryClient.getQueryData(["repositories"]);

      const tempRepo: Repository = {
        id: `temp-${Date.now()}`,
        name: variables.repoUrl.split("/").pop() || "Repository",
        owner: variables.repoUrl.split("/").slice(-2, -1)[0] || "Owner",
        url: variables.repoUrl,
        description: null,
        stars: 0,
        language: null,
        chunksIndexed: 0,
        status: "indexing",
        indexedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(
        ["repositories"],
        (old: Repository[] = []) => [tempRepo, ...old]
      );

      return { previousRepos };
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
    onError: (error: Error, variables, context) => {
      if (context?.previousRepos) {
        queryClient.setQueryData(["repositories"], context.previousRepos);
      }
      toast.error(error.message || "Failed to index repository");
    },
  });
}

export function useDeleteRepository() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repositoryId: string) => {
      const res = await fetch(`/api/repository/${repositoryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete repository");
      }
      return res.json();
    },
    onMutate: async (repositoryId) => {
      await queryClient.cancelQueries({ queryKey: ["repositories"] });
      const previousRepos = queryClient.getQueryData(["repositories"]);

      queryClient.setQueryData(
        ["repositories"],
        (old: Repository[] = []) => old.filter((repo) => repo.id !== repositoryId)
      );

      return { previousRepos };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      toast.success("Repository deleted successfully!");
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousRepos) {
        queryClient.setQueryData(["repositories"], context.previousRepos);
      }
      toast.error(error.message || "Failed to delete repository");
    },
  });
}
