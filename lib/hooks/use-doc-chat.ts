"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "@/components/chat/chat-message";
import { nanoid } from "nanoid";

export const useDocChat = (repositoryId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessageId = nanoid();
      const userMessage: ChatMessage = {
        id: userMessageId,
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = nanoid();
      const loadingMessage: ChatMessage = {
        id: assistantMessageId,
        type: "assistant",
        content: "",
        timestamp: new Date(),
        loading: true,
      };

      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const response = await fetch("/api/ai/documentation-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            repositoryId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
              updated[lastIndex] = {
                id: assistantMessageId,
                type: "assistant",
                content: fullText,
                timestamp: updated[lastIndex].timestamp,
                streaming: true,
                loading: false,
              };
            }
            return updated;
          });
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
            updated[lastIndex] = {
              id: assistantMessageId,
              type: "assistant",
              content: fullText,
              timestamp: updated[lastIndex].timestamp,
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });
      } catch (error) {
        console.error("Chat error:", error);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === assistantMessageId) {
            updated[lastIndex] = {
              id: assistantMessageId,
              type: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
              timestamp: updated[lastIndex].timestamp,
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [repositoryId, isLoading]
  );

  return {
    messages,
    sendMessage,
    isLoading,
  };
}

