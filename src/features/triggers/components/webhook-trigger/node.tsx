"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { WebhookIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "@/features/executions/components/base-execution-node";
import { fetchKryptoniteToken } from "@/features/executions/components/universal/actions";
import { useNodeStatus } from "@/features/executions/hooks/use-node-status";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { WebhookTriggerDialog, type WebhookTriggerFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;

export const WebhookTriggerNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: WebhookTriggerFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );

  return (
    <>
      <WebhookTriggerDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<WebhookTriggerFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={WebhookIcon}
        name="Webhook Trigger"
        status={status}
        description={
          props.data.variableName
            ? `→ {{${props.data.variableName}}}`
            : "Not configured"
        }
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});

WebhookTriggerNode.displayName = "WebhookTriggerNode";
