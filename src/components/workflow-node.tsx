"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import {
  CopyIcon,
  Loader2Icon,
  PlayIcon,
  RepeatIcon,
  SettingsIcon,
  TrashIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface WorkflowNodeProps {
  children: ReactNode;
  showToolbar?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  name?: string;
  description?: string;
  onExecuteStep?: () => void;
  isExecutingStep?: boolean;
  retryOnFail?: boolean;
  onToggleRetry?: () => void;
  onDuplicate?: () => void;
}

export function WorkflowNode({
  children,
  showToolbar = true,
  onDelete,
  onSettings,
  name,
  description,
  onExecuteStep,
  isExecutingStep,
  retryOnFail,
  onToggleRetry,
  onDuplicate,
}: WorkflowNodeProps) {
  return (
    <>
      {showToolbar && (
        <NodeToolbar>
          {onExecuteStep && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onExecuteStep}
              disabled={isExecutingStep}
              title="Execute step"
            >
              {isExecutingStep ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <PlayIcon className="size-4" />
              )}
            </Button>
          )}
          {onToggleRetry && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleRetry}
              title={
                retryOnFail
                  ? "Retry on fail: enabled"
                  : "Retry on fail: disabled"
              }
              className={cn(retryOnFail && "text-emerald-600")}
            >
              <RepeatIcon className="size-4" />
            </Button>
          )}
          {onDuplicate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
              title="Duplicate node"
            >
              <CopyIcon className="size-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onSettings}>
            <SettingsIcon className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <TrashIcon className="size-4" />
          </Button>
        </NodeToolbar>
      )}
      {children}
      {name && (
        <NodeToolbar
          position={Position.Bottom}
          isVisible
          className="max-w-[200px] text-center"
        >
          <p className="font-medium">{name}</p>
          {description && (
            <p className="text-muted-foreground truncate text-sm">
              {description}
            </p>
          )}
        </NodeToolbar>
      )}
    </>
  );
}
