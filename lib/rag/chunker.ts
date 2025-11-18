import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { MDocument } from "@mastra/rag";

export interface CodeChunk {
  id: string;
  text: string;
  metadata: {
    repositoryId: string;
    repositoryUrl: string;
    filePath: string;
    fileExtension: string;
    chunkIndex: number;
    type: string;
  };
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
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 100;
const WHITESPACE_REGEX = /\s+/;

const estimateTokenCount = (text: string): number =>
  Math.ceil(text.split(WHITESPACE_REGEX).length * 1.3);

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

const MARKDOWN_EXTENSIONS = new Set([".md", ".mdx", ".markdown"]);

export const chunkFile = async (
  content: string,
  filePath: string,
  repositoryId: string,
  repositoryUrl: string
): Promise<CodeChunk[]> => {
  if (!content || !filePath) return [];

  try {
    const fileExtension = extname(filePath);
    const baseMetadata = {
      repositoryId,
      repositoryUrl,
      filePath,
      fileExtension,
      type: "code",
    };

    const isMarkdown = MARKDOWN_EXTENSIONS.has(fileExtension.toLowerCase());

    const doc = isMarkdown
      ? MDocument.fromMarkdown(content, baseMetadata)
      : MDocument.fromText(content, baseMetadata);

    const chunks = await doc.chunk({
      strategy: "recursive",
      maxSize: CHUNK_SIZE,
      overlap: CHUNK_OVERLAP,
      lengthFunction: estimateTokenCount,
      keepSeparator: true,
      stripWhitespace: false,
    });

    return chunks.map((chunk, index) => ({
      id: chunk.id_,
      text: chunk.text,
      metadata: {
        ...baseMetadata,
        chunkIndex: index,
      },
    }));
  } catch (error) {
    console.error(`Error chunking file ${filePath}:`, error);
    return [];
  }
};

export const chunkFiles = async (
  repoPath: string,
  repositoryId: string,
  repositoryUrl: string
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
        return await chunkFile(content, filePath, repositoryId, repositoryUrl);
      } catch {
        return [];
      }
    })
  );

  return chunkArrays.flat();
};
