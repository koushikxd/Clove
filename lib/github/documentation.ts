import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { getRepository, parseRepoUrl } from "./client";

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
  path: string; // Relative path to the dependency file
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

interface DocumentationData {
  sections: DocumentationSection[];
  folderStructure: FolderNode;
  dependencies: DependencyInfo[];
  metadata: GitHubMetadata;
}

const IGNORED_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo",
  "coverage",
  ".cache",
  "vendor",
  "__pycache__",
  ".pytest_cache",
  ".venv",
  "venv",
  "target",
];

export async function extractReadme(repoPath: string): Promise<string | null> {
  const possibleNames = ["README.md", "readme.md", "Readme.md", "README.MD"];

  for (const name of possibleNames) {
    try {
      const content = await readFile(join(repoPath, name), "utf-8");
      return content;
    } catch {
      continue;
    }
  }

  return null;
}

export async function extractContributingDocs(
  repoPath: string
): Promise<DocumentationSection[]> {
  const docs: DocumentationSection[] = [];
  const docFiles = [
    { name: "CONTRIBUTING.md", title: "Contributing", order: 1 },
    { name: "LICENSE", title: "License", order: 2 },
    { name: "LICENSE.md", title: "License", order: 2 },
    { name: "CHANGELOG.md", title: "Changelog", order: 3 },
    { name: "CODE_OF_CONDUCT.md", title: "Code of Conduct", order: 4 },
    { name: "SECURITY.md", title: "Security", order: 5 },
  ];

  for (const doc of docFiles) {
    try {
      const content = await readFile(join(repoPath, doc.name), "utf-8");
      docs.push({
        id: doc.name.toLowerCase().replace(/\./g, "-"),
        title: doc.title,
        content,
        order: doc.order,
      });
    } catch {
      continue;
    }
  }

  return docs;
}

async function buildFolderTree(
  dirPath: string,
  relativePath: string = "",
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<FolderNode> {
  const name = relativePath
    ? relativePath.split("/").pop()!
    : dirPath.split("/").pop()!;

  if (currentDepth >= maxDepth) {
    return {
      name,
      type: "directory",
      path: relativePath,
    };
  }

  const entries = await readdir(dirPath);
  const children: FolderNode[] = [];

  for (const entry of entries) {
    if (
      entry.startsWith(".") &&
      entry !== ".gitignore" &&
      entry !== ".env.example"
    ) {
      continue;
    }

    if (IGNORED_DIRS.includes(entry)) {
      continue;
    }

    const fullPath = join(dirPath, entry);
    const relPath = relativePath ? `${relativePath}/${entry}` : entry;

    try {
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        const childNode = await buildFolderTree(
          fullPath,
          relPath,
          maxDepth,
          currentDepth + 1
        );
        children.push(childNode);
      } else if (stats.isFile()) {
        children.push({
          name: entry,
          type: "file",
          path: relPath,
        });
      }
    } catch {
      continue;
    }
  }

  children.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "directory" ? -1 : 1;
  });

  return {
    name,
    type: "directory",
    path: relativePath,
    children,
  };
}

export async function extractFolderStructure(
  repoPath: string
): Promise<FolderNode> {
  return buildFolderTree(repoPath);
}

async function findFiles(
  dir: string,
  filename: string,
  maxDepth: number = 4
): Promise<string[]> {
  const results: string[] = [];

  async function scan(currentDir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (
            !IGNORED_DIRS.includes(entry.name) &&
            !entry.name.startsWith(".")
          ) {
            await scan(fullPath, depth + 1);
          }
        } else if (entry.name.toLowerCase() === filename.toLowerCase()) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}:`, error);
    }
  }

  await scan(dir, 0);
  return results;
}

export async function extractDependencies(
  repoPath: string
): Promise<DependencyInfo[]> {
  const dependencyFiles: DependencyInfo[] = [];

  // NPM (package.json)
  const packageJsonFiles = await findFiles(repoPath, "package.json");
  for (const file of packageJsonFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const pkg = JSON.parse(content);
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};

      if (Object.keys(deps).length > 0 || Object.keys(devDeps).length > 0) {
        dependencyFiles.push({
          type: "npm",
          path: relative(repoPath, file),
          dependencies: deps,
          devDependencies: devDeps,
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Python (requirements.txt)
  const requirementsFiles = await findFiles(repoPath, "requirements.txt");
  for (const file of requirementsFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const deps: Dependencies = {};
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [name, version] = trimmed.split(/==|>=|<=|~=|>|</);
          if (name) {
            deps[name.trim()] = version?.trim() || "*";
          }
        }
      });

      if (Object.keys(deps).length > 0) {
        dependencyFiles.push({
          type: "pip",
          path: relative(repoPath, file),
          dependencies: deps,
        });
      }
    } catch {
      // Ignore errors
    }
  }

  // Rust (Cargo.toml)
  const cargoFiles = await findFiles(repoPath, "Cargo.toml");
  for (const file of cargoFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const deps: Dependencies = {};
      const depSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
      if (depSection) {
        const lines = depSection[1].split("\n");
        for (const line of lines) {
          const match = line.match(/^(\w+)\s*=\s*"([^"]+)"/);
          if (match) {
            deps[match[1]] = match[2];
          }
        }
      }

      if (Object.keys(deps).length > 0) {
        dependencyFiles.push({
          type: "cargo",
          path: relative(repoPath, file),
          dependencies: deps,
        });
      }
    } catch {
      // Ignore errors
    }
  }

  // Go (go.mod)
  const goModFiles = await findFiles(repoPath, "go.mod");
  for (const file of goModFiles) {
    try {
      const content = await readFile(file, "utf-8");
      const deps: Dependencies = {};
      const lines = content.split("\n");
      let inRequire = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("require (")) {
          inRequire = true;
          continue;
        }
        if (trimmed === ")") {
          inRequire = false;
          continue;
        }
        if (inRequire || trimmed.startsWith("require ")) {
          const match = trimmed.match(/^(?:require\s+)?(\S+)\s+(\S+)/);
          if (match) {
            deps[match[1]] = match[2];
          }
        }
      }

      if (Object.keys(deps).length > 0) {
        dependencyFiles.push({
          type: "go",
          path: relative(repoPath, file),
          dependencies: deps,
        });
      }
    } catch {
      // Ignore errors
    }
  }

  return dependencyFiles;
}

export async function extractGitHubMetadata(
  repoUrl: string
): Promise<GitHubMetadata> {
  const { owner, repo } = parseRepoUrl(repoUrl);
  const repoData = await getRepository(owner, repo);

  return {
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    watchers: repoData.watchers_count,
    language: repoData.language,
    license: repoData.license?.name || null,
    defaultBranch: repoData.default_branch,
    createdAt: repoData.created_at,
    updatedAt: repoData.updated_at,
    topics: repoData.topics || [],
    homepage: repoData.homepage,
  };
}

export async function buildDocumentationSections(
  repoPath: string,
  repoUrl: string
): Promise<DocumentationData> {
  const sections: DocumentationSection[] = [];

  const readme = await extractReadme(repoPath);
  if (readme) {
    sections.push({
      id: "readme",
      title: "README",
      content: readme,
      order: 0,
    });
  }

  const contributingDocs = await extractContributingDocs(repoPath);
  sections.push(...contributingDocs);

  const folderStructure = await extractFolderStructure(repoPath);
  const dependencies = await extractDependencies(repoPath);
  const metadata = await extractGitHubMetadata(repoUrl);

  return {
    sections: sections.sort((a, b) => a.order - b.order),
    folderStructure,
    dependencies,
    metadata,
  };
}
