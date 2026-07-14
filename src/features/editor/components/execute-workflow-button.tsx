"use client";

import {
  ArrowRightIcon,
  CheckCircle2Icon,
  FlaskConicalIcon,
  Loader2Icon,
  XCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useExecutionStatusPoll } from "@/features/executions/hooks/use-executions";
import { ExecutionStatus } from "@/generated/prisma";

function ExecutionStartedModal({
  workflowName,
  executionId,
  onClose,
}: {
  workflowName?: string;
  executionId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: execution } = useExecutionStatusPoll(executionId);
  const status = execution?.status;

  const isDone = status === ExecutionStatus.SUCCESS;
  const isFailed = status === ExecutionStatus.FAILED;
  const isFinished = isDone || isFailed;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Top accent strip */}
        <div
          className={
            isFailed
              ? "h-1 w-full bg-destructive"
              : isDone
                ? "h-1 w-full bg-emerald-500"
                : "h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
          }
        />

        <div className="px-6 py-8 flex flex-col items-center gap-5 text-center">
          {/* Animated icon */}
          <div className="relative flex items-center justify-center">
            {!isFinished && (
              <span
                className="absolute size-16 rounded-full bg-violet-500/10 animate-ping"
                style={{ animationDuration: "1.8s" }}
              />
            )}
            <span
              className={
                isFailed
                  ? "relative flex size-12 items-center justify-center rounded-xl bg-destructive/10"
                  : isDone
                    ? "relative flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40"
                    : "relative flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40"
              }
            >
              {isFailed ? (
                <XCircleIcon className="size-6 text-destructive" />
              ) : isDone ? (
                <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FlaskConicalIcon className="size-6 text-violet-600 dark:text-violet-400" />
              )}
            </span>
          </div>

          {/* Title + badge */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">
              {isFailed
                ? "Workflow failed"
                : isDone
                  ? "Workflow completed"
                  : "Workflow started"}
            </h2>
            {workflowName && (
              <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                {workflowName}
              </span>
            )}
          </div>

          {/* Status pill */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <span
              className={
                isFailed
                  ? "size-1.5 rounded-full bg-destructive"
                  : isDone
                    ? "size-1.5 rounded-full bg-emerald-500"
                    : "size-1.5 rounded-full bg-emerald-500 animate-pulse"
              }
            />
            {isFailed
              ? "Failed"
              : isDone
                ? "Completed"
                : "Running in background"}
          </div>

          {!isFinished && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
              You can close this page — the workflow keeps running and
              you&apos;ll get an email when it&apos;s done.
            </p>
          )}

          {/* Actions */}
          <div className="w-full flex flex-col gap-2">
            <Button
              className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => {
                onClose();
                router.push(`/executions/${executionId}`);
              }}
            >
              {isFinished ? "View results" : "View progress"}
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ExecuteWorkflowButton = ({
  workflowId,
}: {
  workflowId: string;
}) => {
  const [isPending, setIsPending] = useState(false);
  const [modal, setModal] = useState<{
    executionId: string;
    workflowName?: string;
  } | null>(null);
  const router = useRouter();

  const handleExecute = async () => {
    setIsPending(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        toast.error(`Failed to execute: ${err.error ?? res.statusText}`);
        return;
      }
      const { executionId, workflowName } = await res.json();
      setModal({ executionId, workflowName });
    } catch (err) {
      toast.error(
        `Failed to execute: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Button size="lg" onClick={handleExecute} disabled={isPending}>
        {isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <FlaskConicalIcon className="size-4" />
        )}
        {isPending ? "Starting..." : "Execute workflow"}
      </Button>
      {modal && (
        <ExecutionStartedModal
          executionId={modal.executionId}
          workflowName={modal.workflowName}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
};
