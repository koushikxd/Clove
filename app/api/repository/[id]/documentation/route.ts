import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { repositoriesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { buildDocumentationSections } from "@/lib/github/documentation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const repository = await db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.id, id))
      .limit(1);

    if (!repository || repository.length === 0) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    const repo = repository[0];

    if (!repo.repoPath) {
      return NextResponse.json(
        { error: "Repository path not found. Please re-index the repository." },
        { status: 400 }
      );
    }

    const documentation = await buildDocumentationSections(
      repo.repoPath,
      repo.url
    );

    return NextResponse.json({
      documentation,
      repository: {
        id: repo.id,
        name: repo.name,
        owner: repo.owner,
        url: repo.url,
      },
    });
  } catch (error: unknown) {
    console.error("Documentation extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract documentation",
      },
      { status: 500 }
    );
  }
}

