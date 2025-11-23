"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, BookOpen } from "lucide-react";

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface DocNavigationProps {
  sections: DocumentationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function DocNavigation({
  sections,
  activeSection,
  onSectionChange,
}: DocNavigationProps) {
  return (
    <Card className="p-4 sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5" />
        <h3 className="font-semibold">Documentation</h3>
      </div>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                activeSection === section.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent text-muted-foreground"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{section.title}</span>
            </button>
          ))}
        </nav>
      </ScrollArea>
    </Card>
  );
}

