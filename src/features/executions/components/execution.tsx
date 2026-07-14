"use client";

import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BandLiveFeed } from "@/components/band-live-feed";
import { JsonView } from "@/components/json-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSuspenseExecution } from "@/features/executions/hooks/use-executions";
import { ExecutionStatus } from "@/generated/prisma";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

type NodeStep = {
  nodeId: string;
  nodeType: string;
  nodeName: string;
  status: "success" | "error";
  output?: unknown;
  error?: string;
  completedAt: string;
};

const NODE_ICONS: Record<string, string> = {
  GEMINI: "✦",
  OPENAI: "⬡",
  ANTHROPIC: "✳",
  MISTRAL: "◈",
  QWEN: "◉",
  AI_AGENT: "🤖",
  AI_CHAIN: "⛓",
  SUMMARIZER: "📝",
  TEXT_CLASSIFIER: "🏷",
  INFO_EXTRACTOR: "🔍",
  MANUAL_TRIGGER: "▶",
  INITIAL: "▶",
  HTTP_REQUEST: "🌐",
  SLACK: "💬",
  DISCORD: "🎮",
  NOTION: "📓",
  GOOGLE_SHEETS: "📊",
  GITHUB: "🐙",
  UNIVERSAL: "🔌",
};

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case ExecutionStatus.SUCCESS:
      return <CheckCircle2Icon className="size-5 text-emerald-500" />;
    case ExecutionStatus.FAILED:
      return <XCircleIcon className="size-5 text-red-500" />;
    case ExecutionStatus.RUNNING:
      return <Loader2Icon className="size-5 text-blue-500 animate-spin" />;
    default:
      return <ClockIcon className="size-5 text-muted-foreground" />;
  }
};

const StatusBadge = ({ status }: { status: "success" | "error" }) => (
  <Badge
    variant={status === "success" ? "default" : "destructive"}
    className={cn(
      "text-xs",
      status === "success" &&
        "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    )}
  >
    {status === "success" ? "✓ Done" : "✗ Failed"}
  </Badge>
);

const NodeStepCard = ({ step, index }: { step: NodeStep; index: number }) => {
  const [open, setOpen] = useState(false);
  const icon = NODE_ICONS[step.nodeType] || "◇";
  const hasTextField =
    step.output !== null &&
    typeof step.output === "object" &&
    typeof (step.output as Record<string, unknown>).text === "string";
  const outputText = step.output
    ? hasTextField
      ? ((step.output as Record<string, unknown>).text as string)
      : typeof step.output === "object"
        ? JSON.stringify(step.output, null, 2)
        : String(step.output)
    : null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "border rounded-lg overflow-hidden",
          step.status === "error" && "border-red-200 bg-red-50/30",
        )}
      >
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
            <span className="flex size-7 items-center justify-center rounded-md bg-muted text-sm font-medium shrink-0">
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {step.nodeName || step.nodeType}
                </span>
                <StatusBadge status={step.status} />
              </div>
              {outputText && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {outputText.slice(0, 100)}
                </p>
              )}
            </div>
            <span className="text-muted-foreground text-xs shrink-0">
              Step {index + 1}
            </span>
            {open ? (
              <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRightIcon className="size-4 text-muted-foreground shrink-0" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-1 border-t bg-muted/20">
            {step.error && (
              <div className="p-3 bg-red-50 rounded-md text-sm text-red-800 font-mono">
                {step.error}
              </div>
            )}
            {step.output != null && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 mt-1">
                  Output
                </p>
                {hasTextField || typeof step.output !== "object" ? (
                  <div className="text-sm bg-background border rounded-md p-3 whitespace-pre-wrap font-mono leading-relaxed">
                    {outputText}
                  </div>
                ) : (
                  <JsonView data={step.output} maxHeight="16rem" />
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export const ExecutionView = ({ executionId }: { executionId: string }) => {
  const { data: execution, refetch } = useSuspenseExecution(executionId);
  const [showRawOutput, setShowRawOutput] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Poll every 2s while still running
  useEffect(() => {
    if (execution.status !== ExecutionStatus.RUNNING) return;
    const interval = setInterval(async () => {
      await queryClient.invalidateQueries(
        trpc.executions.getOne.queryOptions({ id: executionId }),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [execution.status, executionId, queryClient, trpc]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch(`/api/executions/${executionId}/cancel`, { method: "POST" });
      await queryClient.invalidateQueries(
        trpc.executions.getOne.queryOptions({ id: executionId }),
      );
    } finally {
      setCancelling(false);
    }
  };

  const output = execution.output as Record<string, unknown> | null;
  const steps: NodeStep[] = (output?._steps as NodeStep[]) ?? [];
  const contextVars = output
    ? Object.entries(output).filter(([k]) => k !== "_steps")
    : [];

  const duration = execution.completedAt
    ? Math.round(
        (new Date(execution.completedAt).getTime() -
          new Date(execution.startedAt).getTime()) /
          1000,
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/executions"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          {getStatusIcon(execution.status)}
          <div>
            <h1 className="font-semibold text-lg">
              {execution.status === ExecutionStatus.RUNNING
                ? "Running…"
                : execution.status === ExecutionStatus.SUCCESS
                  ? "Completed"
                  : "Failed"}
            </h1>
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/workflows/${execution.workflowId}`}
                className="hover:underline text-primary"
              >
                {execution.workflow.name}
              </Link>
              {" · "}
              {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
              {duration !== null && ` · ${duration}s`}
            </p>
          </div>
        </div>
        {execution.status === ExecutionStatus.RUNNING && (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="gap-1 text-blue-600 border-blue-200"
            >
              <Loader2Icon className="size-3 animate-spin" />
              Live
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-7 text-xs"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <Loader2Icon className="size-3 animate-spin mr-1" />
              ) : null}
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Band Agent Room Live Feed */}
      {execution.bandRoomId && (
        <BandLiveFeed
          roomId={execution.bandRoomId}
          isRunning={execution.status === ExecutionStatus.RUNNING}
        />
      )}

      {/* Node Steps */}
      {steps.length > 0 ? (
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Node Steps</CardTitle>
            <CardDescription>
              {steps.length} node{steps.length !== 1 ? "s" : ""} executed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {steps.map((step, i) => (
              <NodeStepCard key={step.nodeId} step={step} index={i} />
            ))}
          </CardContent>
        </Card>
      ) : execution.status === ExecutionStatus.RUNNING ? (
        <Card className="shadow-none">
          <CardContent className="flex items-center gap-3 py-8 justify-center text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
            <span className="text-sm">Waiting for nodes to start…</span>
          </CardContent>
        </Card>
      ) : null}

      {/* Context Variables (final output) */}
      {contextVars.length > 0 &&
        execution.status === ExecutionStatus.SUCCESS && (
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Final Output</CardTitle>
                  <CardDescription>
                    All variables from this execution
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawOutput((v) => !v)}
                >
                  {showRawOutput ? "Formatted" : "Raw JSON"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showRawOutput ? (
                <JsonView
                  data={Object.fromEntries(contextVars)}
                  maxHeight="24rem"
                />
              ) : (
                <div className="space-y-3">
                  {contextVars.map(([key, value]) => {
                    const text =
                      typeof value === "object" && value !== null
                        ? ((value as Record<string, unknown>).text as string) ||
                          JSON.stringify(value, null, 2)
                        : String(value);
                    return (
                      <div key={key} className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground font-mono">{`{{${key}.text}}`}</p>
                        <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                          {text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Error */}
      {execution.error && (
        <Card className="shadow-none border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-red-800 font-mono bg-red-50 p-3 rounded-md">
              {execution.error}
            </p>
            {execution.errorStack && (
              <Collapsible open={showStack} onOpenChange={setShowStack}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50"
                  >
                    {showStack ? "Hide stack trace" : "Show stack trace"}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre className="text-xs font-mono text-red-800 overflow-auto mt-2 p-3 bg-red-50 rounded-md max-h-64">
                    {execution.errorStack}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <Card className="shadow-none">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Started</p>
              <p>
                {formatDistanceToNow(execution.startedAt, { addSuffix: true })}
              </p>
            </div>
            {execution.completedAt && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p>
                  {formatDistanceToNow(execution.completedAt, {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
            {duration !== null && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                <p>{duration}s</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Event ID</p>
              <p className="font-mono text-xs truncate">
                {execution.inngestEventId}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
