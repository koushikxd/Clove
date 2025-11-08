import { NextRequest, NextResponse } from "next/server";
import { analyzeIssue } from "@/lib/ai/issue-analyzer";

export async function POST(req: NextRequest) {
  try {
    const { issueTitle, issueBody, repositoryId } = await req.json();

    if (!issueTitle || !repositoryId) {
      return NextResponse.json(
        { error: "Issue title and repository ID are required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeIssue(
      issueTitle,
      issueBody || "",
      repositoryId
    );

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to analyze issue" },
      { status: 500 }
    );
  }
}
