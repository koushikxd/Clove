import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import { chunkFiles } from "./chunker";
import { generateEmbeddings } from "./embedder";
import {
  upsertVectors,
  searchVectors,
  deleteVectors,
  type SearchFilters,
} from "./vector-store";

type IndexRepositoryParams = {
  repoPath: string;
  repositoryId: string;
  repositoryUrl: string;
  collectionName?: string;
};

type QueryOptions = {
  query: string;
  repositoryId: string;
  limit?: number;
  scoreThreshold?: number;
  collectionName?: string;
};

type Source = {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};

export const indexRepository = async (
  params: IndexRepositoryParams
): Promise<string[]> => {
  const { repoPath, repositoryId, repositoryUrl, collectionName } = params;

  const chunks = await chunkFiles(repoPath, repositoryId, repositoryUrl);

  if (chunks.length === 0) {
    return [];
  }

  const { embeddings } = await generateEmbeddings(chunks);

  const vectorIds = await upsertVectors(chunks, embeddings, collectionName);

  return vectorIds;
};

export const queryRepository = async (
  options: QueryOptions
): Promise<Source[]> => {
  const {
    query,
    repositoryId,
    limit = 8,
    scoreThreshold,
    collectionName,
  } = options;

  const validatedLimit = Math.max(3, Math.min(15, limit));

  const { embedding: queryEmbedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: query,
  });

  const searchFilters: SearchFilters = {
    repositoryId,
  };

  const results = await searchVectors(queryEmbedding, {
    filters: searchFilters,
    limit: validatedLimit,
    scoreThreshold,
    collectionName,
  });

  return results.map((result) => ({
    content: result.text,
    metadata: result.metadata,
    score: result.score,
  }));
};

export const deleteFromVectorStore = async (
  vectorIds: string[],
  collectionName?: string
): Promise<void> => {
  await deleteVectors(vectorIds, collectionName);
};

export const extractVectorIds = (metadata: unknown): string[] => {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }

  const meta = metadata as Record<string, unknown>;
  return (meta?.vectorIds as string[]) ?? [];
};
