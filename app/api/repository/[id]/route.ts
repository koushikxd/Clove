import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { repositoriesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

    if (!repository.length) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ repository: repository[0] });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch repository",
      },
      { status: 500 }
    );
  }
}
