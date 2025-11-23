"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@/lib/hooks/use-chat";
import {
  useUpdateChatTitle,
  useChat as useChatData,
} from "@/lib/hooks/use-chats";
import { ChatMessageComponent } from "./chat-message";
import { AiInput } from "@/components/ui/text-area-input";
import { ChatLoadingProgress, ChatIndexingProgress } from "./chat-loading";
import { ChatHeader } from "./chat-header";
import type { Issue } from "@/lib/hooks/use-issues";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Bot, Loader2, Sparkles } from "lucide-react";

export const ChatInterface = () => {
  const searchParams = useSearchParams();
  const chatId = searchParams.get("chatId");
  const initialMessage = searchParams.get("message");
  const processedInitialMessage = useRef(false);
  const initialMessageRef = useRef<string | null>(null);

  const {
    messages,
    state,
    indexingStep,
    currentRepo,
    addMessage,
    fetchIssues,
    generateSolution,
    chatWithCodebase,
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
      const lowerMessage = message.toLowerCase();

      if (!currentRepo) {
        await addMessage("user", message);
        await addMessage(
          "assistant",
          "Please go to the home page to index a GitHub repository first. Once indexed, you can ask me to find issues or generate solutions."
        );
        return;
      }

      if (
        lowerMessage.includes("recommended") ||
        lowerMessage.includes("beginner")
      ) {
        await addMessage("user", message);
        try {
          await fetchIssues("recommended");
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
        await addMessage("user", message);
        try {
          await fetchIssues("all");
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to fetch issues";
          toast.error(errorMessage);
          await addMessage("assistant", `❌ ${errorMessage}`);
        }
        return;
      }

      try {
        await addMessage("user", message);
        if (chatId) {
          updateChatTitle.mutate({
            chatId,
            title: message.slice(0, 50),
          });
        }
        await chatWithCodebase(message);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get response";
        toast.error(errorMessage);
        await addMessage("assistant", `❌ ${errorMessage}`);
      }
    },
    [
      addMessage,
      currentRepo,
      fetchIssues,
      chatWithCodebase,
      chatId,
      updateChatTitle,
    ]
  );

  useEffect(() => {
    if (
      initialMessage &&
      currentRepo &&
      !processedInitialMessage.current &&
      initialMessageRef.current !== initialMessage
    ) {
      processedInitialMessage.current = true;
      initialMessageRef.current = initialMessage;
      handleSubmit(initialMessage);
    }
  }, [initialMessage, currentRepo, handleSubmit]);

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

  const actionButtons = useMemo(
    () => (
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 px-4">
        <button
          onClick={() => handleSubmit("show all issues")}
          className="px-6 py-3 bg-muted/50 hover:bg-muted text-foreground border border-border rounded-lg transition-all text-sm font-medium hover:shadow-md group cursor-pointer"
        >
          <span className="flex items-center justify-center gap-2">
            Show All Issues
          </span>
        </button>
        <button
          onClick={() => handleSubmit("recommended")}
          className="px-6 py-3 bg-muted/50 hover:bg-muted text-foreground border border-border rounded-lg transition-all text-sm font-medium hover:shadow-md group cursor-pointer"
        >
          <span className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
            Recommended
          </span>
        </button>
      </div>
    ),
    [handleSubmit]
  );

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
              <h1 className="text-4xl font-bold mb-3 text-foreground">
                Working on {currentRepo.name}
              </h1>
              <p className="text-base text-muted-foreground max-w-xl mx-auto">
                Ready to help you find and solve issues. Choose to see all
                issues or get personalized recommendations for your skill level.
              </p>
              {actionButtons}
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
        </div>
      </div>

      <AiInput
        onSubmit={handleSubmit}
        disabled={state === "indexing" || state === "generating-solution"}
        className="mx-auto max-w-[780px]"
      />
    </div>
  );
};
