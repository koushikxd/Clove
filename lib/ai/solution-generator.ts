import { streamText } from "ai";
import { openai } from "./clients/openai";
import { semanticSearch } from "../vector/utils";

export const generateSolution = async (
  issueTitle: string,
  issueBody: string,
  repositoryId: string,
) => {
  const query = `${issueTitle}\n${issueBody}`;
  const results = await semanticSearch(query, repositoryId, 8);

  const context = results
    .map((r) => `File: ${r.payload?.filePath}\n${r.payload?.content}`)
    .join("\n\n---\n\n");

  return streamText({
    model: openai("gpt-4o"),
    prompt: `Help a beginner solve this GitHub issue.

Issue: ${issueTitle}
Description: ${issueBody}

Relevant Code:
${context}

Provide step-by-step solution:
1. Problem explanation
2. Files to modify
3. Code changes (before/after)
4. Testing steps
5. Best practices

Be clear and beginner-friendly.`,
  });
};
