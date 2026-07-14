"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { NOTION_CHANNEL_NAME } from "@/inngest/channels/notion";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchNotionToken } from "./actions";
import { NotionDialog, type NotionFormValues } from "./dialog";

type NotionNodeData = Record<string, string | number | undefined>;
type NotionNodeType = Node<NotionNodeData>;

export const NotionNode = memo((props: NodeProps<NotionNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: NOTION_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchNotionToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: NotionFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const fieldVal = nodeData?.["title"];
  const description = fieldVal
    ? `Create: ${String(fieldVal).slice(0, 50)}`
    : "Not configured";

  return (
    <>
      <NotionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData as Partial<NotionFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/notion.svg"
        name="Notion"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

NotionNode.displayName = "NotionNode";
