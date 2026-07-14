import { NonRetriableError } from "inngest";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import { createBandRoom } from "@/lib/band";
import prisma from "@/lib/db";
import { sendWorkflowEmail } from "@/lib/notify";
import { anthropicChannel } from "./channels/anthropic";
import { discordChannel } from "./channels/discord";
import { emailChannel } from "./channels/email";
import { geminiChannel } from "./channels/gemini";
import { githubChannel } from "./channels/github";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { googleSheetsChannel } from "./channels/google-sheets";
import { httpRequestChannel } from "./channels/http-request";
import { instagramChannel } from "./channels/instagram";
import { kryptoniteChannel } from "./channels/kryptonite";
import { linkedinChannel } from "./channels/linkedin";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { mistralChannel } from "./channels/mistral";
import { notionChannel } from "./channels/notion";
import { openAiChannel } from "./channels/openai";
import { qwenChannel } from "./channels/qwen";
import { rssFeedChannel } from "./channels/rss-feed";
import { slackChannel } from "./channels/slack";
import { smsChannel } from "./channels/sms";
import { stripeTriggerChannel } from "./channels/stripe-trigger";
import { telegramChannel } from "./channels/telegram";
import { twitterChannel } from "./channels/twitter";
import { whatsappChannel } from "./channels/whatsapp";
import { inngest } from "./client";
import { computeParallelLevels, topologicalSort } from "./utils";

type ExecutionStep = {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: "success" | "error";
  output?: unknown;
  error?: string;
  completedAt: string;
};

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 1,
    onFailure: async ({ event }) => {
      try {
        const execution = await prisma.execution.findFirst({
          where: { inngestEventId: event.data.event.id },
          include: { workflow: { select: { name: true, userId: true } } },
        });
        await prisma.execution.updateMany({
          where: { inngestEventId: event.data.event.id },
          data: {
            status: ExecutionStatus.FAILED,
            error: event.data.error.message,
            errorStack: event.data.error.stack,
            completedAt: new Date(),
          },
        });
        if (execution?.workflow?.userId) {
          const user = await prisma.user.findUnique({
            where: { id: execution.workflow.userId },
            select: { email: true },
          });
          if (user?.email) {
            await sendWorkflowEmail({
              to: user.email,
              workflowName: execution.workflow.name,
              executionId: execution.id,
              status: "failed",
              error: event.data.error.message,
            });
          }
        }
      } catch {
        /* execution record may not exist yet */
      }
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      stripeTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
      discordChannel(),
      slackChannel(),
      twitterChannel(),
      telegramChannel(),
      linkedinChannel(),
      instagramChannel(),
      whatsappChannel(),
      mistralChannel(),
      qwenChannel(),
      emailChannel(),
      notionChannel(),
      googleSheetsChannel(),
      githubChannel(),
      rssFeedChannel(),
      smsChannel(),
      kryptoniteChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    await step.run("ensure-execution", async () => {
      return prisma.execution.upsert({
        where: { inngestEventId },
        create: { workflowId, inngestEventId, status: ExecutionStatus.RUNNING },
        update: { status: ExecutionStatus.RUNNING },
      });
    });

    // Fetch workflow + user email in one step
    const { sortedNodes, parallelLevels, workflowInfo, userEmail } =
      await step.run("prepare-workflow", async () => {
        const [workflow, info] = await Promise.all([
          prisma.workflow.findUniqueOrThrow({
            where: { id: workflowId },
            include: { nodes: true, connections: true },
          }),
          prisma.workflow.findUniqueOrThrow({
            where: { id: workflowId },
            select: { userId: true, name: true },
          }),
        ]);
        const user = await prisma.user.findUnique({
          where: { id: info.userId },
          select: { email: true },
        });
        return {
          sortedNodes: topologicalSort(workflow.nodes, workflow.connections),
          parallelLevels: computeParallelLevels(
            workflow.nodes,
            workflow.connections,
          ),
          workflowInfo: info,
          userEmail: user?.email ?? null,
        };
      });

    const userId = workflowInfo.userId;

    // Create Band room inside step.run so it only runs once (not on every Inngest replay)
    const aiNodeTypes: NodeType[] = [
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
    const hasAiAgents = sortedNodes.some((node) =>
      aiNodeTypes.includes(node.type as NodeType),
    );

    const bandRoomId = hasAiAgents
      ? await step.run("create-band-room", async () => {
          try {
            const room = await Promise.race([
              createBandRoom(`${workflowInfo.name} - ${inngestEventId}`),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 5000),
              ),
            ]);
            if (room) {
              void prisma.execution.update({
                where: { inngestEventId },
                data: { bandRoomId: room.id },
              });
              return room.id;
            }
          } catch {
            /* Band API failure is non-fatal */
          }
          return null;
        })
      : null;

    // Fire started email (awaited so it completes before nodes run)
    if (userEmail) {
      await sendWorkflowEmail({
        to: userEmail,
        workflowName: workflowInfo.name,
        executionId: inngestEventId,
        status: "started",
      });
    }

    let context: Record<string, unknown> = event.data.initialData || {};
    const executionSteps: ExecutionStep[] = [];

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
                step,
                publish,
                bandRoomId,
              });
              const varName = nodeData?.variableName as string | undefined;
              return { ok: true as const, node, result, varName };
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
            err: lastError,
          };
        }),
      );

      for (const r of levelResults) {
        if (r.ok) {
          if (r.varName && r.result[r.varName] !== undefined) {
            context = { ...context, [r.varName]: r.result[r.varName] };
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
          throw r.err;
        }
      }

      // Save progress after each level so the live page shows nodes completing
      const snapshot = JSON.parse(
        JSON.stringify({ _steps: executionSteps, ...context }),
      );
      void prisma.execution.update({
        where: { inngestEventId },
        data: { output: snapshot },
      });
    }

    await step.run("complete-execution", async () => {
      return prisma.execution.update({
        where: { inngestEventId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: JSON.parse(
            JSON.stringify({ _steps: executionSteps, ...context }),
          ),
        },
      });
    });

    // Fire success email
    if (userEmail) {
      await sendWorkflowEmail({
        to: userEmail,
        workflowName: workflowInfo.name,
        executionId: inngestEventId,
        status: "success",
      });
    }

    return { workflowId, result: context };
  },
);
