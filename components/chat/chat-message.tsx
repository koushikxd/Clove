"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Issue } from "@/lib/hooks/use-issues";
import { Bot, User, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { memo } from "react";
import { Streamdown } from "streamdown";
import { TextShimmer } from "../motion-primitives/text-shimmer";
import { getLabelStyles } from "@/lib/utils";

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

const getComplexityColor = (score?: number) => {
  if (!score) return "border-muted text-muted-foreground";
  if (score < 40)
    return "border-green-500/40 text-green-600 dark:text-green-400";
  if (score < 70)
    return "border-yellow-500/40 text-yellow-600 dark:text-yellow-400";
  return "border-red-500/40 text-red-600 dark:text-red-400";
};

const getComplexityLabel = (score?: number) => {
  if (!score) return "Unknown";
  if (score < 40) return "Low";
  if (score < 70) return "Medium";
  return "High";
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
                  className={`p-4 cursor-pointer hover:shadow-lg transition-all bg-card ${
                    issue.isRecommended
                      ? "border-primary/40 hover:border-primary/60"
                      : "border-border hover:border-accent"
                  }`}
                  onClick={() => onIssueSelect?.(issue)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{issue.number}
                        </span>
                        {issue.isRecommended && (
                          <Badge
                            variant="default"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                        {issue.complexityScore !== undefined && (
                          <Badge
                            variant="outline"
                            className={getComplexityColor(
                              issue.complexityScore
                            )}
                          >
                            {getComplexityLabel(issue.complexityScore)}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-sm text-foreground mb-2">
                        {issue.title}
                      </h4>
                      {issue.labels && issue.labels.length > 0 && (
                        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                          {issue.labels.slice(0, 5).map((label) => (
                            <Badge
                              key={label.name}
                              variant="outline"
                              className="text-xs font-medium"
                              style={getLabelStyles(label.color)}
                            >
                              {label.name}
                            </Badge>
                          ))}
                          {issue.labels.length > 5 && (
                            <span className="text-xs text-muted-foreground">
                              +{issue.labels.length - 5} more
                            </span>
                          )}
                        </div>
                      )}
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
