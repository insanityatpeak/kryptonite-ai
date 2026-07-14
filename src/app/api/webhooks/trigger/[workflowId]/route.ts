import { createId } from "@paralleldrive/cuid2";
import { ExecutionStatus } from "@/generated/prisma";
import prisma from "@/lib/db";

export const maxDuration = 15;

function getRunnerUrl() {
  if (process.env.WORKER_URL)
    return `${process.env.WORKER_URL}/api/run-workflow`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${appUrl}/api/run-workflow`;
}

// POST /api/webhooks/trigger/[workflowId]
// Body: any JSON - available as {{webhookData.body}} in downstream nodes
export async function POST(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await params;

  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    select: { id: true, name: true },
  });

  if (!workflow) {
    return Response.json({ error: "Workflow not found" }, { status: 404 });
  }

  let body: unknown = null;
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  const initialData = {
    webhookData: {
      body,
      headers,
      method: req.method,
      triggeredAt: new Date().toISOString(),
    },
  };

  const eventId = createId();
  const execution = await prisma.execution.create({
    data: {
      workflowId,
      inngestEventId: eventId,
      status: ExecutionStatus.RUNNING,
    },
  });

  const runUrl = getRunnerUrl();
  // Must be awaited — on Vercel, an un-awaited fetch can be dropped when the
  // function returns, so the response would lie and say the run started.
  await fetch(runUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({
      workflowId,
      executionId: execution.id,
      initialData,
    }),
  }).catch(() => {});

  return Response.json({ ok: true, executionId: execution.id });
}
