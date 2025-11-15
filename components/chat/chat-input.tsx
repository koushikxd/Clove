"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { motion } from "motion/react";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSubmit, disabled, placeholder = "Ask about repositories or issues..." }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim() || disabled) return;
    onSubmit(input.trim());
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-muted rounded-2xl px-4 py-2 border border-border">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground"
          />
          <motion.button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: input.trim() && !disabled ? 1.1 : 1 }}
            whileTap={{ scale: input.trim() && !disabled ? 0.95 : 1 }}
          >
            <Send size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

