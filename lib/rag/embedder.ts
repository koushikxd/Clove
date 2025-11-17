import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import type { CodeChunk } from "./chunker";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;
const BATCH_SIZE = 96;

type EmbeddingResult = {
  embeddings: number[][];
  texts: string[];
};

export const generateEmbeddings = async (
  chunks: CodeChunk[]
): Promise<EmbeddingResult> => {
  const texts = chunks.map((chunk) => chunk.text);

  if (texts.length === 0) {
    return { embeddings: [], texts: [] };
  }

  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    batches.push(texts.slice(i, i + BATCH_SIZE));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const { embeddings } = await embedMany({
      model: openai.embedding(EMBEDDING_MODEL),
      values: batch,
    });

    allEmbeddings.push(...embeddings);
  }

  return {
    embeddings: allEmbeddings,
    texts,
  };
};

export { EMBEDDING_DIMENSION };
