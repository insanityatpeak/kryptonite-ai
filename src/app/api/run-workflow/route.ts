import { runWorkflow } from "@/lib/run-workflow";

// This route is called internally by the execute route.
// It runs as its own Vercel function with a dedicated timeout.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Simple shared-secret guard (set INTERNAL_API_SECRET in Vercel env)
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) {
    const authHeader = req.headers.get("x-internal-secret");
    if (authHeader !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { workflowId, executionId, initialData, notify } =
    (await req.json()) as {
      workflowId: string;
      executionId: string;
      initialData?: Record<string, unknown>;
      notify?: boolean;
    };

  if (!workflowId || !executionId) {
    return Response.json(
      { error: "Missing workflowId or executionId" },
      { status: 400 },
    );
  }

  // Run synchronously — this function has its own maxDuration budget
  await runWorkflow({ workflowId, executionId, initialData, notify });
  return Response.json({ ok: true });
}
