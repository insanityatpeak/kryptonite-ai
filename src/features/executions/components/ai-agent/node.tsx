"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "../universal/actions";
import { AiAgentDialog, type AiAgentFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;
export const AiAgentNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: AiAgentFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );
  const desc = props.data.userPrompt
    ? String(props.data.userPrompt).slice(0, 50)
    : "Not configured";
  return (
    <>
      <AiAgentDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<AiAgentFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="🤖"
        name="AI Agent"
        status={status}
        description={desc}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
AiAgentNode.displayName = "AiAgentNode";
