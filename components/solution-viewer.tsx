"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGenerateSolution } from "@/lib/hooks/use-ai";
import { Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SolutionViewerProps {
  issueTitle: string;
  issueBody: string;
  repositoryId: string;
}

export function SolutionViewer({
  issueTitle,
  issueBody,
  repositoryId,
}: SolutionViewerProps) {
  const [solution, setSolution] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const generateSolution = useGenerateSolution(
    (chunk) => {
      setSolution((prev) => prev + chunk);
    },
    () => {
      setIsStreaming(false);
    }
  );

  const handleGenerate = () => {
    setSolution("");
    setIsStreaming(true);
    generateSolution.mutate({
      issueTitle,
      issueBody: issueBody || "",
      repositoryId,
    });
  };

  return (
    <div className="space-y-4">
      {!solution && !isStreaming && (
        <Button
          onClick={handleGenerate}
          disabled={generateSolution.isPending}
          size="lg"
          className="w-full sm:w-auto"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate AI Solution
        </Button>
      )}

      {(solution || isStreaming) && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI-Generated Solution</h3>
              {isStreaming && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </div>
              )}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{solution}</ReactMarkdown>
            </div>
            {!isStreaming && (
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Regenerate Solution
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
