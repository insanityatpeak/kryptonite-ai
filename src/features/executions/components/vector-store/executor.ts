import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import prisma from "@/lib/db";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type VectorStoreData = {
  variableName?: string;
  operation?: string;
  indexHost?: string;
  vector?: string;
  id?: string;
  metadata?: string;
  topK?: number;
};

// The production DB is managed via `prisma db push`, which can't run from CI
// here (DATABASE_URL is a sealed Vercel secret) — so the built-in store
// provisions its own table on first use instead.
let tableReady = false;
async function ensureVectorTable() {
  if (tableReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VectorRecord" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "namespace" TEXT NOT NULL DEFAULT 'default',
      "vectorId" TEXT NOT NULL,
      "vector" JSONB NOT NULL,
      "metadata" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "VectorRecord_userId_namespace_vectorId_key" ON "VectorRecord"("userId", "namespace", "vectorId")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "VectorRecord_userId_namespace_idx" ON "VectorRecord"("userId", "namespace")`,
  );
  tableReady = true;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export const vectorStoreExecutor: NodeExecutor<VectorStoreData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  userId,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Vector Store: Variable name required");
  }

  const operation = data.operation || "query";
  const indexHost = data.indexHost
    ? decode(Handlebars.compile(data.indexHost)(context)).trim()
    : "";
  // Pinecone is only used when both a key and an index host are configured;
  // otherwise vectors live in Kryptonite's own database (namespace = index host
  // field or "default"), which pairs with the built-in Embeddings node.
  const usePinecone = Boolean(
    process.env.PINECONE_API_KEY && indexHost.startsWith("http"),
  );

  try {
    const result = await step.run("vector-store-run", async () => {
      const vector: number[] = JSON.parse(
        decode(Handlebars.compile(data.vector || "[]")(context)),
      );

      if (usePinecone) {
        const headers = {
          "Api-Key": process.env.PINECONE_API_KEY || "",
          "Content-Type": "application/json",
        };
        if (operation === "upsert") {
          const metadata = data.metadata
            ? JSON.parse(decode(Handlebars.compile(data.metadata)(context)))
            : {};
          const id = decode(
            Handlebars.compile(data.id || `vec-${Date.now()}`)(context),
          );
          const res = await ky
            .post(`${indexHost}/vectors/upsert`, {
              headers,
              json: { vectors: [{ id, values: vector, metadata }] },
              timeout: 30000,
            })
            .json();
          return {
            ...context,
            [data.variableName!]: {
              operation: "upsert",
              store: "pinecone",
              id,
              result: res,
            },
          };
        }
        const res = await ky
          .post(`${indexHost}/query`, {
            headers,
            json: { vector, topK: data.topK || 5, includeMetadata: true },
            timeout: 30000,
          })
          .json<{ matches: unknown[] }>();
        return {
          ...context,
          [data.variableName!]: {
            operation: "query",
            store: "pinecone",
            matches: res.matches,
          },
        };
      }

      // Built-in store
      await ensureVectorTable();
      const namespace = indexHost || "default";
      if (operation === "upsert") {
        if (!vector.length)
          throw new NonRetriableError(
            "Vector Store: Vector is required for upsert — pass {{myEmbedding.embedding}} from an Embeddings node",
          );
        const metadata = data.metadata
          ? JSON.parse(decode(Handlebars.compile(data.metadata)(context)))
          : {};
        const vectorId = decode(
          Handlebars.compile(data.id || `vec-${Date.now()}`)(context),
        );
        await prisma.vectorRecord.upsert({
          where: { userId_namespace_vectorId: { userId, namespace, vectorId } },
          create: { userId, namespace, vectorId, vector, metadata },
          update: { vector, metadata },
        });
        return {
          ...context,
          [data.variableName!]: {
            operation: "upsert",
            store: "built-in",
            id: vectorId,
            namespace,
          },
        };
      }

      if (!vector.length)
        throw new NonRetriableError(
          "Vector Store: Vector is required for query — pass {{myEmbedding.embedding}} from an Embeddings node",
        );
      const records = await prisma.vectorRecord.findMany({
        where: { userId, namespace },
        take: 1000,
        orderBy: { updatedAt: "desc" },
      });
      const matches = records
        .map((r) => ({
          id: r.vectorId,
          score: cosineSimilarity(vector, r.vector as number[]),
          metadata: r.metadata,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, data.topK || 5);
      return {
        ...context,
        [data.variableName!]: {
          operation: "query",
          store: "built-in",
          namespace,
          matches,
        },
      };
    });
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (err) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
