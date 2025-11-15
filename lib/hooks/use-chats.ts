"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Issue } from "./use-issues";

export interface Chat {
  id: string;
  repositoryId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: string;
  content: string;
  metadata: { issues?: Issue[] } | null;
  createdAt: string;
}

export function useChats(repositoryId: string | null) {
  return useQuery({
    queryKey: ["chats", repositoryId],
    queryFn: async () => {
      if (!repositoryId) return [];
      const res = await fetch(`/api/chats?repositoryId=${repositoryId}`);
      if (!res.ok) throw new Error("Failed to fetch chats");
      const data = await res.json();
      return data.chats as Chat[];
    },
    enabled: !!repositoryId,
  });
}

export function useChat(chatId: string | null) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      if (!chatId) return null;
      const res = await fetch(`/api/chats/${chatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      const data = await res.json();
      return {
        chat: data.chat as Chat,
        messages: data.messages as Message[],
      };
    },
    enabled: !!chatId,
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repositoryId,
      title,
    }: {
      repositoryId: string;
      title?: string;
    }) => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId, title }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create chat");
      }
      return res.json();
    },
    onMutate: async ({ repositoryId, title }) => {
      await queryClient.cancelQueries({ queryKey: ["chats", repositoryId] });
      const previousChats = queryClient.getQueryData(["chats", repositoryId]);

      const optimisticChat: Chat = {
        id: `temp-${Date.now()}`,
        repositoryId,
        title: title || "New Chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["chats", repositoryId], (old: Chat[] = []) => [
        ...old,
        optimisticChat,
      ]);

      return { previousChats };
    },
    onSuccess: (data: { chat: Chat }, { repositoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["chats", repositoryId] });
    },
    onError: (error, { repositoryId }, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(
          ["chats", repositoryId],
          context.previousChats
        );
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to create chat"
      );
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete chat");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat deleted");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete chat"
      );
    },
  });
}

export function useUpdateChatTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      title,
    }: {
      chatId: string;
      title: string;
    }) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        throw new Error("Failed to update chat title");
      }
      return res.json();
    },
    onSuccess: (data: { chat: Chat }) => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["chat", data.chat.id] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update chat title"
      );
    },
  });
}

export function useSaveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      chatId,
      role,
      content,
      metadata,
    }: {
      id?: string;
      chatId: string;
      role: string;
      content: string;
      metadata?: { issues?: Issue[] } | null;
    }) => {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, chatId, role, content, metadata }),
      });
      if (!res.ok) {
        throw new Error("Failed to save message");
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat", variables.chatId] });
    },
  });
}
