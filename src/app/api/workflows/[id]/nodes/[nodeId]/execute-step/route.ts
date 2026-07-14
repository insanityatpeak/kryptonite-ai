import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { StepTools } from "@/features/executions/types";
import type { NodeType } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export const maxDuration = 60;

// Minimal step shim — executors call step.run(id, fn); we just invoke fn() directly.
const stepShim = {
  run: async <T>(_id: string, fn: () => Promise<T>) => fn(),
} as unknown as StepTools;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const publishShim: any = async () => {};

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> },
) {
  const session = await requireAuth();
  const { id: workflowId, nodeId } = await params;

  const node = await prisma.node.findFirst({
    where: { id: nodeId, workflowId, workflow: { userId: session.user.id } },
  });

  if (!node) {
    return Response.json({ error: "Node not found" }, { status: 404 });
  }

  try {
    const executor = getExecutor(node.type as NodeType);
    const output = await executor({
      data: node.data as Record<string, unknown>,
      nodeId: node.id,
      userId: session.user.id,
      context: {},
      step: stepShim,
      publish: publishShim,
      bandRoomId: null,
    });

    return Response.json({ ok: true, output });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
