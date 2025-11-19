"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Issue } from "@/lib/hooks/use-issues";
import { Bot, User } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { TextShimmer } from "../motion-primitives/text-shimmer";

export type MessageType = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  issues?: Issue[];
  streaming?: boolean;
  loading?: boolean;
}

interface ChatMessageProps {
  message: ChatMessage;
  onIssueSelect?: (issue: Issue) => void;
}

const getDifficultyColor = (difficulty?: "easy" | "medium" | "hard") => {
  switch (difficulty) {
    case "easy":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    case "hard":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    default:
      return "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400";
  }
};

const ChatMessageComponentBase = ({
  message,
  onIssueSelect,
}: ChatMessageProps) => {
  if (message.type === "system") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center my-4"
      >
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </motion.div>
    );
  }

  const isUser = message.type === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-6`}
    >
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div
        className={`flex-1 mt-1 ${
          isUser ? "items-end" : "items-start"
        } flex flex-col`}
      >
        {message.loading ? (
          <div className="">
            <TextShimmer>Generating solution...</TextShimmer>
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-3 max-w-3xl ${
              isUser
                ? "bg-muted border border-primary/30 text-foreground"
                : "bg-card border border-border text-card-foreground"
            }`}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown
                parseIncompleteMarkdown={true}
                shikiTheme={["tokyo-night", "tokyo-night"]}
                isAnimating={message.streaming}
              >
                {message.content}
              </Streamdown>
            </div>
          </div>
        )}

        {message.issues && message.issues.length > 0 && (
          <div className="mt-3 space-y-2 w-full max-w-3xl">
            {message.issues.map((issue) => (
              <motion.div
                key={issue.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="p-4 cursor-pointer hover:shadow-lg hover:border-accent transition-all bg-card border-border"
                  onClick={() => onIssueSelect?.(issue)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{issue.number}
                        </span>
                        {issue.difficulty && (
                          <Badge
                            className={getDifficultyColor(issue.difficulty)}
                          >
                            {issue.difficulty}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-foreground mb-1">
                        {issue.title}
                      </h4>
                      {issue.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {issue.body}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* <div className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div> */}
      </div>
    </motion.div>
  );
};

export const ChatMessageComponent = memo(
  ChatMessageComponentBase,
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.streaming === nextProps.message.streaming &&
      prevProps.message.loading === nextProps.message.loading &&
      prevProps.message.type === nextProps.message.type
    );
  }
);
