type ModelName = "gpt-4o" | "gpt-4o-mini" | "gpt-4" | "gpt-3.5-turbo";

const MODEL_CONTEXT_LIMITS: Record<ModelName, number> = {
  "gpt-4o": 128000,
  "gpt-4o-mini": 128000,
  "gpt-4": 8192,
  "gpt-3.5-turbo": 16385,
};

export const countTokens = (text: string, _model?: ModelName): number => {
  if (!text) return 0;

  const words = text.split(/\s+/).length;
  const chars = text.length;

  const avgCharsPerToken = 4;
  const tokenEstimateFromChars = Math.ceil(chars / avgCharsPerToken);
  const tokenEstimateFromWords = Math.ceil(words * 1.3);

  return Math.max(tokenEstimateFromChars, tokenEstimateFromWords);
};

export const getModelContextLimit = (model: ModelName): number => {
  return MODEL_CONTEXT_LIMITS[model] || 128000;
};

export const calculateAvailableTokens = (
  model: ModelName,
  reservedForCompletion: number = 4096,
  bufferPercentage: number = 0.1
): number => {
  const totalLimit = getModelContextLimit(model);
  const buffer = Math.ceil(totalLimit * bufferPercentage);
  return totalLimit - reservedForCompletion - buffer;
};

export type { ModelName };
