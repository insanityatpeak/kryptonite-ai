"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "../universal/actions";
import { AiMemoryDialog, type AiMemoryFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;
export const AiMemoryNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: AiMemoryFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );
  return (
    <>
      <AiMemoryDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<AiMemoryFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="🧠"
        name="Memory"
        status={status}
        description={`${props.data.operation || "get"} · ${props.data.key || "key"}`}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
AiMemoryNode.displayName = "AiMemoryNode";
