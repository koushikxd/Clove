"use client";

import { ChevronDown, ChevronRight, File, Folder } from "lucide-react";
import { useState } from "react";

interface FolderNode {
  name: string;
  type: "file" | "directory";
  path: string;
  children?: FolderNode[];
}

interface FolderTreeProps {
  structure: FolderNode;
}

function TreeNode({ node, depth = 0 }: { node: FolderNode; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 1); // Only expand root by default
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors text-sm`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) setIsExpanded(!isExpanded);
        }}
      >
        <span className="shrink-0 opacity-50">
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="w-3.5 inline-block" />
          )}
        </span>

        {node.type === "directory" ? (
          <Folder className="h-4 w-4 text-blue-500 shrink-0" />
        ) : (
          <File className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <span className="truncate font-medium text-foreground/90">
          {node.name}
        </span>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child, idx) => (
            <TreeNode
              key={`${child.path}-${idx}`}
              node={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ structure }: FolderTreeProps) {
  return (
    <div className="py-2">
      <TreeNode node={structure} />
    </div>
  );
}
