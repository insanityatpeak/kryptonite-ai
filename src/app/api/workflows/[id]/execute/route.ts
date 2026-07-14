import { createId } from "@paralleldrive/cuid2";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export const maxDuration = 15;

function getRunnerUrl() {
  // VPS worker takes priority — no timeout constraints
  if (process.env.WORKER_URL)
    return `${process.env.WORKER_URL}/api/run-workflow`;
  // Fallback: self-call via the dedicated /api/run-workflow route
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  return `${appUrl}/api/run-workflow`;
}

function hasRunnableWorkflow(nodes: { type: string }[]) {
  return nodes.some((node) => node.type !== "INITIAL");
}

const TRIGGER_TYPES: string[] = [
  NodeType.MANUAL_TRIGGER,
  NodeType.WEBHOOK_TRIGGER,
  NodeType.SCHEDULE_TRIGGER,
  NodeType.INITIAL,
];

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuth();
  const { id: workflowId } = await params;

  const workflow = await prisma.workflow.findUniqueOrThrow({
    where: { id: workflowId, userId: session.user.id },
    select: {
      name: true,
      nodes: { select: { type: true } },
      connections: { select: { id: true } },
    },
  });

  if (!hasRunnableWorkflow(workflow.nodes)) {
    return Response.json(
      { error: "Add at least one real node before executing this workflow." },
      { status: 400 },
    );
  }

  if (!workflow.nodes.some((n) => TRIGGER_TYPES.includes(n.type))) {
    return Response.json(
      { error: "Add a Manual Trigger node before executing this workflow." },
      { status: 400 },
    );
  }

  if (workflow.nodes.length >= 2 && workflow.connections.length === 0) {
    return Response.json(
      {
        error:
          "Connect your Manual Trigger to the rest of your nodes before executing this workflow.",
      },
      { status: 400 },
    );
  }

  // Pre-create execution record so the frontend can navigate immediately
  const executionId = createId();
  const execution = await prisma.execution.create({
    data: {
      workflowId,
      inngestEventId: executionId,
      status: ExecutionStatus.RUNNING,
    },
  });

  // Fire-and-forget: invoke the dedicated run-workflow function as a separate
  // Vercel invocation so it gets its own timeout budget (up to maxDuration=300).
  const runUrl = getRunnerUrl();
  await fetch(runUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({ workflowId, executionId: execution.id }),
  }).catch(() => {});

  return Response.json({
    executionId: execution.id,
    workflowName: workflow.name,
  });
}
