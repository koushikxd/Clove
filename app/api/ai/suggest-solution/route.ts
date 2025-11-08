import { NextRequest } from "next/server";
import { generateSolution } from "@/lib/ai/solution-generator";

export async function POST(req: NextRequest) {
  try {
    const { issueTitle, issueBody, repositoryId } = await req.json();

    if (!issueTitle || !repositoryId) {
      return new Response("Issue title and repository ID are required", {
        status: 400,
      });
    }

    const result = await generateSolution(
      issueTitle,
      issueBody || "",
      repositoryId
    );

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(errorMessage || "Failed to generate solution", {
      status: 500,
    });
  }
}
