import { ExecutionStatus } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAuth();
  const { id } = await params;

  const execution = await prisma.execution.findFirst({
    where: { id, workflow: { userId: session.user.id } },
    select: { id: true, status: true },
  });

  if (!execution) return Response.json({ error: "Not found" }, { status: 404 });
  if (execution.status !== ExecutionStatus.RUNNING) {
    return Response.json({ error: "Not running" }, { status: 400 });
  }

  await prisma.execution.update({
    where: { id },
    data: {
      status: ExecutionStatus.FAILED,
      error: "Cancelled by user",
      completedAt: new Date(),
    },
  });

  return Response.json({ ok: true });
}
