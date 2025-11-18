import { generateText } from "ai";
import { openai } from "./clients/openai";
import { queryRepository } from "../rag";
import { buildContext, calculateMaxSources } from "./context-builder";

const MODEL = "gpt-4o-mini";

export const analyzeIssue = async (
  issueTitle: string,
  issueBody: string,
  repositoryId: string
) => {
  const query = `${issueTitle}\n${issueBody}`;

  const maxSources = calculateMaxSources(MODEL, 1000, 4096);

  const results = await queryRepository({
    query,
    repositoryId,
    limit: maxSources,
  });

  const promptTemplate = `Analyze this GitHub issue and provide guidance.

Issue: \${issueTitle}
Description: \${issueBody}

Relevant Code:
\${context}

Provide:
1. Summary of what needs to be done
2. Which files to modify
3. Key areas to focus on
4. Potential challenges`;

  const { context } = buildContext(results, {
    model: MODEL,
    promptTemplate,
    issueTitle,
    issueBody,
    reservedForCompletion: 4096,
  });

  const { text } = await generateText({
    model: openai(MODEL),
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
