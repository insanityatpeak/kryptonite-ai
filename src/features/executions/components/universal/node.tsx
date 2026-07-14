"use client";
import { type Node, type NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { KRYPTONITE_CHANNEL_NAME } from "@/inngest/channels/kryptonite";
import { getApp } from "@/lib/app-catalog";
import { useNodeStatus } from "../../hooks/use-node-status";
import { BaseExecutionNode } from "../base-execution-node";
import { fetchKryptoniteToken } from "./actions";
import { UniversalDialog, type UniversalFormValues } from "./dialog";

type T = Node<Record<string, string | number | undefined>>;
export const UniversalNode = memo((props: NodeProps<T>) => {
  const [open, setOpen] = useState(false);
  const { setNodes } = useReactFlow();
  const status = useNodeStatus({
    nodeId: props.id,
    channel: KRYPTONITE_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchKryptoniteToken,
  });
  const handleSubmit = (v: UniversalFormValues) =>
    setNodes((ns) =>
      ns.map((n) =>
        n.id === props.id ? { ...n, data: { ...n.data, ...v } } : n,
      ),
    );
  const app = props.data.appId ? getApp(String(props.data.appId)) : null;
  const opName = app?.operations.find(
    (o) => o.id === props.data.operationId,
  )?.name;
  const description = app
    ? `${app.name}${opName ? ` · ${opName}` : ""}`
    : "Not configured — click to set up";
  const icon = app ? app.icon : "🔌";
  return (
    <>
      <UniversalDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        defaultValues={props.data as Partial<UniversalFormValues>}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={icon}
        name={app?.name || "App Integration"}
        status={status}
        description={description}
        onSettings={() => setOpen(true)}
        onDoubleClick={() => setOpen(true)}
      />
    </>
  );
});
UniversalNode.displayName = "UniversalNode";
