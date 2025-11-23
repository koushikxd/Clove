"use client";

import React, { useState } from "react";
import { useDocumentation } from "@/lib/hooks/use-documentation";
import { ContextSidebar } from "@/components/documentation/context-sidebar";
import { FloatingChatInput } from "@/components/documentation/floating-chat-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Streamdown } from "streamdown";

export default function RepositoryDocsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const { data, isLoading, error } = useDocumentation(unwrappedParams.id);
  const [activeSection, setActiveSection] = useState("readme");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 max-w-[1600px]">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="flex gap-6">
            <div className="flex-1">
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div className="w-80">
              <Skeleton className="h-[600px] w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-semibold">
            Documentation Not Available
          </h1>
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Unable to load documentation for this repository."}
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentSection =
    data.documentation.sections.find((s) => s.id === activeSection) ||
    data.documentation.sections[0];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-[1600px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">
                  {data.repository.name}
                </h1>
                <span className="text-sm text-muted-foreground">
                  / {data.repository.owner}
                </span>
              </div>
            </div>
            <a
              href={data.repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-[1600px] flex-1 flex gap-6 overflow-hidden">
        <div className="flex-1 min-w-0 relative h-full">
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="max-w-4xl pb-32">
              {currentSection && (
                <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                  <Streamdown
                    parseIncompleteMarkdown={false}
                    shikiTheme={["tokyo-night", "tokyo-night"]}
                    isAnimating={false}
                  >
                    {currentSection.content}
                  </Streamdown>
                </article>
              )}
            </div>
          </ScrollArea>
          <FloatingChatInput
            repositoryId={unwrappedParams.id}
            repositoryName={data.repository.name}
          />
        </div>

        <aside className="w-80 shrink-0 h-[calc(100vh-140px)]">
          <ContextSidebar
            sections={data.documentation.sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            metadata={data.documentation.metadata}
            folderStructure={data.documentation.folderStructure}
            dependencies={data.documentation.dependencies}
          />
        </aside>
      </main>
    </div>
  );
}
