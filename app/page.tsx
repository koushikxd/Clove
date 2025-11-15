"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Send, Loader2 } from "lucide-react";
import { useIndexRepository } from "@/lib/hooks/use-repositories";
import { useCreateChat } from "@/lib/hooks/use-chats";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);
  const indexRepository = useIndexRepository();
  const createChat = useCreateChat();

  const parseGitHubUrl = (text: string): string | null => {
    const match = text.match(/github\.com[\/:]([^\/]+)\/([^\/\s]+)/);
    if (match) {
      return `https://github.com/${match[1]}/${match[2]}`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;

    const githubUrl = parseGitHubUrl(inputValue);

    if (!githubUrl) {
      toast.error("Please enter a valid GitHub repository URL");
      return;
    }

    setIsIndexing(true);

    try {
      const indexResult = await indexRepository.mutateAsync({
        repoUrl: githubUrl,
      });

      const chatResult = await createChat.mutateAsync({
        repositoryId: indexResult.repositoryId,
        title: `New Chat - ${indexResult.repository.name}`,
      });

      toast.success(`Repository indexed successfully!`);
      router.push(`/chat?chatId=${chatResult.chat.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to index repository";
      toast.error(errorMessage);
      setIsIndexing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isIndexing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-4xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4"
          >
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              GitHub Issue Solver
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Index any public GitHub repository and get AI-powered solutions
              for open issues
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-full flex justify-center items-center">
              <div className="w-full max-w-3xl bg-card border border-border rounded-3xl p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="https://github.com/owner/repository"
                    disabled={isIndexing}
                    className="flex-1 border-0 outline-0 rounded-md py-2 text-base bg-transparent font-normal text-foreground px-3 placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim() || isIndexing}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground p-3 rounded-full font-medium justify-center transition-colors disabled:cursor-not-allowed"
                    title="Index Repository"
                    type="button"
                  >
                    {isIndexing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              {
                title: "Index Repository",
                description: "Paste a GitHub URL to analyze the codebase",
              },
              {
                title: "Find Issues",
                description: "Browse issues by difficulty level",
              },
              {
                title: "Get Solutions",
                description: "AI-powered step-by-step guidance",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-4 bg-card rounded-lg border border-border"
              >
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
