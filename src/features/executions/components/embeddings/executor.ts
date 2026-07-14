import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type EmbeddingsData = { variableName?: string; text?: string; model?: string };

// FNV-1a hash → float in [0,1]
function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

// Simple local embedding: bag-of-words + bigrams projected to fixed-dim vector via hashing.
// Produces consistent, normalised float vectors usable with cosine-similarity stores.
function localEmbed(text: string, dimensions = 384): number[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const vec = new Array<number>(dimensions).fill(0);

  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const idx = Math.floor(fnv1a(w) * dimensions);
    vec[idx] += 1 + (words.length - wi) / words.length; // TF-weighted

    if (wi < words.length - 1) {
      const bigram = `${w}_${words[wi + 1]}`;
      const bidx = Math.floor(fnv1a(bigram) * dimensions);
      vec[bidx] += 0.5;
    }
  }

  // Character-level trigrams for short texts
  const chars = text.toLowerCase().replace(/\s+/g, " ");
  for (let i = 0; i < chars.length - 2; i++) {
    const tri = chars.slice(i, i + 3);
    const tidx = Math.floor(fnv1a(tri) * dimensions);
    vec[tidx] += 0.1;
  }

  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

export const embeddingsExecutor: NodeExecutor<EmbeddingsData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Embeddings: Variable name required");
  }
  if (!data.text) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Embeddings: Text required");
  }

  const text = decode(Handlebars.compile(data.text)(context));
  const model = data.model || "local/fnv-hash-384";

  try {
    const result = await step.run("embeddings-run", async () => {
      const embedding = localEmbed(text);
      return {
        ...context,
        [data.variableName!]: {
          embedding,
          dimensions: embedding.length,
          text,
          model,
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
