import { NextResponse } from "next/server";
import db from "@/lib/db";
import { repositoriesTable } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const repositories = await db
      .select()
      .from(repositoriesTable)
      .orderBy(desc(repositoriesTable.indexedAt));

    return NextResponse.json({ repositories });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories",
      },
      { status: 500 }
    );
  }
}
