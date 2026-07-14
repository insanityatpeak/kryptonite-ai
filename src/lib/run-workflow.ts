/**
 * Core workflow runner — called directly by the execute route using Next.js after().
 * Also used by the Inngest function for cloud/background execution.
 */

import { getExecutor } from "@/features/executions/lib/executor-registry";
import type { StepTools } from "@/features/executions/types";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import { computeParallelLevels, topologicalSort } from "@/inngest/utils";
import { createBandRoom } from "@/lib/band";
import prisma from "@/lib/db";
import { sendWorkflowEmail } from "@/lib/notify";

type ExecutionStep = {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: "success" | "error";
  output?: unknown;
  error?: string;
  completedAt: string;
};

const AI_NODE_TYPES: NodeType[] = [
  NodeType.OPENAI,
  NodeType.ANTHROPIC,
  NodeType.GEMINI,
  NodeType.MISTRAL,
  NodeType.QWEN,
  NodeType.AI_AGENT,
  NodeType.AI_CHAIN,
  NodeType.SUMMARIZER,
  NodeType.TEXT_CLASSIFIER,
  NodeType.INFO_EXTRACTOR,
];

export async function runWorkflow({
  workflowId,
  executionId,
  initialData = {},
  notify = true,
}: {
  workflowId: string;
  executionId: string;
  initialData?: Record<string, unknown>;
  // Scheduled/cron-triggered runs default this to false — a workflow firing
  // every minute would otherwise send a "started" + "success" email per run
  // and blow through the email provider's daily quota within hours.
  notify?: boolean;
}) {
  try {
    const [workflow, user] = await Promise.all([
      prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
          user: { select: { id: true, email: true } },
        },
      }),
    ]).then(([w]) => [w, w.user] as const);

    const userEmail = user?.email ?? null;
    const userId = workflow.userId;
    const workflowName = workflow.name;

    const sortedNodes = topologicalSort(workflow.nodes, workflow.connections);
    const parallelLevels = computeParallelLevels(
      workflow.nodes,
      workflow.connections,
    );

    // Send started email
    if (notify && userEmail) {
      void sendWorkflowEmail({
        to: userEmail,
        workflowName,
        executionId,
        status: "started",
      });
    }

    // Create Band room with timeout
    const hasAiAgents = sortedNodes.some((n) =>
      AI_NODE_TYPES.includes(n.type as NodeType),
    );
    let bandRoomId: string | null = null;
    if (hasAiAgents) {
      try {
        const room = await Promise.race([
          createBandRoom(`${workflowName} - ${executionId}`),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        if (room) {
          bandRoomId = room.id;
          void prisma.execution.update({
            where: { id: executionId },
            data: { bandRoomId: room.id },
          });
        }
      } catch {
        /* non-fatal */
      }
    }

    let context: Record<string, unknown> = initialData;
    const executionSteps: ExecutionStep[] = [];

    // Minimal step shim — executors call step.run(id, fn); we just invoke fn() directly.
    const stepShim = {
      run: async <T>(_id: string, fn: () => Promise<T>) => fn(),
    } as unknown as StepTools;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publishShim: any = async () => {};

    for (const level of parallelLevels) {
      const levelResults = await Promise.all(
        level.map(async (node) => {
          const executor = getExecutor(node.type as NodeType);
          const nodeData = node.data as Record<string, unknown>;
          const maxAttempts = nodeData?.retryOnFail
            ? Math.max(1, Number(nodeData?.maxRetries) || 3)
            : 1;

          let lastError: unknown;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              const result = await executor({
                data: nodeData,
                nodeId: node.id,
                userId,
                context,
                step: stepShim,
                publish: publishShim,
                bandRoomId,
              });
              const varName = nodeData?.variableName as string | undefined;
              return {
                ok: true as const,
                node,
                result: result as Record<string, unknown>,
                varName,
              };
            } catch (err) {
              lastError = err;
              if (attempt < maxAttempts) continue;
            }
          }
          return {
            ok: false as const,
            node,
            error:
              lastError instanceof Error
                ? lastError.message
                : String(lastError),
          };
        }),
      );

      for (const r of levelResults) {
        if (r.ok) {
          if (r.varName && r.result[r.varName] !== undefined) {
            context = { ...context, [r.varName]: r.result[r.varName] };
            // Always carry __memory forward so Memory Buffer nodes can SET then GET
            if (r.result.__memory !== undefined)
              context = { ...context, __memory: r.result.__memory };
          } else {
            context = { ...context, ...r.result };
          }
          executionSteps.push({
            nodeId: r.node.id,
            nodeType: r.node.type,
            nodeName: r.node.name,
            status: "success",
            output: r.varName ? context[r.varName] : undefined,
            completedAt: new Date().toISOString(),
          });
        } else {
          executionSteps.push({
            nodeId: r.node.id,
            nodeType: r.node.type,
            nodeName: r.node.name,
            status: "error",
            error: r.error,
            completedAt: new Date().toISOString(),
          });
          // Save error state then throw
          await prisma.execution.update({
            where: { id: executionId },
            data: {
              status: ExecutionStatus.FAILED,
              error: r.error,
              completedAt: new Date(),
              output: JSON.parse(
                JSON.stringify({ _steps: executionSteps, ...context }),
              ),
            },
          });
          if (notify && userEmail)
            void sendWorkflowEmail({
              to: userEmail,
              workflowName,
              executionId,
              status: "failed",
              error: r.error,
            });
          return;
        }
      }

      // Save progress after each level
      void prisma.execution.update({
        where: { id: executionId },
        data: {
          output: JSON.parse(
            JSON.stringify({ _steps: executionSteps, ...context }),
          ),
        },
      });
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.SUCCESS,
        completedAt: new Date(),
        output: JSON.parse(
          JSON.stringify({ _steps: executionSteps, ...context }),
        ),
      },
    });

    if (notify && userEmail)
      void sendWorkflowEmail({
        to: userEmail,
        workflowName,
        executionId,
        status: "success",
      });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[runWorkflow] execution ${executionId} failed:`, msg);
    await prisma.execution
      .update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FAILED,
          error: msg,
          completedAt: new Date(),
        },
      })
      .catch((e) =>
        console.error(`[runWorkflow] failed to update execution status:`, e),
      );
  }
}
