"use client";

import { formatDistanceToNow } from "date-fns";
import { useAtomValue } from "jotai";
import { HistoryIcon, RefreshCwIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  useRestoreWorkflowVersion,
  useSuspenseWorkflow,
  useUpdateWorkflow,
  useUpdateWorkflowName,
  useWorkflowVersions,
} from "@/features/workflows/hooks/use-workflows";
import { editorAtom } from "../store/atoms";

export const EditorSaveButton = ({ workflowId }: { workflowId: string }) => {
  const editor = useAtomValue(editorAtom);
  const saveWorkflow = useUpdateWorkflow();

  const handleSave = () => {
    if (!editor) {
      return;
    }

    const nodes = editor.getNodes();
    const edges = editor.getEdges();

    saveWorkflow.mutate({
      id: workflowId,
      nodes,
      edges,
    });
  };

  return (
    <div className="ml-auto">
      <Button size="sm" onClick={handleSave} disabled={saveWorkflow.isPending}>
        <SaveIcon className="size-4" />
        Save
      </Button>
    </div>
  );
};

export const EditorNameInput = ({ workflowId }: { workflowId: string }) => {
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflowName();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workflow.name);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workflow.name) {
      setName(workflow.name);
    }
  }, [workflow.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (name === workflow.name) {
      setIsEditing(false);
      return;
    }

    try {
      await updateWorkflow.mutateAsync({
        id: workflowId,
        name,
      });
    } catch {
      setName(workflow.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(workflow.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        disabled={updateWorkflow.isPending}
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 w-auto min-w-[100px] px-2"
      />
    );
  }

  return (
    <BreadcrumbItem
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:text-foreground transition-colors"
    >
      {workflow.name}
    </BreadcrumbItem>
  );
};

export const EditorBreadcrumbs = ({ workflowId }: { workflowId: string }) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link prefetch href="/workflows">
              Workflows
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <EditorNameInput workflowId={workflowId} />
      </BreadcrumbList>
    </Breadcrumb>
  );
};

type VersionNode = { id: string; type?: string; data?: unknown };
type VersionConnection = {
  fromNodeId: string;
  toNodeId: string;
  fromOutput?: string;
  toInput?: string;
};

function diffVersionAgainstCurrent(
  versionNodes: VersionNode[],
  versionConnections: VersionConnection[],
  currentNodes: VersionNode[],
  currentConnections: VersionConnection[],
) {
  const versionNodeIds = new Set(versionNodes.map((n) => n.id));
  const currentNodeIds = new Set(currentNodes.map((n) => n.id));
  const currentNodeById = new Map(currentNodes.map((n) => [n.id, n]));

  const added = versionNodes.filter((n) => !currentNodeIds.has(n.id)).length;
  const removed = currentNodes.filter((n) => !versionNodeIds.has(n.id)).length;
  const modified = versionNodes.filter((n) => {
    const current = currentNodeById.get(n.id);
    return current && JSON.stringify(current.data) !== JSON.stringify(n.data);
  }).length;

  const connKey = (c: VersionConnection) =>
    `${c.fromNodeId}->${c.toNodeId}:${c.fromOutput ?? "main"}:${c.toInput ?? "main"}`;
  const versionConnKeys = new Set(versionConnections.map(connKey));
  const currentConnKeys = new Set(currentConnections.map(connKey));
  const connectionsAdded = versionConnections.filter(
    (c) => !currentConnKeys.has(connKey(c)),
  ).length;
  const connectionsRemoved = currentConnections.filter(
    (c) => !versionConnKeys.has(connKey(c)),
  ).length;

  return { added, removed, modified, connectionsAdded, connectionsRemoved };
}

const VersionDiffSummary = ({
  version,
  currentNodes,
  currentConnections,
}: {
  version: { nodes: unknown; connections: unknown };
  currentNodes: VersionNode[];
  currentConnections: VersionConnection[];
}) => {
  const versionNodes = (
    Array.isArray(version.nodes) ? version.nodes : []
  ) as VersionNode[];
  const versionConnections = (
    Array.isArray(version.connections) ? version.connections : []
  ) as VersionConnection[];
  const diff = diffVersionAgainstCurrent(
    versionNodes,
    versionConnections,
    currentNodes,
    currentConnections,
  );

  const parts: string[] = [];
  if (diff.added)
    parts.push(`+${diff.added} node${diff.added === 1 ? "" : "s"}`);
  if (diff.removed)
    parts.push(`-${diff.removed} node${diff.removed === 1 ? "" : "s"}`);
  if (diff.modified) parts.push(`${diff.modified} changed`);
  if (diff.connectionsAdded)
    parts.push(
      `+${diff.connectionsAdded} connection${diff.connectionsAdded === 1 ? "" : "s"}`,
    );
  if (diff.connectionsRemoved)
    parts.push(
      `-${diff.connectionsRemoved} connection${diff.connectionsRemoved === 1 ? "" : "s"}`,
    );

  return (
    <p className="text-xs text-muted-foreground">
      {parts.length > 0
        ? `vs current: ${parts.join(", ")}`
        : "Identical to current"}
    </p>
  );
};

export const WorkflowVersionHistory = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const [open, setOpen] = useState(false);
  const { data: versions, isLoading } = useWorkflowVersions(workflowId);
  const { data: workflow } = useSuspenseWorkflow(workflowId);
  const restoreVersion = useRestoreWorkflowVersion();

  const currentNodes: VersionNode[] = workflow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    data: n.data,
  }));
  const currentConnections: VersionConnection[] = workflow.edges.map((e) => ({
    fromNodeId: e.source,
    toNodeId: e.target,
    fromOutput: e.sourceHandle ?? "main",
    toInput: e.targetHandle ?? "main",
  }));

  const handleRestore = async (versionId: string) => {
    await restoreVersion.mutateAsync({ workflowId, versionId });
    setOpen(false);
    // Editor state is initialized once from the suspense query at mount,
    // so a full reload is the simplest way to reflect the restored graph.
    window.location.reload();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline">
          <HistoryIcon className="size-4" />
          History
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Every save keeps a snapshot. Compare against the current graph and
            restore an older version if something went wrong.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 overflow-y-auto px-4 pb-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading versions...</p>
          )}
          {!isLoading && versions?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No previous versions yet. Versions are created automatically each
              time you save.
            </p>
          )}
          {versions?.map((version) => {
            const nodeCount = Array.isArray(version.nodes)
              ? version.nodes.length
              : 0;
            return (
              <div
                key={version.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {formatDistanceToNow(version.createdAt, {
                      addSuffix: true,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {nodeCount} node{nodeCount === 1 ? "" : "s"}
                  </p>
                  <VersionDiffSummary
                    version={version}
                    currentNodes={currentNodes}
                    currentConnections={currentConnections}
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={restoreVersion.isPending}
                  onClick={() => handleRestore(version.id)}
                >
                  Restore
                </Button>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export const EditorHeader = ({
  workflowId,
  onReset,
}: {
  workflowId: string;
  onReset?: () => void;
}) => {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/60 px-4 liquid-glass">
      <SidebarTrigger />
      <div className="flex flex-row items-center justify-between gap-x-4 w-full">
        <EditorBreadcrumbs workflowId={workflowId} />
        <div className="ml-auto flex items-center gap-2">
          <WorkflowVersionHistory workflowId={workflowId} />
          {onReset && (
            <Button size="sm" variant="outline" onClick={onReset}>
              <RefreshCwIcon className="size-4" />
              Reset
            </Button>
          )}
          <EditorSaveButton workflowId={workflowId} />
        </div>
      </div>
    </header>
  );
};
