import { NextRequest } from "next/server";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { queryRepository } from "@/lib/rag";
import db from "@/lib/db";
import { repositoriesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { message, repositoryId } = await req.json();

    if (!message || !repositoryId) {
      return new Response("Message and repositoryId are required", {
        status: 400,
      });
    }

    const repository = await db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.id, repositoryId))
      .limit(1);

    if (!repository || repository.length === 0) {
      return new Response("Repository not found", { status: 404 });
    }

    const repo = repository[0];

    const sources = await queryRepository({
      query: message,
      repositoryId,
      limit: 8,
      scoreThreshold: 0.5,
      maxTokens: 8000,
    });

    const contextText = sources
      .map((source, idx) => {
        const filePath = source.metadata.filePath || "unknown";
        return `[Source ${idx + 1}: ${filePath}]\n${source.content}`;
      })
      .join("\n\n");

    const systemPrompt = `You are an AI assistant helping developers understand a GitHub repository.

Repository: ${repo.name} by ${repo.owner}
${repo.description ? `Description: ${repo.description}` : ""}

You have access to the repository's codebase through vector search. Use the provided code context to answer questions accurately.

Guidelines:
- Provide clear, concise explanations
- Reference specific files and code when relevant
- Explain technical concepts in an accessible way
- If you're unsure, say so rather than guessing
- Format code snippets with proper syntax highlighting
- Help users understand both the documentation and implementation

Available Context:
${contextText}`;

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Documentation chat error:", error);
    return new Response(
      error instanceof Error ? error.message : "Internal server error",
      { status: 500 }
    );
  }
}
