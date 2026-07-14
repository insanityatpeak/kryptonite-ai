"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { RSS_FEED_CHANNEL_NAME } from "@/inngest/channels/rss-feed";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchRssFeedToken } from "./actions";
import { RssFeedDialog, type RssFeedFormValues } from "./dialog";

type RssFeedNodeData = Record<string, string | number | undefined>;
type RssFeedNodeType = Node<RssFeedNodeData>;

export const RssFeedNode = memo((props: NodeProps<RssFeedNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: RSS_FEED_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchRssFeedToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: RssFeedFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const fieldVal = nodeData?.["url"];
  const description = fieldVal
    ? `Fetch: ${String(fieldVal).slice(0, 50)}`
    : "Not configured";

  return (
    <>
      <RssFeedDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData as Partial<RssFeedFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/rss.svg"
        name="RSS Feed"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

RssFeedNode.displayName = "RssFeedNode";
