"use client";

import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { SMS_CHANNEL_NAME } from "@/inngest/channels/sms";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchSmsToken } from "./actions";
import { SmsDialog, type SmsFormValues } from "./dialog";

type SmsNodeData = Record<string, string | number | undefined>;
type SmsNodeType = Node<SmsNodeData>;

export const SmsNode = memo((props: NodeProps<SmsNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(
    () => Object.keys(props.data || {}).length === 0,
  );
  const { setNodes } = useReactFlow();

  const nodeStatus = useNodeStatus({
    nodeId: props.id,
    channel: SMS_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchSmsToken,
  });

  const handleOpenSettings = () => setDialogOpen(true);

  const handleSubmit = (values: SmsFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id)
          return { ...node, data: { ...node.data, ...values } };
        return node;
      }),
    );
  };

  const nodeData = props.data;
  const fieldVal = nodeData?.["to"];
  const description = fieldVal
    ? `SMS to: ${String(fieldVal).slice(0, 50)}`
    : "Not configured";

  return (
    <>
      <SmsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData as Partial<SmsFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/sms.svg"
        name="SMS"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

SmsNode.displayName = "SmsNode";
