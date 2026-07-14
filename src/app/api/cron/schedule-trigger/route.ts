import { createId } from "@paralleldrive/cuid2";
import { CronExpressionParser } from "cron-parser";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import prisma from "@/lib/db";

export const maxDuration = 60;

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

type ScheduleNodeData = {
  variableName?: string;
  cron?: string;
  timezone?: string;
  lastScheduledRun?: string;
  lastNotifiedAt?: string;
};

// Don't email more than once per workflow per window, no matter how often
// the schedule actually fires — daily/weekly schedules always notify since
// they're never within the window of their own last run.
const NOTIFY_THROTTLE_MS = 10 * 60 * 1000;

// Vercel Cron hits this once a minute. For every Schedule Trigger node, we
// check whether the cron expression's most recent scheduled fire time falls
// inside the window since we last checked — if so, run that workflow.
// lastScheduledRun is stamped onto the node's own data so a node never fires
// twice for the same scheduled tick even if this route gets invoked more
// than once in a given minute.
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const nodes = await prisma.node.findMany({
    where: { type: NodeType.SCHEDULE_TRIGGER, workflow: { deletedAt: null } },
    select: { id: true, workflowId: true, data: true },
  });

  const now = new Date();
  const triggered: string[] = [];

  for (const node of nodes) {
    const data = (node.data as ScheduleNodeData) ?? {};
    const cron = data.cron;
    if (!cron) continue;

    let prevFire: Date;
    try {
      prevFire = CronExpressionParser.parse(cron, {
        currentDate: now,
        tz: data.timezone || "UTC",
      })
        .prev()
        .toDate();
    } catch {
      continue; // invalid cron expression on this node — skip it
    }

    const lastRun = data.lastScheduledRun
      ? new Date(data.lastScheduledRun)
      : null;
    const dueNow = now.getTime() - prevFire.getTime() < 90_000; // within the last 90s
    const alreadyRan = lastRun && lastRun.getTime() >= prevFire.getTime();
    if (!dueNow || alreadyRan) continue;

    const lastNotified = data.lastNotifiedAt
      ? new Date(data.lastNotifiedAt)
      : null;
    const shouldNotify =
      !lastNotified ||
      now.getTime() - lastNotified.getTime() > NOTIFY_THROTTLE_MS;

    await prisma.node.update({
      where: { id: node.id },
      data: {
        data: {
          ...data,
          lastScheduledRun: prevFire.toISOString(),
          ...(shouldNotify ? { lastNotifiedAt: now.toISOString() } : {}),
        },
      },
    });

    const executionId = createId();
    const execution = await prisma.execution.create({
      data: {
        workflowId: node.workflowId,
        inngestEventId: executionId,
        status: ExecutionStatus.RUNNING,
      },
    });

    // No initialData needed — the Schedule Trigger node is a normal part of
    // the workflow graph and computes its own output when it runs.
    await fetch(getRunnerUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
      },
      body: JSON.stringify({
        workflowId: node.workflowId,
        executionId: execution.id,
        notify: shouldNotify,
      }),
    }).catch(() => {});

    triggered.push(node.workflowId);
  }

  return Response.json({ ok: true, triggered: triggered.length });
}
