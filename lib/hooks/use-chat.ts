"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { ChatMessage } from "@/components/chat/chat-message";
import type { Issue } from "./use-issues";
import { nanoid } from "nanoid";
import {
  useSaveMessage,
  useChat as useChatData,
  useCreateChat,
} from "./use-chats";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type ChatState =
  | "idle"
  | "indexing"
  | "fetching-issues"
  | "generating-solution";

interface UseChatOptions {
  chatId?: string | null;
}

export const useChat = (options: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<ChatState>("idle");
  const [currentRepo, setCurrentRepo] = useState<{
    id: string;
    url: string;
    name: string;
  } | null>(null);
  const [indexingStep, setIndexingStep] = useState(0);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    options.chatId || null
  );
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);

  const { data: chatData } = useChatData(activeChatId);
  const saveMessage = useSaveMessage();
  const createChat = useCreateChat();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isLoadingRef = useRef(false);
  const loadedChatIdRef = useRef<string | null>(null);
  const optimisticMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (options.chatId !== activeChatId) {
      setActiveChatId(options.chatId || null);
      setMessages([]);
      loadedChatIdRef.current = null;
      setState("idle");
      optimisticMessageIds.current.clear();
    }
  }, [options.chatId, activeChatId]);

  useEffect(() => {
    if (!chatData) return;

    const currentChatId = chatData.chat.id;
    const isNewChat = loadedChatIdRef.current !== currentChatId;

    if (chatData.messages && chatData.messages.length > 0) {
      const loadedMessages: ChatMessage[] = chatData.messages.map((msg) => ({
        id: msg.id,
        type: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
        issues: msg.metadata?.issues,
        streaming: false,
      }));

      if (isNewChat) {
        loadedChatIdRef.current = currentChatId;
        setMessages(
          loadedMessages.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          )
        );
      } else {
        setMessages((prev) => {
          const existingOptimisticIds = new Set(
            prev
              .filter((m) => optimisticMessageIds.current.has(m.id))
              .map((m) => m.id)
          );

          const merged = prev
            .filter((m) => !existingOptimisticIds.has(m.id))
            .concat(loadedMessages);

          const uniqueMap = new Map(merged.map((m) => [m.id, m]));
          const unique = Array.from(uniqueMap.values());

          existingOptimisticIds.forEach((id) =>
            optimisticMessageIds.current.delete(id)
          );

          return unique.sort(
            (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
          );
        });
      }
    } else if (isNewChat) {
      loadedChatIdRef.current = currentChatId;
      setMessages([]);
    }

    if (chatData.chat.repositoryId) {
      const fetchRepository = async () => {
        try {
          const res = await fetch(
            `/api/repository/${chatData.chat.repositoryId}`
          );
          if (res.ok) {
            const data = await res.json();
            setCurrentRepo({
              id: data.repository.id,
              url: data.repository.url,
              name: data.repository.name,
            });
          }
        } catch (error) {
          console.error("Failed to fetch repository:", error);
        }
      };

      const repoData = queryClient.getQueryData<
        Array<{ id: string; url: string; name: string }>
      >(["repositories"]);
      const repo = repoData?.find((r) => r.id === chatData.chat.repositoryId);

      if (repo) {
        setCurrentRepo({
          id: repo.id,
          url: repo.url,
          name: repo.name,
        });
      } else {
        fetchRepository();
      }
    }
  }, [chatData, queryClient]);

  const addMessage = useCallback(
    async (
      type: "user" | "assistant" | "system",
      content: string,
      issues?: Issue[],
      skipSave = false
    ) => {
      const messageId = nanoid();
      const newMessage: ChatMessage = {
        id: messageId,
        type,
        content,
        timestamp: new Date(),
        issues,
      };

      if (!skipSave) {
        optimisticMessageIds.current.add(messageId);
      }

      setMessages((prev) => [...prev, newMessage]);

      if (!activeChatId && type === "user" && currentRepo) {
        setPendingMessages((prev) => [...prev, newMessage]);

        try {
          const result = await createChat.mutateAsync({
            repositoryId: currentRepo.id,
            title: content.slice(0, 50),
          });

          const newChatId = result.chat.id;
          setActiveChatId(newChatId);

          const allPendingMessages = [...pendingMessages, newMessage];

          for (const msg of allPendingMessages) {
            optimisticMessageIds.current.add(msg.id);
          }

          try {
            for (const msg of allPendingMessages) {
              await saveMessage.mutateAsync({
                id: msg.id,
                chatId: newChatId,
                role: msg.type,
                content: msg.content,
                metadata: msg.issues ? { issues: msg.issues } : null,
              });
              optimisticMessageIds.current.delete(msg.id);
            }
          } catch (error) {
            for (const msg of allPendingMessages) {
              optimisticMessageIds.current.delete(msg.id);
            }
            throw error;
          }

          setPendingMessages([]);
          router.push(`/chat?chatId=${newChatId}`);
        } catch (error) {
          console.error("Failed to create chat:", error);
        }
      } else if (activeChatId && !skipSave) {
        saveMessage.mutate(
          {
            id: messageId,
            chatId: activeChatId,
            role: type,
            content,
            metadata: issues ? { issues } : null,
          },
          {
            onSettled: () => {
              optimisticMessageIds.current.delete(messageId);
            },
          }
        );
      }

      return newMessage;
    },
    [
      activeChatId,
      currentRepo,
      createChat,
      saveMessage,
      pendingMessages,
      router,
    ]
  );

  const updateLastMessage = useCallback(
    (content: string, saveToDb = false) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;

        const updated = [...prev];
        const lastMessage = updated[updated.length - 1];

        if (lastMessage.content === content) {
          return prev;
        }

        updated[updated.length - 1] = {
          ...lastMessage,
          content,
        };

        if (activeChatId && saveToDb) {
          saveMessage.mutate({
            id: lastMessage.id,
            chatId: activeChatId,
            role: lastMessage.type,
            content,
            metadata: lastMessage.issues
              ? { issues: lastMessage.issues }
              : null,
          });
        }

        return updated;
      });
    },
    [activeChatId, saveMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setState("idle");
    setCurrentRepo(null);
    setIndexingStep(0);
    isLoadingRef.current = false;
    optimisticMessageIds.current.clear();
  }, []);

  const indexRepository = useCallback(
    async (repoUrl: string) => {
      setState("indexing");
      setIndexingStep(0);

      try {
        const steps = [
          "Cloning repository",
          "Analyzing codebase",
          "Generating embeddings",
          "Storing in vector database",
        ];

        for (let i = 0; i < steps.length; i++) {
          setIndexingStep(i);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }

        const response = await fetch("/api/repository/index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to index repository");
        }

        const data = await response.json();

        setCurrentRepo({
          id: data.repositoryId,
          url: repoUrl,
          name: data.repository.name,
        });

        queryClient.invalidateQueries({ queryKey: ["repositories"] });

        setState("idle");
        setIndexingStep(4);

        addMessage(
          "assistant",
          `Successfully indexed **${data.repository.name}**!\n\n✓ Analyzed ${data.chunksIndexed} code chunks\n✓ Generated embeddings\n✓ Ready to solve issues\n\nI can show you **all issues** or filter to **recommended** issues for beginners. What would you like to see?`
        );

        return data;
      } catch (error) {
        setState("idle");
        throw error;
      }
    },
    [addMessage, queryClient]
  );

  const fetchIssues = useCallback(
    async (filter?: "all" | "recommended") => {
      if (!currentRepo) {
        throw new Error("No repository selected");
      }

      setState("fetching-issues");

      try {
        const params = new URLSearchParams({
          repoUrl: currentRepo.url,
          ...(filter && filter !== "all" && { filter }),
        });

        const response = await fetch(`/api/repository/issues?${params}`);

        if (!response.ok) {
          throw new Error("Failed to fetch issues");
        }

        const data = await response.json();
        setState("idle");

        const filterText = filter === "recommended" ? "recommended " : "";
        const recommendedCount = data.issues.filter(
          (i: Issue) => i.isRecommended
        ).length;

        let message = `Found **${data.issues.length}** ${filterText}issue${
          data.issues.length !== 1 ? "s" : ""
        } in **${currentRepo.name}**.`;

        if (filter !== "recommended" && recommendedCount > 0) {
          message += ` ${recommendedCount} ${
            recommendedCount === 1 ? "is" : "are"
          } recommended for beginners.`;
        }

        message += " Select one to get a detailed solution:";

        addMessage("assistant", message, data.issues);

        return data.issues;
      } catch (error) {
        setState("idle");
        throw error;
      }
    },
    [currentRepo, addMessage]
  );

  const generateSolution = useCallback(
    async (issue: Issue, onChunk?: (chunk: string) => void) => {
      if (!currentRepo) {
        throw new Error("No repository selected");
      }

      setState("generating-solution");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const streamingMessageId = nanoid();

      const loadingMessage: ChatMessage = {
        id: streamingMessageId,
        type: "assistant",
        content: "",
        timestamp: new Date(),
        loading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const response = await fetch("/api/ai/suggest-solution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            issueTitle: issue.title,
            issueBody: issue.body || "",
            repositoryId: currentRepo.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate solution");
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
            if (
              lastIndex >= 0 &&
              updated[lastIndex].id === streamingMessageId
            ) {
              updated[lastIndex] = {
                id: streamingMessageId,
                type: "assistant",
                content: fullText,
                timestamp: updated[lastIndex].timestamp,
                streaming: true,
                loading: false,
              };
            }
            return updated;
          });

          onChunk?.(chunk);
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === streamingMessageId) {
            updated[lastIndex] = {
              id: streamingMessageId,
              type: "assistant",
              content: fullText,
              timestamp: updated[lastIndex].timestamp,
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });

        if (activeChatId) {
          optimisticMessageIds.current.add(streamingMessageId);
          try {
            await saveMessage.mutateAsync({
              id: streamingMessageId,
              chatId: activeChatId,
              role: "assistant",
              content: fullText,
              metadata: null,
            });
            optimisticMessageIds.current.delete(streamingMessageId);
          } catch (error) {
            optimisticMessageIds.current.delete(streamingMessageId);
            throw error;
          }
        }

        setState("idle");
        return fullText;
      } catch (error) {
        setState("idle");
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === streamingMessageId) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });
        throw error;
      }
    },
    [currentRepo, activeChatId, saveMessage]
  );

  const chatWithCodebase = useCallback(
    async (message: string, onChunk?: (chunk: string) => void) => {
      if (!currentRepo) {
        throw new Error("No repository selected");
      }

      setState("generating-solution");

      await new Promise((resolve) => setTimeout(resolve, 100));

      const streamingMessageId = nanoid();
      const loadingMessage: ChatMessage = {
        id: streamingMessageId,
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
            message,
            repositoryId: currentRepo.id,
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
            if (
              lastIndex >= 0 &&
              updated[lastIndex].id === streamingMessageId
            ) {
              updated[lastIndex] = {
                id: streamingMessageId,
                type: "assistant",
                content: fullText,
                timestamp: updated[lastIndex].timestamp,
                streaming: true,
                loading: false,
              };
            }
            return updated;
          });

          onChunk?.(chunk);
        }

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === streamingMessageId) {
            updated[lastIndex] = {
              id: streamingMessageId,
              type: "assistant",
              content: fullText,
              timestamp: updated[lastIndex].timestamp,
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });

        if (activeChatId) {
          optimisticMessageIds.current.add(streamingMessageId);
          try {
            await saveMessage.mutateAsync({
              id: streamingMessageId,
              chatId: activeChatId,
              role: "assistant",
              content: fullText,
              metadata: null,
            });
            optimisticMessageIds.current.delete(streamingMessageId);
          } catch (error) {
            optimisticMessageIds.current.delete(streamingMessageId);
            throw error;
          }
        }

        setState("idle");
        return fullText;
      } catch (error) {
        setState("idle");
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].id === streamingMessageId) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              streaming: false,
              loading: false,
            };
          }
          return updated;
        });
        throw error;
      }
    },
    [currentRepo, activeChatId, saveMessage]
  );

  const setChat = useCallback((chatId: string | null) => {
    setActiveChatId(chatId);
    isLoadingRef.current = false;
    loadedChatIdRef.current = null;
    optimisticMessageIds.current.clear();
  }, []);

  const memoizedReturn = useMemo(
    () => ({
      messages,
      state,
      currentRepo,
      indexingStep,
      chatId: activeChatId,
      addMessage,
      updateLastMessage,
      clearMessages,
      indexRepository,
      fetchIssues,
      generateSolution,
      chatWithCodebase,
      setChat,
    }),
    [
      messages,
      state,
      currentRepo,
      indexingStep,
      activeChatId,
      addMessage,
      updateLastMessage,
      clearMessages,
      indexRepository,
      fetchIssues,
      generateSolution,
      chatWithCodebase,
      setChat,
    ]
  );

  return memoizedReturn;
};
