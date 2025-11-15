import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { chatsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const { repositoryId, title } = await req.json();

    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    const chatId = nanoid();
    const chat = await db
      .insert(chatsTable)
      .values({
        id: chatId,
        repositoryId,
        title: title || "New Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ chat: chat[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to create chat" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repositoryId = searchParams.get("repositoryId");

    if (!repositoryId) {
      return NextResponse.json(
        { error: "Repository ID is required" },
        { status: 400 }
      );
    }

    const chats = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.repositoryId, repositoryId))
      .orderBy(chatsTable.updatedAt);

    return NextResponse.json({ chats });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

