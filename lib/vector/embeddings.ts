import { embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import qdrantClient from "./qdrant";
import type { CodeChunk } from "../indexing/chunker";
import { prepareChunkForEmbedding } from "../indexing/chunker";
import { randomUUID } from "crypto";

const COLLECTION_NAME = "opensource_helper_codebase";
const VECTOR_SIZE = 1536;
const BATCH_SIZE = 100;

export async function generateEmbeddings(
  chunks: CodeChunk[],
): Promise<number[][]> {
  if (!chunks.length) return [];

  const contents = chunks.map(prepareChunkForEmbedding);
  const embeddings: number[][] = [];

  for (let i = 0; i < contents.length; i += BATCH_SIZE) {
    const batch = contents.slice(i, i + BATCH_SIZE);

    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batch,
    });

    embeddings.push(...result.embeddings);

    if (i + BATCH_SIZE < contents.length) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  return embeddings;
}

export async function ensureCollectionExists(): Promise<void> {
  try {
    await qdrantClient.getCollection(COLLECTION_NAME);
  } catch (error: any) {
    if (error.status === 404) {
      await qdrantClient.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: "Cosine",
        },
      });

      await Promise.all([
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: "repositoryId",
          field_schema: { type: "keyword", is_tenant: true },
        }),
        qdrantClient.createPayloadIndex(COLLECTION_NAME, {
          field_name: "filePath",
          field_schema: { type: "keyword" },
        }),
      ]);
    } else {
      throw error;
    }
  }
}

export async function storeEmbeddings(
  embeddings: number[][],
  chunks: CodeChunk[],
): Promise<void> {
  if (embeddings.length !== chunks.length) {
    throw new Error("Embeddings and chunks length mismatch");
  }

  await ensureCollectionExists();

  const points = embeddings.map((embedding, index) => ({
    id: randomUUID(),
    vector: embedding,
    payload: {
      content: chunks[index].content,
      filePath: chunks[index].filePath,
      repositoryId: chunks[index].repositoryId,
      repositoryUrl: chunks[index].repositoryUrl,
      lineStart: chunks[index].lineStart,
      lineEnd: chunks[index].lineEnd,
      type: chunks[index].type,
      metadata: chunks[index].metadata,
    },
  }));

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    await qdrantClient.upsert(COLLECTION_NAME, { points: batch });
  }
}

export async function searchCodebase(
  query: string,
  repositoryId: string,
  limit: number = 10,
) {
  const queryEmbedding = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: [query],
  });

  const results = await qdrantClient.search(COLLECTION_NAME, {
    vector: queryEmbedding.embeddings[0],
    limit,
    filter: {
      must: [{ key: "repositoryId", match: { value: repositoryId } }],
    },
    with_payload: true,
  });

  return results.map((result) => ({
    score: result.score,
    content: result.payload?.content as string,
    filePath: result.payload?.filePath as string,
    lineStart: result.payload?.lineStart as number,
    lineEnd: result.payload?.lineEnd as number,
  }));
}
