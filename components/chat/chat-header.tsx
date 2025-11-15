"use client";

import { motion } from "motion/react";
import { GitBranch } from "lucide-react";

interface ChatHeaderProps {
  repositoryName?: string;
}

export const ChatHeader = ({ repositoryName }: ChatHeaderProps) => {
  if (!repositoryName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b border-border bg-background px-4 py-3"
    >
      <div className="max-w-4xl mx-auto flex items-center gap-2 text-sm">
        <GitBranch className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Working on:</span>
        <span className="font-medium text-foreground">{repositoryName}</span>
      </div>
    </motion.div>
  );
};

