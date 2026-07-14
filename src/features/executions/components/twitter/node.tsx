"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { TWITTER_CHANNEL_NAME } from "@/inngest/channels/twitter";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchTwitterToken } from "./actions";
import { TwitterDialog, type TwitterFormValues } from "./dialog";

type TwitterNodeData = Record<string, string | undefined>;
type TwitterNodeType = Node<TwitterNodeData>;

export const TwitterNode = memo((props: NodeProps<TwitterNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(
    () => Object.keys(props.data || {}).length === 0,
  );
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: TWITTER_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchTwitterToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: TwitterFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const description = nodeData?.text
    ? `Tweet: ${nodeData.text.slice(0, 50)}...`
    : "Not configured";

  return (
    <>
      <TwitterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/twitter.svg"
        name="Twitter"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

TwitterNode.displayName = "TwitterNode";
