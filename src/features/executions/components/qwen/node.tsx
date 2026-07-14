"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { QWEN_CHANNEL_NAME } from "@/inngest/channels/qwen";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchQwenToken } from "./actions";
import { MODEL } from "./constants";
import { QwenDialog, type QwenFormValues } from "./dialog";

type QwenNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};
type QwenNodeType = Node<QwenNodeData>;

export const QwenNode = memo((props: NodeProps<QwenNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: QWEN_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchQwenToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: QwenFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const description = nodeData?.userPrompt
    ? `${MODEL} (OpenRouter): ${nodeData.userPrompt.slice(0, 50)}...`
    : "Not configured";

  return (
    <>
      <QwenDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/qwen.svg"
        name="Qwen AI"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

QwenNode.displayName = "QwenNode";
