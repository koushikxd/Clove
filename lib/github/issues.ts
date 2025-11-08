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
  labels: Array<{ name: string }>;
  created_at: string;
  html_url: string;
  comments: number;
}

interface ClassifiedIssue extends Issue {
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
}

export const getIssues = async (
  owner: string,
  repo: string,
  state: "open" | "closed" | "all" = "open",
) => {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state,
    per_page: 100,
  });

  return data.filter((issue) => !issue.pull_request) as Issue[];
};

export const classifyIssue = (issue: Issue): ClassifiedIssue => {
  let score = 50;
  const tags: string[] = [];

  const easyLabels = ["good first issue", "beginner", "easy", "documentation"];
  const hardLabels = ["complex", "architecture", "breaking change"];

  const labels = issue.labels.map((l) => l.name.toLowerCase());

  if (labels.some((l) => easyLabels.some((easy) => l.includes(easy)))) {
    score -= 30;
    tags.push("beginner-friendly");
  }

  if (labels.some((l) => hardLabels.some((hard) => l.includes(hard)))) {
    score += 30;
  }

  if (issue.comments > 10) score += 15;
  if ((issue.body?.length || 0) < 200) score -= 10;

  const difficulty: "easy" | "medium" | "hard" =
    score < 40 ? "easy" : score < 70 ? "medium" : "hard";

  return { ...issue, difficulty, tags };
};

export const getClassifiedIssues = async (owner: string, repo: string) => {
  const issues = await getIssues(owner, repo);
  return issues.map(classifyIssue);
};

export const getEasyIssues = async (owner: string, repo: string) => {
  const classified = await getClassifiedIssues(owner, repo);
  return classified.filter((i) => i.difficulty === "easy");
};
