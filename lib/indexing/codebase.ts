import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import { nanoid } from "nanoid";
import { chunkFiles } from "./chunker";
import type { CodeChunk } from "./chunker";

export const cloneRepository = async (
  repoUrl: string,
  branch: string = "main",
): Promise<{ repoPath: string }> => {
  if (!repoUrl?.trim() || !branch?.trim()) {
    throw new Error("Repository URL and branch are required");
  }

  const tempDir = join(process.cwd(), ".tmp", "repos", nanoid());

  try {
    await mkdir(tempDir, { recursive: true });

    const git = simpleGit();
    await git.clone(repoUrl, tempDir, [
      "--depth",
      "1",
      "--branch",
      branch,
      "--single-branch",
      "--no-tags",
    ]);

    return { repoPath: tempDir };
  } catch (error) {
    throw new Error(
      `Failed to clone repository: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export const indexRepository = async (
  repoUrl: string,
  branch: string = "main",
): Promise<{
  chunks: CodeChunk[];
  repositoryId: string;
  cleanup: () => Promise<void>;
}> => {
  const { repoPath } = await cloneRepository(repoUrl, branch);
  const repositoryId = nanoid();

  const cleanup = async () => {
    await rm(repoPath, { recursive: true, force: true }).catch((error) =>
      console.warn(`Failed to cleanup ${repoPath}:`, error),
    );
  };

  try {
    const chunks = await chunkFiles(repoPath, repositoryId, repoUrl);
    return { chunks, repositoryId, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
};
