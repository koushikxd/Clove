import client from "../vector/qdrant";
import { EMBEDDING_DIMENSION } from "./embedder";
import type { CodeChunk } from "./chunker";

const DEFAULT_COLLECTION = "clove";

type VectorMetadata = {
  repositoryId: string;
  repositoryUrl: string;
  filePath: string;
  fileExtension: string;
  chunkIndex: number;
  type: string;
  text: string;
  [key: string]: unknown;
};

type SearchResult = {
  id: string;
  score: number;
  text: string;
  metadata: VectorMetadata;
};

type SearchFilters = {
  repositoryId?: string;
  filePath?: string;
  type?: string;
};

const ensureCollectionExists = async (collectionName: string) => {
  try {
    await client.getCollection(collectionName);
  } catch {
    await client.createCollection(collectionName, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: "Cosine",
      },
    });

    await Promise.all([
      client.createPayloadIndex(collectionName, {
        field_name: "repositoryId",
        field_schema: "keyword",
      }),
      client.createPayloadIndex(collectionName, {
        field_name: "filePath",
        field_schema: "keyword",
      }),
      client.createPayloadIndex(collectionName, {
        field_name: "type",
        field_schema: "keyword",
      }),
    ]);
  }
};

export const upsertVectors = async (
  chunks: CodeChunk[],
  embeddings: number[][],
  collectionName: string = DEFAULT_COLLECTION
): Promise<string[]> => {
  await ensureCollectionExists(collectionName);

  const points = chunks.map((chunk, index) => ({
    id: chunk.id,
    vector: embeddings[index],
    payload: {
      ...chunk.metadata,
      text: chunk.text,
    } as VectorMetadata,
  }));

  await client.upsert(collectionName, {
    wait: true,
    points,
  });

  return points.map((p) => p.id);
};

export const searchVectors = async (
  queryEmbedding: number[],
  options: {
    filters?: SearchFilters;
    limit?: number;
    scoreThreshold?: number;
    collectionName?: string;
  } = {}
): Promise<SearchResult[]> => {
  const {
    filters,
    limit = 8,
    scoreThreshold,
    collectionName = DEFAULT_COLLECTION,
  } = options;

  await ensureCollectionExists(collectionName);

  const qdrantFilter = filters
    ? {
        must: Object.entries(filters)
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => ({
            key,
            match: { value },
          })),
      }
    : undefined;

  let searchResults: Awaited<ReturnType<typeof client.search>>;

  try {
    searchResults = await client.search(collectionName, {
      vector: queryEmbedding,
      limit,
      score_threshold: scoreThreshold,
      filter: qdrantFilter,
      with_payload: true,
    });
  } catch (error) {
    console.error(error);
    return [];
  }

  return searchResults.map((result) => ({
    id: result.id as string,
    score: result.score,
    text: (result.payload?.text as string) ?? "",
    metadata: result.payload as VectorMetadata,
  }));
};

export const deleteVectors = async (
  vectorIds: string[],
  collectionName: string = DEFAULT_COLLECTION
): Promise<void> => {
  if (vectorIds.length === 0) return;

  await client
    .delete(collectionName, {
      wait: true,
      points: vectorIds,
    })
    .catch(() => null);
};

export type { VectorMetadata, SearchResult, SearchFilters };
