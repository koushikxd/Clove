"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetadataCard } from "./metadata-card";
import { FolderTree } from "./folder-tree";
import { DependencyTable } from "./dependency-table";
import { FileText, Folder, Box, Info, LucideIcon } from "lucide-react";

interface FolderNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FolderNode[];
}

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Dependencies {
  [key: string]: string;
}

interface DependencyInfo {
  type: string;
  path: string;
  dependencies: Dependencies;
  devDependencies?: Dependencies;
}

interface GitHubMetadata {
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  language: string | null;
  license: string | null;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  topics: string[];
  homepage: string | null;
}

interface ContextSidebarProps {
  sections: DocumentationSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  metadata: GitHubMetadata;
  folderStructure: FolderNode;
  dependencies: DependencyInfo[];
}

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TABS: Tab[] = [
  {
    id: "guide",
    label: "Guide",
    icon: FileText,
  },
  {
    id: "info",
    label: "Info",
    icon: Info,
  },
  {
    id: "files",
    label: "Files",
    icon: Folder,
  },
  {
    id: "deps",
    label: "Deps",
    icon: Box,
  },
] as const;

export function ContextSidebar({
  sections,
  activeSection,
  onSectionChange,
  metadata,
  folderStructure,
  dependencies,
}: ContextSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <Tabs defaultValue="guide" className="flex flex-col h-full">
        <div className="p-4 pb-0 border-b border-border bg-muted/30">
          <TabsList className="w-full grid grid-cols-4 gap-1 bg-transparent p-0 h-auto">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2 text-xs flex flex-col gap-1 h-auto cursor-pointer data-[state=active]:border-b-0 data-[state=active]:rounded-br-none data-[state=active]:rounded-bl-none"
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="guide" className="m-0 p-4 pt-6">
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                Table of Contents
              </h3>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => onSectionChange(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                    activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="info" className="m-0 p-4 pt-6">
            <MetadataCard metadata={metadata} />
          </TabsContent>

          <TabsContent value="files" className="m-0 p-4 pt-6">
            <div className="mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Project Structure
              </h3>
            </div>
            <FolderTree structure={folderStructure} />
          </TabsContent>

          <TabsContent value="deps" className="m-0 p-4 pt-6">
            <div className="mb-2 px-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dependencies
              </h3>
            </div>
            <DependencyTable dependencies={dependencies} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
