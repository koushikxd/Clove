import {
  countTokens,
  calculateAvailableTokens,
  type ModelName,
} from "./token-counter";

type Source = {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};

type ContextBuilderOptions = {
  model: ModelName;
  promptTemplate: string;
  issueTitle: string;
  issueBody: string;
  maxContextTokens?: number;
  reservedForCompletion?: number;
};

type ContextResult = {
  context: string;
  totalTokens: number;
  includedSources: number;
  truncated: boolean;
};

export const buildContext = (
  sources: Source[],
  options: ContextBuilderOptions
): ContextResult => {
  try {
    const {
      model,
      promptTemplate,
      issueTitle,
      issueBody,
      maxContextTokens,
      reservedForCompletion = 4096,
    } = options;

    const availableTokens =
      maxContextTokens ||
      calculateAvailableTokens(model, reservedForCompletion);

    const basePrompt = promptTemplate
      .replace("${issueTitle}", issueTitle)
      .replace("${issueBody}", issueBody)
      .replace("${context}", "");

    const basePromptTokens = countTokens(basePrompt, model);
    const tokensForContext = availableTokens - basePromptTokens;

    if (tokensForContext <= 0) {
      return {
        context: "",
        totalTokens: basePromptTokens,
        includedSources: 0,
        truncated: true,
      };
    }

    const contextParts: string[] = [];
    let currentTokens = 0;
    let includedSources = 0;
    let truncated = false;

    const sortedSources = [...sources].sort((a, b) => b.score - a.score);

    for (const source of sortedSources) {
      const filePath = (source.metadata?.filePath as string) || "unknown";
      const sourceText = `File: ${filePath}\n${source.content}`;
      const sourceTokens = countTokens(sourceText, model);

      const separatorTokens =
        contextParts.length > 0 ? countTokens("\n\n---\n\n", model) : 0;

      if (currentTokens + sourceTokens + separatorTokens <= tokensForContext) {
        contextParts.push(sourceText);
        currentTokens += sourceTokens + separatorTokens;
        includedSources++;
      } else {
        truncated = true;
        break;
      }
    }

    const context = contextParts.join("\n\n---\n\n");

    return {
      context,
      totalTokens: basePromptTokens + currentTokens,
      includedSources,
      truncated,
    };
  } catch (error) {
    console.error("Error building context:", error);
    const fallbackContext = sources
      .slice(0, 3)
      .map((s) => {
        const filePath = (s.metadata?.filePath as string) || "unknown";
        return `File: ${filePath}\n${s.content}`;
      })
      .join("\n\n---\n\n");

    return {
      context: fallbackContext,
      totalTokens: 0,
      includedSources: Math.min(3, sources.length),
      truncated: sources.length > 3,
    };
  }
};

export const calculateMaxSources = (
  model: ModelName,
  avgChunkSize: number = 1000,
  reservedForCompletion: number = 4096
): number => {
  const availableTokens = calculateAvailableTokens(
    model,
    reservedForCompletion
  );
  const estimatedPromptTokens = 500;
  const tokensForContext = availableTokens - estimatedPromptTokens;
  const sourcesWithSeparators = Math.floor(
    tokensForContext / (avgChunkSize + 20)
  );

  return Math.max(3, Math.min(15, sourcesWithSeparators));
};
