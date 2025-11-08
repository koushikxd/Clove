import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";

export interface CodeChunk {
  content: string;
  filePath: string;
  repositoryId: string;
  repositoryUrl: string;
  lineStart: number;
  lineEnd: number;
  type: "module";
  metadata: Record<string, unknown>;
}

const IGNORED_PATTERNS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "coverage",
  "__pycache__",
  "venv",
  ".env",
  ".DS_Store",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const getAllFiles = async (repoPath: string): Promise<string[]> => {
  const files: string[] = [];

  const walk = async (dir: string, relativePath = ""): Promise<void> => {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relPath = join(relativePath, entry.name);

        if (entry.isDirectory()) {
          if (IGNORED_PATTERNS.has(entry.name) || entry.name.startsWith(".")) {
            continue;
          }
          await walk(fullPath, relPath);
        } else if (entry.isFile()) {
          files.push(relPath);
        }
      }
    } catch {}
  };

  await walk(repoPath);
  return files;
};

const isBinaryContent = (buffer: Buffer): boolean => {
  const sampleSize = Math.min(buffer.length, 8192);
  let controlByteCount = 0;

  for (let i = 0; i < sampleSize; i++) {
    const byte = buffer[i];
    if (byte === 0 || (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      controlByteCount++;
    }
  }

  return controlByteCount / sampleSize > 0.01;
};

const shouldProcessFile = async (fullPath: string): Promise<boolean> => {
  try {
    const stats = await stat(fullPath);
    if (stats.size > MAX_FILE_SIZE || stats.size === 0) return false;

    const buffer = await readFile(fullPath);
    return !isBinaryContent(buffer);
  } catch {
    return false;
  }
};

export const chunkFile = (
  content: string,
  filePath: string,
  repositoryId: string,
  repositoryUrl: string,
): CodeChunk[] => {
  if (!content || !filePath) return [];

  const lines = content.split("\n");
  const totalLines = lines.length;
  const maxLinesPerChunk = 100;
  const chunks: CodeChunk[] = [];
  const fileExtension = extname(filePath);

  for (let i = 0; i < totalLines; i += maxLinesPerChunk) {
    const endIndex = Math.min(i + maxLinesPerChunk, totalLines);
    const chunkContent = lines.slice(i, endIndex).join("\n");

    if (chunkContent.trim()) {
      chunks.push({
        content: chunkContent,
        filePath,
        repositoryId,
        repositoryUrl,
        lineStart: i + 1,
        lineEnd: endIndex,
        type: "module",
        metadata: {
          chunkIndex: Math.floor(i / maxLinesPerChunk),
          fileExtension,
          totalLines,
        },
      });
    }
  }

  return chunks;
};

export const prepareChunkForEmbedding = (chunk: CodeChunk): string => {
  if (!chunk?.content || !chunk?.filePath) return "";

  const prefix = `File: ${chunk.filePath}\n`;
  const metadataEntries = Object.entries(chunk.metadata);
  const metadataStr =
    metadataEntries.length > 0
      ? `Metadata: ${metadataEntries.map(([k, v]) => `${k}: ${v}`).join(", ")}\n`
      : "";

  return prefix + metadataStr + chunk.content;
};

export const chunkFiles = async (
  repoPath: string,
  repositoryId: string,
  repositoryUrl: string,
): Promise<CodeChunk[]> => {
  const files = await getAllFiles(repoPath);

  const chunkArrays = await Promise.all(
    files.map(async (filePath) => {
      try {
        const fullPath = join(repoPath, filePath);

        if (!(await shouldProcessFile(fullPath))) {
          return [];
        }

        const content = await readFile(fullPath, "utf-8");
        return chunkFile(content, filePath, repositoryId, repositoryUrl);
      } catch {
        return [];
      }
    }),
  );

  return chunkArrays.flat();
};
