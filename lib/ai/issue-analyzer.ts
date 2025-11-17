import { generateText } from "ai";
import { openai } from "./clients/openai";
import { queryRepository } from "../rag";

export const analyzeIssue = async (
  issueTitle: string,
  issueBody: string,
  repositoryId: string
) => {
  const query = `${issueTitle}\n${issueBody}`;
  const results = await queryRepository({
    query,
    repositoryId,
    limit: 5,
  });

  const context = results
    .map((r) => `File: ${r.metadata.filePath}\n${r.content}`)
    .join("\n\n---\n\n");

  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: `Analyze this GitHub issue and provide guidance.

Issue: ${issueTitle}
Description: ${issueBody}

Relevant Code:
${context}

Provide:
1. Summary of what needs to be done
2. Which files to modify
3. Key areas to focus on
4. Potential challenges`,
  });

  return text;
};
