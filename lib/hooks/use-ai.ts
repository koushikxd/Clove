"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface AnalyzeIssueInput {
  issueTitle: string;
  issueBody: string;
  repositoryId: string;
}

export function useAnalyzeIssue() {
  return useMutation({
    mutationFn: async (input: AnalyzeIssueInput) => {
      const res = await fetch("/api/ai/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to analyze issue");
      }
      const data = await res.json();
      return data.analysis as string;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to analyze issue");
    },
  });
}

export function useGenerateSolution(
  onChunk?: (chunk: string) => void,
  onComplete?: () => void
) {
  return useMutation({
    mutationFn: async (input: AnalyzeIssueInput) => {
      const res = await fetch("/api/ai/suggest-solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error("Failed to generate solution");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk?.(chunk);
      }

      onComplete?.();
      return fullText;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate solution");
    },
  });
}
