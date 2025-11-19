import { env } from "@/env";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

interface Issue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: Array<{
    name: string;
    color: string;
    description?: string;
  }>;
  created_at: string;
  html_url: string;
  comments: number;
}

interface EnrichedIssue extends Issue {
  complexityScore: number;
  isRecommended: boolean;
  recommendationReason?: string;
}

export const getIssues = async (
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open"
) => {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
  });

  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((label) =>
        typeof label === "string"
          ? { name: label, color: "808080", description: undefined }
          : {
              name: label.name || "",
              color: label.color || "808080",
              description: label.description || undefined,
            }
      ),
      created_at: issue.created_at,
      html_url: issue.html_url,
      comments: issue.comments,
    })) as Issue[];
};

export const analyzeIssueComplexity = (issue: Issue): EnrichedIssue => {
  let complexityScore = 50;
  let isRecommended = false;
  let recommendationReason: string | undefined;

  const labels = issue.labels.map((l) => l.name.toLowerCase());
  const title = issue.title.toLowerCase();
  const body = (issue.body || "").toLowerCase();

  const beginnerFriendlyLabels = [
    "good first issue",
    "beginner",
    "easy",
    "first-timers-only",
    "help wanted",
    "starter",
    "good-first-bug",
  ];

  const documentationKeywords = [
    "documentation",
    "docs",
    "readme",
    "typo",
    "spelling",
    "comment",
  ];

  const complexKeywords = [
    "architecture",
    "refactor",
    "breaking change",
    "performance",
    "optimization",
    "security",
    "critical",
  ];

  const hasBeginnerLabel = labels.some((l) =>
    beginnerFriendlyLabels.some((bf) => l.includes(bf))
  );

  const isDocumentation =
    labels.some((l) => documentationKeywords.some((dk) => l.includes(dk))) ||
    documentationKeywords.some((dk) => title.includes(dk));

  const isComplex =
    labels.some((l) => complexKeywords.some((ck) => l.includes(ck))) ||
    complexKeywords.some((ck) => title.includes(ck) || body.includes(ck));

  if (hasBeginnerLabel) {
    complexityScore -= 30;
    isRecommended = true;
    recommendationReason = "Labeled as beginner-friendly";
  }

  if (isDocumentation) {
    complexityScore -= 25;
    if (!isRecommended) {
      isRecommended = true;
      recommendationReason = "Documentation update";
    }
  }

  if (isComplex) {
    complexityScore += 35;
    isRecommended = false;
  }

  const commentCount = issue.comments || 0;
  if (commentCount > 15) {
    complexityScore += 20;
  } else if (commentCount > 5) {
    complexityScore += 10;
  } else if (commentCount === 0) {
    complexityScore -= 5;
  }

  const bodyLength = issue.body?.length || 0;
  if (bodyLength < 150) {
    complexityScore -= 10;
  } else if (bodyLength > 1000) {
    complexityScore += 15;
  }

  const issueAge = Date.now() - new Date(issue.created_at).getTime();
  const daysOld = issueAge / (1000 * 60 * 60 * 24);
  if (daysOld < 7) {
    complexityScore -= 5;
  }

  if (
    !isRecommended &&
    complexityScore < 40 &&
    !isComplex &&
    (isDocumentation || bodyLength < 300 || hasBeginnerLabel)
  ) {
    isRecommended = true;
    recommendationReason = "Good starter issue";
  }

  return {
    ...issue,
    complexityScore: Math.max(0, Math.min(100, complexityScore)),
    isRecommended,
    recommendationReason,
  };
};

export const getEnrichedIssues = async (owner: string, repo: string) => {
  const issues = await getIssues(owner, repo);
  const enriched = issues.map(analyzeIssueComplexity);

  return enriched.sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    return a.complexityScore - b.complexityScore;
  });
};
