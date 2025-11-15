import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { messagesTable, chatsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const { id, chatId, role, content, metadata } = await req.json();

    if (!chatId || !role || !content) {
      return NextResponse.json(
        { error: "Chat ID, role, and content are required" },
        { status: 400 }
      );
    }

    const messageId = id || nanoid();
    const message = await db
      .insert(messagesTable)
      .values({
        id: messageId,
        chatId,
        role,
        content,
        metadata: metadata || null,
        createdAt: new Date(),
      })
      .returning();

    await db
      .update(chatsTable)
      .set({ updatedAt: new Date() })
      .where(eq(chatsTable.id, chatId));

    return NextResponse.json({ message: message[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, chatId))
      .orderBy(messagesTable.createdAt);

    return NextResponse.json({ messages });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
