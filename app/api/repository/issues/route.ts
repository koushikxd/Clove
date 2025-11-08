import { NextRequest, NextResponse } from "next/server";
import { parseRepoUrl } from "@/lib/github/client";
import { getClassifiedIssues, getEasyIssues } from "@/lib/github/issues";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repoUrl = searchParams.get("repoUrl");
    const difficulty = searchParams.get("difficulty") as
      | "easy"
      | "medium"
      | "hard"
      | null;

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 },
      );
    }

    const { owner, repo } = parseRepoUrl(repoUrl);

    const issues =
      difficulty === "easy"
        ? await getEasyIssues(owner, repo)
        : (await getClassifiedIssues(owner, repo)).filter(
            (i) => !difficulty || i.difficulty === difficulty,
          );

    return NextResponse.json({ issues });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch issues" },
      { status: 500 },
    );
  }
}
