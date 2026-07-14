"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { GITHUB_CHANNEL_NAME } from "@/inngest/channels/github";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchGithubToken as fetchGitHubToken } from "./actions";
import { GitHubDialog, type GitHubFormValues } from "./dialog";

type GitHubNodeData = Record<string, string | number | undefined>;
type GitHubNodeType = Node<GitHubNodeData>;

export const GitHubNode = memo((props: NodeProps<GitHubNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: GITHUB_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchGitHubToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: GitHubFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const fieldVal = nodeData?.["repo"];
  const description = fieldVal
    ? `Issue in: ${String(fieldVal).slice(0, 50)}`
    : "Not configured";

  return (
    <>
      <GitHubDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData as Partial<GitHubFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/github.svg"
        name="GitHub"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

GitHubNode.displayName = "GitHubNode";
