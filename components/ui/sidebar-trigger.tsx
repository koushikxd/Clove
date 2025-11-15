"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { PanelLeftIcon } from "lucide-react";
import { motion } from "motion/react";

export const SidebarTrigger = () => {
  const { toggleSidebar, open } = useSidebar();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-4 left-4 z-50"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={toggleSidebar}
        className="bg-white dark:bg-neutral-900 shadow-md hover:shadow-lg transition-shadow"
      >
        <PanelLeftIcon className="h-5 w-5" />
      </Button>
    </motion.div>
  );
};

