import { NextRequest, NextResponse } from "next/server";
import { indexRepository } from "@/lib/indexing/codebase";
import { generateEmbeddings, storeInVectorDatabase } from "@/lib/vector/utils";
import { getRepository, parseRepoUrl } from "@/lib/github/client";
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

    const { chunks, repositoryId, cleanup } = await indexRepository(
      repoUrl,
      branch
    );

    const embeddings = await generateEmbeddings(chunks);
    await storeInVectorDatabase(embeddings, chunks);

    await db.insert(repositoriesTable).values({
      id: repositoryId,
      name: repoData.name,
      owner: repoData.owner.login,
      url: repoUrl,
      description: repoData.description || null,
      stars: repoData.stargazers_count,
      language: repoData.language || null,
      chunksIndexed: chunks.length,
      status: "indexed",
    });

    await cleanup();

    return NextResponse.json({
      success: true,
      repositoryId,
      chunksIndexed: chunks.length,
      repository: {
        id: repositoryId,
        name: repoData.name,
        owner: repoData.owner.login,
        url: repoUrl,
      },
    });
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
