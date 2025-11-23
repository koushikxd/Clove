import { Badge } from "@/components/ui/badge";

interface Dependencies {
  [key: string]: string;
}

interface DependencyInfo {
  type: string;
  dependencies: Dependencies;
  devDependencies?: Dependencies;
}

interface DependencyTableProps {
  dependencies: DependencyInfo[];
}

const typeLabels: Record<string, string> = {
  npm: "NPM",
  pip: "Python",
  cargo: "Rust",
  go: "Go",
};

const typeColors: Record<string, string> = {
  npm: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900",
  pip: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  cargo:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900",
  go: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900",
};

export function DependencyTable({ dependencies }: DependencyTableProps) {
  if (!dependencies || dependencies.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No dependencies detected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {dependencies.map((depInfo, idx) => (
        <div key={idx} className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <Badge
              className={typeColors[depInfo.type] || "bg-muted"}
              variant="outline"
            >
              {typeLabels[depInfo.type] || depInfo.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {Object.keys(depInfo.dependencies).length} packages
            </span>
          </div>

          <div className="space-y-1">
            {Object.entries(depInfo.dependencies).map(([name, version]) => (
              <div
                key={name}
                className="flex items-center justify-between text-xs py-1 hover:bg-muted/50 rounded px-1 transition-colors"
              >
                <span className="font-mono font-medium text-foreground/90 truncate max-w-[70%]">
                  {name}
                </span>
                <span className="text-muted-foreground font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                  {version}
                </span>
              </div>
            ))}
          </div>

          {depInfo.devDependencies &&
            Object.keys(depInfo.devDependencies).length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dev Dependencies
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 rounded-full">
                    {Object.keys(depInfo.devDependencies).length}
                  </span>
                </div>

                <div className="space-y-1">
                  {Object.entries(depInfo.devDependencies).map(
                    ([name, version]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-xs py-1 hover:bg-muted/50 rounded px-1 transition-colors"
                      >
                        <span className="font-mono font-medium text-foreground/90 truncate max-w-[70%]">
                          {name}
                        </span>
                        <span className="text-muted-foreground font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {version}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}
