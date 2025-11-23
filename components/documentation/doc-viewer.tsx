"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface DocViewerProps {
  section: DocumentationSection;
}

export function DocViewer({ section }: DocViewerProps) {
  return (
    <Card className="p-8">
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">{section.title}</h1>
          <Streamdown
            parseIncompleteMarkdown={false}
            shikiTheme={["tokyo-night", "tokyo-night"]}
            isAnimating={false}
          >
            {section.content}
          </Streamdown>
        </div>
      </ScrollArea>
    </Card>
  );
}

