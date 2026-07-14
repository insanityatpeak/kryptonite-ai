import { createId } from "@paralleldrive/cuid2";
import toposort from "toposort";
import type { Connection, Node } from "@/generated/prisma";
import { inngest } from "./client";

export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections, return node as-is (they're all independent)
  if (connections.length === 0) {
    return nodes;
  }

  // Create edges array for toposort
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Add nodes with no connections as self-edges to ensure they're included
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort — if there's a cycle, break it by removing back-edges
  let sortedNodeIds: string[];
  try {
    sortedNodeIds = [...new Set(toposort(edges))];
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cyclic")) {
      // Remove back-edges greedily to produce a valid DAG
      const visited = new Set<string>();
      const safeEdges = edges.filter(([from, to]) => {
        if (from === to) return true;
        if (visited.has(to)) return false;
        visited.add(from);
        return true;
      });
      try {
        sortedNodeIds = [...new Set(toposort(safeEdges))];
      } catch {
        sortedNodeIds = nodes.map((n) => n.id);
      }
    } else {
      throw error;
    }
  }

  // Map sorted IDs back to node objects
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};

/**
 * Groups nodes into parallel levels. Nodes on the same level have no
 * dependency on each other and can execute simultaneously.
 */
export const computeParallelLevels = (
  nodes: Node[],
  connections: Connection[],
): Node[][] => {
  const inDegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    children.set(n.id, []);
  }
  for (const c of connections) {
    inDegree.set(c.toNodeId, (inDegree.get(c.toNodeId) ?? 0) + 1);
    children.get(c.fromNodeId)?.push(c.toNodeId);
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const levels: Node[][] = [];
  let queue = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);

  while (queue.length > 0) {
    levels.push(queue);
    const next: Node[] = [];
    for (const n of queue) {
      for (const childId of children.get(n.id) ?? []) {
        const deg = (inDegree.get(childId) ?? 1) - 1;
        inDegree.set(childId, deg);
        if (deg === 0) next.push(nodeMap.get(childId)!);
      }
    }
    queue = next.filter(Boolean);
  }

  // Any nodes not reached (cycles broken earlier) go in a final level
  const placed = new Set(levels.flat().map((n) => n.id));
  const remaining = nodes.filter((n) => !placed.has(n.id));
  if (remaining.length) levels.push(remaining);

  return levels;
};

export const sendWorkflowExecution = async (data: {
  workflowId: string;
  eventId?: string;
  initialData?: Record<string, unknown>;
  [key: string]: unknown;
}) => {
  const { eventId, ...rest } = data;
  return inngest.send({
    name: "workflows/execute.workflow",
    data: rest,
    id: eventId ?? createId(),
  });
};
