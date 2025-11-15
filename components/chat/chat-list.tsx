"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useChats, useDeleteChat } from "@/lib/hooks/use-chats";
import { MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

interface ChatListProps {
  repositoryId: string;
  onCreateChat?: () => void;
}

export const ChatList = ({ repositoryId }: ChatListProps) => {
  const { data: chats, isLoading } = useChats(repositoryId);
  const deleteChat = useDeleteChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("chatId");
  const [deleteChatId, setDeleteChatId] = useState<string | null>(null);

  const handleDeleteChat = (chatId: string) => {
    deleteChat.mutate(chatId);
    if (currentChatId === chatId) {
      router.push("/");
    }
    setDeleteChatId(null);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  if (isLoading) {
    return (
      <div className="space-y-1 px-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-muted" />
        ))}
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="px-2 py-2 space-y-2">
        <div className="text-xs text-muted-foreground px-1">No chats yet</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1 px-2">
        {chats.map((chat) => (
          <div key={chat.id} className="group relative">
            <Link
              href={`/chat?chatId=${chat.id}`}
              className={`flex items-start gap-2 px-2 py-2 rounded-md transition-colors hover:bg-accent ${
                currentChatId === chat.id ? "bg-accent" : ""
              }`}
            >
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(chat.updatedAt)}
                </div>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDeleteChatId(chat.id);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog
        open={!!deleteChatId}
        onOpenChange={() => setDeleteChatId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? All messages will be
              permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChatId && handleDeleteChat(deleteChatId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
