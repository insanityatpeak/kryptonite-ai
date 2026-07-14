"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "../universal/actions";
import { AiChainDialog, type AiChainFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;
export const AiChainNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: AiChainFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );
  const desc = props.data.prompt
    ? String(props.data.prompt).slice(0, 50)
    : "Not configured";
  return (
    <>
      <AiChainDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<AiChainFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="⛓️"
        name="LLM Chain"
        status={status}
        description={desc}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
AiChainNode.displayName = "AiChainNode";
