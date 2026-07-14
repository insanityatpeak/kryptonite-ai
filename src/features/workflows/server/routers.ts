import { createId } from "@paralleldrive/cuid2";
import type { Edge, Node } from "@xyflow/react";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { ExecutionStatus, NodeType } from "@/generated/prisma";
import prisma from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

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

function hasRunnableWorkflow(nodes: { type: NodeType }[]) {
  return nodes.some((node) => node.type !== NodeType.INITIAL);
}

const TRIGGER_TYPES: NodeType[] = [
  NodeType.MANUAL_TRIGGER,
  NodeType.WEBHOOK_TRIGGER,
  NodeType.SCHEDULE_TRIGGER,
  NodeType.INITIAL,
];

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id },
        include: {
          nodes: { select: { type: true } },
          connections: { select: { id: true } },
        },
      });

      if (!hasRunnableWorkflow(workflow.nodes)) {
        throw new Error(
          "Add at least one real node before executing this workflow.",
        );
      }

      if (!workflow.nodes.some((n) => TRIGGER_TYPES.includes(n.type))) {
        throw new Error(
          "Add a Manual Trigger node before executing this workflow.",
        );
      }

      if (workflow.nodes.length >= 2 && workflow.connections.length === 0) {
        throw new Error(
          "Connect your Manual Trigger to the rest of your nodes before executing this workflow.",
        );
      }

      const executionId = createId();
      const execution = await prisma.execution.create({
        data: {
          workflowId: input.id,
          inngestEventId: executionId,
          status: ExecutionStatus.RUNNING,
        },
      });

      // Fire-and-forget via direct runner (VPS or self-hosted /api/run-workflow)
      const runUrl = getRunnerUrl();
      await fetch(runUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({
          workflowId: input.id,
          executionId: execution.id,
        }),
      }).catch(() => {});

      return { ...workflow, executionId: execution.id };
    }),

  create: protectedProcedure.mutation(({ ctx }) => {
    return prisma.workflow.create({
      data: {
        name: generateSlug(3),
        userId: ctx.auth.user.id,
        nodes: {
          create: {
            type: NodeType.INITIAL,
            position: { x: 0, y: 0 },
            name: NodeType.INITIAL,
          },
        },
      },
    });
  }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const source = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id, deletedAt: null },
        include: { nodes: true, connections: true },
      });

      const idMap = new Map(source.nodes.map((node) => [node.id, createId()]));

      return prisma.workflow.create({
        data: {
          name: `${source.name} (copy)`,
          userId: ctx.auth.user.id,
          nodes: {
            create: source.nodes.map((node) => ({
              id: idMap.get(node.id),
              type: node.type,
              name: node.name,
              position: node.position as object,
              data: node.data as object,
            })),
          },
          connections: {
            create: source.connections.map((conn) => ({
              fromNodeId: idMap.get(conn.fromNodeId)!,
              toNodeId: idMap.get(conn.toNodeId)!,
              fromOutput: conn.fromOutput,
              toInput: conn.toInput,
            })),
          },
        },
      });
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      // Soft delete — moves the workflow to trash instead of destroying it,
      // so accidental deletes are recoverable.
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { deletedAt: null },
      });
    }),

  permanentlyDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.delete({
        where: {
          id: input.id,
          userId: ctx.auth.user.id,
          deletedAt: { not: null },
        },
      });
    }),

  listTrash: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: { userId: ctx.auth.user.id, deletedAt: { not: null } },
          orderBy: { deletedAt: "desc" },
        }),
        prisma.workflow.count({
          where: { userId: ctx.auth.user.id, deletedAt: { not: null } },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;

      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      return await prisma.$transaction(async (tx) => {
        // Snapshot the current state as a version before overwriting it,
        // so previous saves stay recoverable.
        if (workflow.nodes.length > 0) {
          await tx.workflowVersion.create({
            data: {
              workflowId: id,
              nodes: workflow.nodes,
              connections: workflow.connections,
            },
          });

          const staleVersions = await tx.workflowVersion.findMany({
            where: { workflowId: id },
            orderBy: { createdAt: "desc" },
            skip: 20,
            select: { id: true },
          });
          if (staleVersions.length > 0) {
            await tx.workflowVersion.deleteMany({
              where: { id: { in: staleVersions.map((v) => v.id) } },
            });
          }
        }

        await tx.node.deleteMany({ where: { workflowId: id } });

        await tx.node.createMany({
          data: nodes.map((node) => ({
            id: node.id,
            workflowId: id,
            name: node.type || "unknown",
            type: node.type as NodeType,
            position: node.position,
            data: node.data || {},
          })),
        });

        await tx.connection.createMany({
          data: edges.map((edge) => ({
            workflowId: id,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            fromOutput: edge.sourceHandle || "main",
            toInput: edge.targetHandle || "main",
          })),
        });

        await tx.workflow.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        return workflow;
      });
    }),

  listVersions: protectedProcedure
    .input(z.object({ workflowId: z.string() }))
    .query(async ({ ctx, input }) => {
      await prisma.workflow.findUniqueOrThrow({
        where: { id: input.workflowId, userId: ctx.auth.user.id },
      });

      return prisma.workflowVersion.findMany({
        where: { workflowId: input.workflowId },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, nodes: true, connections: true },
      });
    }),

  restoreVersion: protectedProcedure
    .input(z.object({ workflowId: z.string(), versionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.workflowId, userId: ctx.auth.user.id },
        include: { nodes: true, connections: true },
      });

      const version = await prisma.workflowVersion.findUniqueOrThrow({
        where: { id: input.versionId, workflowId: input.workflowId },
      });

      const versionNodes = version.nodes as unknown as Array<{
        id: string;
        type: NodeType;
        position: unknown;
        data: unknown;
      }>;
      const versionConnections = version.connections as unknown as Array<{
        fromNodeId: string;
        toNodeId: string;
        fromOutput: string;
        toInput: string;
      }>;

      return prisma.$transaction(async (tx) => {
        // Snapshot current state first so restoring is itself reversible.
        await tx.workflowVersion.create({
          data: {
            workflowId: input.workflowId,
            nodes: workflow.nodes,
            connections: workflow.connections,
          },
        });

        await tx.node.deleteMany({ where: { workflowId: input.workflowId } });

        await tx.node.createMany({
          data: versionNodes.map((node) => ({
            id: node.id,
            workflowId: input.workflowId,
            name: node.type || "unknown",
            type: node.type,
            position: node.position as object,
            data: (node.data as object) || {},
          })),
        });

        await tx.connection.createMany({
          data: versionConnections.map((conn) => ({
            workflowId: input.workflowId,
            fromNodeId: conn.fromNodeId,
            toNodeId: conn.toNodeId,
            fromOutput: conn.fromOutput,
            toInput: conn.toInput,
          })),
        });

        await tx.workflow.update({
          where: { id: input.workflowId },
          data: { updatedAt: new Date() },
        });

        return { id: input.workflowId };
      });
    }),

  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return prisma.workflow.update({
        where: { id: input.id, userId: ctx.auth.user.id },
        data: { name: input.name },
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: input.id, userId: ctx.auth.user.id, deletedAt: null },
        include: { nodes: true, connections: true },
      });

      const nodes: Node[] = workflow.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      const edges: Edge[] = workflow.connections.map((connection) => ({
        id: connection.id,
        source: connection.fromNodeId,
        target: connection.toNodeId,
        sourceHandle: connection.fromOutput,
        targetHandle: connection.toInput,
      }));

      return { id: workflow.id, name: workflow.name, nodes, edges };
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;

      const [items, totalCount] = await Promise.all([
        prisma.workflow.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          where: {
            userId: ctx.auth.user.id,
            deletedAt: null,
            name: { contains: search, mode: "insensitive" },
          },
          orderBy: { updatedAt: "desc" },
        }),
        prisma.workflow.count({
          where: {
            userId: ctx.auth.user.id,
            deletedAt: null,
            name: { contains: search, mode: "insensitive" },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    }),
});
