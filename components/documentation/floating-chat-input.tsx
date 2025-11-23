"use client";

import { useState } from "react";
import { AiInput } from "@/components/ui/text-area-input";
import { useCreateChat } from "@/lib/hooks/use-chats";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

interface FloatingChatInputProps {
  repositoryId: string;
  repositoryName: string;
}

export function FloatingChatInput({ repositoryId }: FloatingChatInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createChat = useCreateChat();
  const router = useRouter();

  const handleSubmit = async (message: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await createChat.mutateAsync({
        repositoryId,
        title: message.slice(0, 50),
      });

      router.push(
        `/chat?chatId=${result.chat.id}&message=${encodeURIComponent(message)}`
      );
    } catch (error) {
      console.error("Failed to create chat:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-0 left-0 right-0 z-50 pb-6 pt-4 px-4 bg-linear-to-t from-background via-background to-transparent"
    >
      <div className="mx-auto max-w-3xl">
        <div className="bg-background/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg p-1">
          <AiInput
            onSubmit={handleSubmit}
            disabled={isSubmitting}
            className="border-none"
          />
        </div>
      </div>
    </motion.div>
  );
}
