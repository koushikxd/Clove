"use client";

import { motion } from "motion/react";

export const ChatLoadingDots = () => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{
          y: [0, -8, 0],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.15,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

export const ChatLoadingProgress = ({ message }: { message: string }) => (
  <motion.div
    className="flex items-center gap-3 text-sm text-muted-foreground"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <ChatLoadingDots />
    <span>{message}</span>
  </motion.div>
);

export const ChatIndexingProgress = ({ 
  currentStep, 
  totalSteps 
}: { 
  currentStep: number; 
  totalSteps: number;
}) => {
  const steps = [
    "Cloning repository",
    "Analyzing codebase",
    "Generating embeddings",
    "Storing in vector database",
  ];

  return (
    <div className="space-y-3 py-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <motion.div
            key={step}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-colors ${
              isCompleted
                ? "bg-primary border-primary"
                : isCurrent
                ? "border-primary"
                : "border-border"
            }`}>
              {isCompleted && (
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {isCurrent && <ChatLoadingDots />}
            </div>
            <span className={`text-sm ${
              isCompleted
                ? "text-foreground"
                : isCurrent
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}>
              {step}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};

