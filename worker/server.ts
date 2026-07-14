/**
 * Kryptonite Workflow Worker
 * Standalone HTTP server deployed on VPS — no timeouts, runs workflows to completion.
 * Vercel calls POST /api/run-workflow and returns immediately; this server handles execution.
 */

import "dotenv/config";
import { createServer } from "http";

const PORT = process.env.WORKER_PORT || 3001;
const SECRET = process.env.INTERNAL_API_SECRET;

async function handleRequest(
  req: {
    method: string;
    url: string;
    headers: Record<string, string | string[] | undefined>;
  },
  body: string,
): Promise<{ status: number; json: unknown }> {
  // Health check
  if (req.method === "GET" && req.url === "/health") {
    return { status: 200, json: { ok: true, service: "kryptonite-worker" } };
  }

  // Workflow runner endpoint
  if (req.method === "POST" && req.url === "/api/run-workflow") {
    // Auth check
    if (SECRET) {
      const auth = Array.isArray(req.headers["x-internal-secret"])
        ? req.headers["x-internal-secret"][0]
        : req.headers["x-internal-secret"];
      if (auth !== SECRET) {
        return { status: 401, json: { error: "Unauthorized" } };
      }
    }

    let payload: {
      workflowId?: string;
      executionId?: string;
      initialData?: Record<string, unknown>;
    };
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return { status: 400, json: { error: "Invalid JSON" } };
    }

    const { workflowId, executionId, initialData } = payload;
    if (!workflowId || !executionId) {
      return {
        status: 400,
        json: { error: "Missing workflowId or executionId" },
      };
    }

    // Dynamically import — handle both ESM named export and CJS default interop
    const mod = await import("../src/lib/run-workflow");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const runWorkflow: typeof import("../src/lib/run-workflow").runWorkflow =
      mod.runWorkflow ??
      (mod as any).default?.runWorkflow ??
      (mod as any).default;

    // Acknowledge immediately, run workflow async (no timeout on VPS)
    setImmediate(() => {
      runWorkflow({ workflowId, executionId, initialData }).catch((err) => {
        console.error(
          `[worker] runWorkflow failed for execution ${executionId}:`,
          err,
        );
      });
    });

    return { status: 200, json: { ok: true, executionId } };
  }

  return { status: 404, json: { error: "Not found" } };
}

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", async () => {
    try {
      const { status, json } = await handleRequest(
        req as Parameters<typeof handleRequest>[0],
        body,
      );
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(json));
    } catch (err) {
      console.error("[worker] unhandled error:", err);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`[worker] Kryptonite workflow worker running on port ${PORT}`);
  console.log(
    `[worker] Auth: ${SECRET ? "enabled" : "DISABLED (set INTERNAL_API_SECRET)"}`,
  );
});
