"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@/lib/hooks/use-chat";
import {
  useUpdateChatTitle,
  useChat as useChatData,
} from "@/lib/hooks/use-chats";
import { ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";
import { AiInput } from "@/components/ui/text-area-input";
import { ChatLoadingProgress, ChatIndexingProgress } from "./chat-loading";
import { ChatHeader } from "./chat-header";
import type { Issue } from "@/lib/hooks/use-issues";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Bot, Loader2 } from "lucide-react";

export const ChatInterface = () => {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const initialMessage = searchParams.get("message");
  const processedInitialMessage = useRef(false);

  const {
    messages,
    state,
    indexingStep,
    currentRepo,
    addMessage,
    fetchIssues,
    generateSolution,
  } = useChat({ chatId });

  const { isLoading: isChatLoading } = useChatData(chatId);
  const updateChatTitle = useUpdateChatTitle();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(
    async (message: string) => {
      await addMessage("user", message);

      const lowerMessage = message.toLowerCase();

      if (!currentRepo) {
        await addMessage(
          "assistant",
          "Please go to the home page to index a GitHub repository first. Once indexed, you can ask me to find issues or generate solutions."
        );
        return;
      }

      if (
        lowerMessage.includes("easy") ||
        lowerMessage.includes("medium") ||
        lowerMessage.includes("hard")
      ) {
        const difficulty = lowerMessage.includes("easy")
          ? "easy"
          : lowerMessage.includes("medium")
          ? "medium"
          : "hard";

        try {
          await fetchIssues(difficulty);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch issues";
          toast.error(errorMessage);
          await addMessage("assistant", `❌ ${errorMessage}`);
        }
        return;
      }

      if (
        lowerMessage.includes("all issues") ||
        lowerMessage.includes("show issues") ||
        lowerMessage.includes("issues")
      ) {
        try {
          await fetchIssues();
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch issues";
          toast.error(errorMessage);
          await addMessage("assistant", `❌ ${errorMessage}`);
        }
        return;
      }

      await addMessage(
        "assistant",
        `I can help you with **${currentRepo.name}**:\n\n• Find issues by difficulty (say 'easy', 'medium', or 'hard')\n• Show all issues (say 'show issues')\n• Generate solutions for specific issues\n\nWhat would you like to do?`
      );
    },
    [addMessage, currentRepo, fetchIssues]
  );

  useEffect(() => {
    if (initialMessage && !processedInitialMessage.current) {
      processedInitialMessage.current = true;
      handleSubmit(initialMessage);
    }
  }, [initialMessage, handleSubmit]);

  const handleIssueSelect = useCallback(
    async (issue: Issue) => {
      await addMessage("user", `Solve issue #${issue.number}: ${issue.title}`);

      if (chatId) {
        const maxTitleLength = 50;
        const issueTitle =
          issue.title.length > maxTitleLength
            ? issue.title.slice(0, maxTitleLength) + "..."
            : issue.title;
        updateChatTitle.mutate({
          chatId,
          title: `Issue #${issue.number}: ${issueTitle}`,
        });
      }

      try {
        await generateSolution(issue);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to generate solution";
        toast.error(errorMessage);
        await addMessage("assistant", `❌ ${errorMessage}`);
      }
    },
    [addMessage, generateSolution, chatId, updateChatTitle]
  );

  const showWelcome = useMemo(() => messages.length === 0, [messages.length]);
  const isLoading = useMemo(
    () => chatId && isChatLoading && !currentRepo,
    [chatId, isChatLoading, currentRepo]
  );

  const difficultyButtons = useMemo(
    () => (
      <div className="flex gap-2 justify-center mt-4">
        <button
          onClick={() => handleSubmit("easy")}
          className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/20 transition-colors text-sm font-medium"
        >
          Easy Issues
        </button>
        <button
          onClick={() => handleSubmit("medium")}
          className="px-4 py-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm font-medium"
        >
          Medium Issues
        </button>
        <button
          onClick={() => handleSubmit("hard")}
          className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          Hard Issues
        </button>
      </div>
    ),
    [handleSubmit]
  );

  const placeholder = useMemo(() => {
    if (state === "indexing") return "Indexing repository...";
    if (state === "generating-solution") return "Generating solution...";
    return "Paste a GitHub URL or ask about issues...";
  }, [state]);

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader repositoryName={currentRepo?.name} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {showWelcome && currentRepo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                Working on {currentRepo.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Ask me to find issues by difficulty or show all issues
              </p>
              {difficultyButtons}
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              </div>
              <h1 className="text-2xl font-semibold mb-2 text-foreground">
                Loading chat...
              </h1>
              <p className="text-sm text-muted-foreground">
                Please wait while we load your conversation
              </p>
            </motion.div>
          )}

          {showWelcome && !currentRepo && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">
                No Repository Selected
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                Go to the home page to index a GitHub repository first
              </p>
            </motion.div>
          )}

          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              message={message}
              onIssueSelect={handleIssueSelect}
            />
          ))}

          {state === "indexing" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                  <ChatIndexingProgress
                    currentStep={indexingStep}
                    totalSteps={4}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {state === "fetching-issues" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mb-6"
            >
              <div className="shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="rounded-2xl px-4 py-3 bg-card border border-border">
                  <ChatLoadingProgress message="Fetching issues..." />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />

          {messages.length > 0 && (
            <div className="mt-8">
              <AiInput
                onSubmit={handleSubmit}
                disabled={
                  state === "indexing" || state === "generating-solution"
                }
              />
            </div>
          )}
        </div>
      </div>

      {messages.length === 0 && (
        <ChatInput
          onSubmit={handleSubmit}
          disabled={state === "indexing" || state === "generating-solution"}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};
