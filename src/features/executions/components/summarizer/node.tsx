"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "../universal/actions";
import { SummarizerDialog, type SummarizerFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;
export const SummarizerNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: SummarizerFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );
  return (
    <>
      <SummarizerDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<SummarizerFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="📝"
        name="Summarizer"
        status={status}
        description={
          props.data.style ? `${props.data.style} summary` : "Not configured"
        }
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
SummarizerNode.displayName = "SummarizerNode";
