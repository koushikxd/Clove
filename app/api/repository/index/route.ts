import { NextRequest, NextResponse } from "next/server";
import { cloneRepository } from "@/lib/indexing/codebase";
import { indexRepository } from "@/lib/rag";
import { getRepository, parseRepoUrl } from "@/lib/github/client";
import { nanoid } from "nanoid";
import { rm } from "node:fs/promises";
import db from "@/lib/db";
import { repositoriesTable } from "@/lib/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, branch = "main" } = await req.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    const { owner, repo } = parseRepoUrl(repoUrl);
    const repoData = await getRepository(owner, repo);

    const { repoPath } = await cloneRepository(repoUrl, branch);
    const repositoryId = nanoid();

    const cleanup = async () => {
      await rm(repoPath, { recursive: true, force: true }).catch((error) =>
        console.warn(`Failed to cleanup ${repoPath}:`, error)
      );
    };

    try {
      const vectorIds = await indexRepository({
        repoPath,
        repositoryId,
        repositoryUrl: repoUrl,
      });

      await db.insert(repositoriesTable).values({
        id: repositoryId,
        name: repoData.name,
        owner: repoData.owner.login,
        url: repoUrl,
        description: repoData.description || null,
        stars: repoData.stargazers_count,
        language: repoData.language || null,
        chunksIndexed: vectorIds.length,
        status: "indexed",
      });

      await cleanup();

      return NextResponse.json({
        success: true,
        repositoryId,
        chunksIndexed: vectorIds.length,
        repository: {
          id: repositoryId,
          name: repoData.name,
          owner: repoData.owner.login,
          url: repoUrl,
        },
      });
    } catch (error) {
      await cleanup();
      throw error;
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to index repository",
      },
      { status: 500 }
    );
  }
}
