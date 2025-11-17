import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { simpleGit } from "simple-git";
import { nanoid } from "nanoid";

export const cloneRepository = async (
  repoUrl: string,
  branch: string = "main"
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
      }`
    );
  }
};
