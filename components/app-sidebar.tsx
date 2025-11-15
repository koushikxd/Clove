"use client";

import { useState } from "react";
import {
  useRepositories,
  useDeleteRepository,
} from "@/lib/hooks/use-repositories";
import { useCreateChat } from "@/lib/hooks/use-chats";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  ChevronRight,
  Star,
  Trash2,
  MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ChatList } from "./chat/chat-list";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AppSidebarLoadingSkeleton = () => (
  <SidebarGroup className="p-0 px-3 pb-2">
    <SidebarGroupLabel className="text-xs text-muted-foreground font-medium px-0 pl-1 h-fit">
      Repositories
    </SidebarGroupLabel>
    <SidebarGroupContent className="space-y-1">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full bg-muted" />
      ))}
    </SidebarGroupContent>
  </SidebarGroup>
);

const AppSidebarEmptyState = () => (
  <div className="text-center max-w-sm p-6">
    <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">
      No repositories found
    </h3>
    <p className="text-sm text-muted-foreground">
      Start by indexing a GitHub repository to analyze issues and get AI-powered
      solutions.
    </p>
  </div>
);

export const AppSidebar = () => {
  const { data: repositories, isLoading } = useRepositories();
  const deleteRepository = useDeleteRepository();
  const createChat = useCreateChat();
  const router = useRouter();
  const [expandedRepos, setExpandedRepos] = useState<Set<string>>(new Set());
  const [deleteRepoId, setDeleteRepoId] = useState<string | null>(null);

  const handleCreateChat = (repositoryId: string, repoName: string) => {
    createChat.mutate(
      {
        repositoryId,
        title: `New Chat - ${repoName}`,
      },
      {
        onSuccess: (data) => {
          router.push(`/chat?chatId=${data.chat.id}`);
        },
      }
    );
  };

  const handleDeleteRepository = (repoId: string) => {
    deleteRepository.mutate(repoId);
    setDeleteRepoId(null);
  };

  const toggleRepo = (repoId: string) => {
    setExpandedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  };

  return (
    <Sidebar variant="sidebar" className="bg-background!">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-semibold text-xl text-foreground hover:text-muted-foreground transition-colors"
          >
            Clove
          </Link>
          <ModeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent
        className={
          isLoading || !repositories || repositories.length === 0
            ? "flex items-center justify-center"
            : "gap-0"
        }
      >
        {isLoading ? (
          <AppSidebarLoadingSkeleton />
        ) : !repositories || repositories.length === 0 ? (
          <AppSidebarEmptyState />
        ) : (
          <SidebarGroup className="p-0 px-2 pb-2 pt-2">
            <SidebarGroupLabel className="text-xs text-muted-foreground font-medium px-0 pl-2 h-fit mb-2">
              Repositories
            </SidebarGroupLabel>
            <SidebarGroupContent className="space-y-1">
              {repositories.map((repo) => {
                const isExpanded = expandedRepos.has(repo.id);
                return (
                  <Collapsible
                    key={repo.id}
                    open={isExpanded}
                    onOpenChange={() => toggleRepo(repo.id)}
                  >
                    <div className="space-y-1">
                      <div className="group relative">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start px-2 py-2 h-auto hover:bg-accent pr-20"
                          >
                            <ChevronRight
                              className={`h-4 w-4 mr-1 shrink-0 transition-transform ${
                                isExpanded ? "transform rotate-90" : ""
                              }`}
                            />
                            <div className="flex-1 text-left min-w-0">
                              <div className="flex items-center gap-2 w-full">
                                <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate text-foreground">
                                  {repo.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                {repo.language && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span>{repo.language}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  <span>{repo.stars}</span>
                                </div>
                                {repo.status === "indexing" && (
                                  <span className="text-xs text-muted-foreground">
                                    Indexing...
                                  </span>
                                )}
                              </div>
                            </div>
                          </Button>
                        </CollapsibleTrigger>
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-accent"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateChat(repo.id, repo.name);
                            }}
                            title="New Chat"
                          >
                            <MessageSquarePlus className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteRepoId(repo.id);
                            }}
                            title="Delete Repository"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="ml-5 mt-1">
                          <ChatList
                            repositoryId={repo.id}
                            onCreateChat={() =>
                              handleCreateChat(repo.id, repo.name)
                            }
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <AlertDialog
        open={!!deleteRepoId}
        onOpenChange={() => setDeleteRepoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this repository? This will also
              delete all associated chats and messages. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteRepoId && handleDeleteRepository(deleteRepoId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
};
