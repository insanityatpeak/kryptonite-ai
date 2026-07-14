"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { MISTRAL_CHANNEL_NAME } from "@/inngest/channels/mistral";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchMistralToken } from "./actions";
import { MODEL } from "./constants";
import { MistralDialog, type MistralFormValues } from "./dialog";

type MistralNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};
type MistralNodeType = Node<MistralNodeData>;

export const MistralNode = memo((props: NodeProps<MistralNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: MISTRAL_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchMistralToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: MistralFormValues) => {
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
      <MistralDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/mistral.svg"
        name="Mistral AI"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

MistralNode.displayName = "MistralNode";
