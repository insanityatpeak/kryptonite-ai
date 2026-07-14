"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "../universal/actions";
import {
  AutonomousSearchAgentDialog,
  type AutonomousSearchAgentFormValues,
} from "./dialog";

type T = Node<Record<string, unknown>>;

export const AutonomousSearchAgentNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: AutonomousSearchAgentFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );

  const integrations = (props.data.integrations as string[] | undefined) ?? [];
  const prompt = props.data.prompt as string | undefined;
  const description = prompt
    ? `${prompt.slice(0, 46)}${prompt.length > 46 ? "…" : ""}${integrations.length ? ` · ${integrations.length} app${integrations.length === 1 ? "" : "s"}` : ""}`
    : "Not configured — click to set up";

  return (
    <>
      <AutonomousSearchAgentDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<AutonomousSearchAgentFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="🛰️"
        name="Autonomous Search Agent"
        status={status}
        description={description}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});

AutonomousSearchAgentNode.displayName = "AutonomousSearchAgentNode";
