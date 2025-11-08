import { env } from "@/env";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

export const parseRepoUrl = (
  repoUrl: string,
): { owner: string; repo: string } => {
  const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
  if (!match) throw new Error("Invalid GitHub URL");
  return { owner: match[1], repo: match[2] };
};

export const getRepository = async (owner: string, repo: string) => {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
};

export const getRepositoryTree = async (
  owner: string,
  repo: string,
  branch: string,
) => {
  const { data } = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "1",
  });
  return data.tree;
};

export const getFileContent = async (
  owner: string,
  repo: string,
  path: string,
) => {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  if (Array.isArray(data) || data.type !== "file" || !("content" in data)) {
    throw new Error("Invalid file");
  }

  return {
    name: data.name,
    path: data.path,
    content: Buffer.from(
      data.content,
      data.encoding as BufferEncoding,
    ).toString("utf-8"),
    sha: data.sha,
  };
};
