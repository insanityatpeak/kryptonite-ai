import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";
import { atom } from "jotai";

export const editorAtom = atom<ReactFlowInstance | null>(null);

// Exposes the actual React state setters so AI assistant can inject nodes/edges
export type EditorSetters = {
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
};

export const editorSettersAtom = atom<EditorSetters | null>(null);

// Lets node components (which don't receive workflowId as a prop) know which
// workflow they belong to, e.g. to call the per-node "execute step" endpoint.
export const workflowIdAtom = atom<string | null>(null);
