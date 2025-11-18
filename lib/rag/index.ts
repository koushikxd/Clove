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
import { countTokens } from "../ai/token-counter";

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
  maxTokens?: number;
};

type Source = {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
};

export const indexRepository = async (
  params: IndexRepositoryParams
): Promise<string[]> => {
  try {
    const { repoPath, repositoryId, repositoryUrl, collectionName } = params;

    const chunks = await chunkFiles(repoPath, repositoryId, repositoryUrl);

    if (chunks.length === 0) {
      console.warn("No chunks generated from repository");
      return [];
    }

    console.log(`Generated ${chunks.length} chunks, generating embeddings...`);

    const { embeddings } = await generateEmbeddings(chunks);

    if (!embeddings || embeddings.length === 0) {
      throw new Error("Failed to generate embeddings");
    }

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: ${embeddings.length} embeddings for ${chunks.length} chunks`
      );
    }

    console.log(
      `Generated ${embeddings.length} embeddings, storing vectors...`
    );

    const vectorIds = await upsertVectors(chunks, embeddings, collectionName);

    console.log(`Successfully stored ${vectorIds.length} vectors`);

    return vectorIds;
  } catch (error) {
    console.error("Error in indexRepository:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to index repository");
  }
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
    maxTokens,
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

  const sources = results.map((result) => ({
    content: result.text,
    metadata: result.metadata,
    score: result.score,
  }));

  if (!maxTokens) {
    return sources;
  }

  const filteredSources: Source[] = [];
  let currentTokens = 0;

  for (const source of sources) {
    const sourceTokens = countTokens(source.content);

    if (currentTokens + sourceTokens <= maxTokens) {
      filteredSources.push(source);
      currentTokens += sourceTokens;
    } else {
      break;
    }
  }

  return filteredSources;
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
