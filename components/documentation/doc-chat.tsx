"use client";

import { Card } from "@/components/ui/card";
import { AiInput } from "@/components/ui/text-area-input";
import { ChatMessageComponent } from "@/components/chat/chat-message";
import type { ChatMessage } from "@/components/chat/chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
import { useEffect, useRef } from "react";

interface DocChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function DocChat({ messages, onSendMessage, isLoading }: DocChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Ask AI about Documentation</h3>
      </div>

      <ScrollArea className="h-[400px] rounded-md border p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="space-y-2">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                Ask questions about this repository&apos;s documentation and
                codebase
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      <AiInput
        onSubmit={onSendMessage}
        disabled={isLoading}
        className="mx-auto max-w-[780px]"
      />
    </Card>
  );
}
