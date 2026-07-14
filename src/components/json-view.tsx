"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

function valueLabel(value: JsonValue): string {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (value !== null && typeof value === "object")
    return `Object(${Object.keys(value).length})`;
  return "";
}

function PrimitiveValue({ value }: { value: JsonValue }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }
  if (typeof value === "string") {
    return <span className="text-emerald-600">&quot;{value}&quot;</span>;
  }
  if (typeof value === "number") {
    return <span className="text-blue-600">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-purple-600">{String(value)}</span>;
  }
  return null;
}

const JsonNode = ({
  keyName,
  value,
  depth,
}: {
  keyName?: string;
  value: JsonValue;
  depth: number;
}) => {
  const [open, setOpen] = useState(depth < 1);
  const isExpandable = value !== null && typeof value === "object";

  if (!isExpandable) {
    return (
      <div
        className="flex items-start gap-1.5 py-0.5"
        style={{ paddingLeft: depth * 14 }}
      >
        {keyName !== undefined && (
          <span className="text-muted-foreground shrink-0">{keyName}:</span>
        )}
        <PrimitiveValue value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 py-0.5 hover:bg-muted/60 rounded-sm w-full text-left"
        style={{ paddingLeft: depth * 14 }}
      >
        {open ? (
          <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />
        )}
        {keyName !== undefined && (
          <span className="text-muted-foreground">{keyName}:</span>
        )}
        <span className="text-muted-foreground/70">{valueLabel(value)}</span>
      </button>
      {open && (
        <div>
          {entries.length === 0 ? (
            <div
              className="text-muted-foreground/60 italic"
              style={{ paddingLeft: (depth + 1) * 14 }}
            >
              empty
            </div>
          ) : (
            entries.map(([k, v]) => (
              <JsonNode
                key={k}
                keyName={k}
                value={v as JsonValue}
                depth={depth + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

interface JsonViewProps {
  data: unknown;
  className?: string;
  maxHeight?: string;
}

export function JsonView({
  data,
  className,
  maxHeight = "24rem",
}: JsonViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("relative rounded-md border bg-background", className)}>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute top-1.5 right-1.5 size-6 z-10"
        onClick={handleCopy}
        title="Copy JSON"
      >
        {copied ? (
          <CheckIcon className="size-3 text-emerald-500" />
        ) : (
          <CopyIcon className="size-3" />
        )}
      </Button>
      <div
        className="overflow-auto p-3 pr-8 font-mono text-xs leading-relaxed"
        style={{ maxHeight }}
      >
        <JsonNode value={data as JsonValue} depth={0} />
      </div>
    </div>
  );
}
