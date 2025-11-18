import { streamText } from "ai";
import { openai } from "./clients/openai";
import { queryRepository } from "../rag";
import { buildContext, calculateMaxSources } from "./context-builder";

const MODEL = "gpt-4o";

export const generateSolution = async (
  issueTitle: string,
  issueBody: string,
  repositoryId: string
) => {
  const query = `${issueTitle}\n${issueBody}`;

  const maxSources = calculateMaxSources(MODEL, 1000, 8192);

  const results = await queryRepository({
    query,
    repositoryId,
    limit: maxSources,
  });

  const promptTemplate = `Help a beginner solve this GitHub issue.

Issue: \${issueTitle}
Description: \${issueBody}

Relevant Code:
\${context}

Provide step-by-step solution:
1. Problem explanation
2. Files to modify
3. Code changes (before/after)
4. Testing steps
5. Best practices

Be clear and beginner-friendly.`;

  const { context } = buildContext(results, {
    model: MODEL,
    promptTemplate,
    issueTitle,
    issueBody,
    reservedForCompletion: 8192,
  });

  return streamText({
    model: openai(MODEL),
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
