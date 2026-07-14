"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MiniMap,
  type Node,
  type NodeChange,
  Panel,
  ReactFlow,
} from "@xyflow/react";
import { RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ErrorView, LoadingView } from "@/components/entity-components";
import { Button } from "@/components/ui/button";
import {
  useSuspenseWorkflow,
  useUpdateWorkflow,
} from "@/features/workflows/hooks/use-workflows";

import "@xyflow/react/dist/style.css";
import { useSetAtom } from "jotai";
import { nodeComponents } from "@/config/node-components";
import { NodeType } from "@/generated/prisma";
import { editorAtom, editorSettersAtom, workflowIdAtom } from "../store/atoms";
import { AddNodeButton } from "./add-node-button";
import { ExecuteWorkflowButton } from "./execute-workflow-button";

export const EditorLoading = () => {
  return <LoadingView message="Loading editor..." />;
};

export const EditorError = () => {
  return <ErrorView message="Error loading editor" />;
};

export const Editor = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow, refetch: refetchWorkflow } =
    useSuspenseWorkflow(workflowId);

  const setEditor = useSetAtom(editorAtom);
  const setEditorSetters = useSetAtom(editorSettersAtom);
  const setWorkflowId = useSetAtom(workflowIdAtom);
  const saveWorkflow = useUpdateWorkflow();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const [nodes, setNodes] = useState<Node[]>(workflow.nodes);
  const [edges, setEdges] = useState<Edge[]>(workflow.edges);

  // Expose state setters so Kryptonite AI can inject nodes/edges from outside
  useEffect(() => {
    setEditorSetters({ setNodes, setEdges });
    return () => setEditorSetters(null);
  }, [setEditorSetters, setNodes, setEdges]);

  useEffect(() => {
    setWorkflowId(workflowId);
    return () => setWorkflowId(null);
  }, [setWorkflowId, workflowId]);

  // Surface the result of the Google OAuth redirect (see /api/integrations/google/callback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("google_error");
    const connected = params.get("google_connected");
    if (!error && !connected) return;

    if (error) toast.error(`Failed to connect Google account: ${error}`);
    if (connected) toast.success("Google account connected");

    params.delete("google_error");
    params.delete("google_connected");
    const newSearch = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (newSearch ? `?${newSearch}` : ""),
    );
  }, []);

  const triggerAutoSave = useCallback(
    (currentNodes: Node[], currentEdges: Edge[]) => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveWorkflow.mutate({
          id: workflowId,
          nodes: currentNodes,
          edges: currentEdges,
        });
      }, 1500);
    },
    [workflowId, saveWorkflow],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    triggerAutoSave(nodes, edges);
  }, [nodes, edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl/Cmd+S forces an immediate save; Ctrl/Cmd+Z undoes the last deletion;
  // Ctrl/Cmd+D duplicates the selected nodes.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        saveWorkflow.mutate({ id: workflowId, nodes, edges });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        const selected = nodes.filter((n) => n.selected);
        if (selected.length === 0) return;
        e.preventDefault();
        const copies = selected.map((n) => ({
          ...n,
          id: crypto.randomUUID(),
          position: { x: n.position.x + 40, y: n.position.y + 40 },
          selected: true,
        }));
        setNodes((snap) => [
          ...snap.map((n) => ({ ...n, selected: false })),
          ...copies,
        ]);
        toast.success(
          `Duplicated ${copies.length} node${copies.length > 1 ? "s" : ""}`,
        );
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        const prev = historyRef.current.pop();
        if (prev) {
          e.preventDefault();
          setNodes(prev.nodes);
          setEdges(prev.edges);
          toast.success("Undo: restored deleted nodes/edges");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, workflowId, saveWorkflow]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    const hasRemove = changes.some((c) => c.type === "remove");
    if (hasRemove) {
      setNodes((snap) => {
        setEdges((eSnap) => {
          historyRef.current = [
            ...historyRef.current.slice(-30),
            { nodes: snap, edges: eSnap },
          ];
          return eSnap;
        });
        return applyNodeChanges(changes, snap);
      });
    } else {
      setNodes((snap) => applyNodeChanges(changes, snap));
    }
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    const hasRemove = changes.some((c) => c.type === "remove");
    if (hasRemove) {
      setEdges((snap) => {
        setNodes((nSnap) => {
          historyRef.current = [
            ...historyRef.current.slice(-30),
            { nodes: nSnap, edges: snap },
          ];
          return nSnap;
        });
        return applyEdgeChanges(changes, snap);
      });
    } else {
      setEdges((snap) => applyEdgeChanges(changes, snap));
    }
  }, []);
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );

  const handleReset = useCallback(async () => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    // Pull the canonical saved state from the server rather than trusting a
    // mount-time snapshot, which can silently drift once autosave invalidates
    // and refetches this query in the background.
    const { data } = await refetchWorkflow();
    if (!data) {
      toast.error("Couldn't reset workflow");
      return;
    }
    setNodes(data.nodes);
    setEdges(data.edges);
    toast.success("Workflow reset to last saved state");
  }, [refetchWorkflow]);

  const hasManualTrigger = useMemo(() => {
    return nodes.some(
      (node) =>
        node.type === NodeType.MANUAL_TRIGGER || node.type === NodeType.INITIAL,
    );
  }, [nodes]);

  return (
    <div className="size-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeComponents}
        onInit={setEditor}
        fitView
        snapGrid={[10, 10]}
        snapToGrid
        panOnScroll
        panOnDrag={false}
        selectionOnDrag
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <Controls />
        {/* Lifted clear of the AI Assistant FAB, which floats bottom-right across the dashboard */}
        <MiniMap style={{ bottom: 90 }} />
        <Panel position="top-right">
          <AddNodeButton />
        </Panel>
        <Panel position="top-left">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="gap-2 border-white/70 bg-white/90 shadow-sm backdrop-blur-md"
          >
            <RotateCcwIcon className="size-4" />
            Reset workflow
          </Button>
        </Panel>
        {hasManualTrigger && (
          <Panel position="bottom-center">
            <ExecuteWorkflowButton workflowId={workflowId} />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
