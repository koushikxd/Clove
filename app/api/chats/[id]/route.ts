import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { chatsTable, messagesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const chat = await db
      .select()
      .from(chatsTable)
      .where(eq(chatsTable.id, id))
      .limit(1);

    if (!chat || chat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.chatId, id))
      .orderBy(messagesTable.createdAt);

    return NextResponse.json({ chat: chat[0], messages });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(chatsTable).where(eq(chatsTable.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to delete chat" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(chatsTable)
      .set({ title, updatedAt: new Date() })
      .where(eq(chatsTable.id, id))
      .returning();

    return NextResponse.json({ chat: updated[0] });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to update chat" },
      { status: 500 }
    );
  }
}

