import { NextRequest, NextResponse } from "next/server";
import { parseRepoUrl } from "@/lib/github/client";
import { getEnrichedIssues } from "@/lib/github/issues";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const repoUrl = searchParams.get("repoUrl");
    const filter = searchParams.get("filter");

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    const { owner, repo } = parseRepoUrl(repoUrl);
    let issues = await getEnrichedIssues(owner, repo);

    if (filter === "recommended") {
      issues = issues.filter((i) => i.isRecommended);
    }

    return NextResponse.json({ issues });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errorMessage || "Failed to fetch issues" },
      { status: 500 }
    );
  }
}
