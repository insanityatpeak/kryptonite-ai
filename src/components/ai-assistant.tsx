"use client";

import { createId } from "@paralleldrive/cuid2";
import { useAtomValue } from "jotai";
import {
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { editorAtom, editorSettersAtom } from "@/features/editor/store/atoms";
import { NodeType } from "@/generated/prisma";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type WorkflowNodeDef = {
  type: string;
  label?: string;
  data?: Record<string, unknown>;
};

type WorkflowDef = {
  nodes: WorkflowNodeDef[];
  edges: { from: number; to: number }[];
};

function parseWorkflow(content: string): WorkflowDef | null {
  const match = content.match(/```workflow\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as WorkflowDef;
  } catch {
    return null;
  }
}

function renderContent(content: string) {
  // Strip workflow block from display text, show rest
  const cleaned = content.replace(/```workflow[\s\S]*?```/g, "").trim();
  return cleaned;
}

function AddToCanvasButton({ workflow }: { workflow: WorkflowDef }) {
  const editor = useAtomValue(editorAtom);
  const setters = useAtomValue(editorSettersAtom);

  const handleAdd = useCallback(() => {
    if (!setters || !editor) {
      toast.error(
        "Open a workflow editor first, then ask Kryptonite AI to build.",
      );
      return;
    }

    const existingNodes = editor.getNodes();
    const hasInitial = existingNodes.some(
      (n) => n.type === NodeType.INITIAL || n.type === NodeType.MANUAL_TRIGGER,
    );

    // Convert viewport center to flow coordinates
    const viewportCenter = editor.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const cols = 3;
    const spacingX = 320;
    const spacingY = 200;
    const totalCols = Math.min(workflow.nodes.length, cols);
    const startX = viewportCenter.x - ((totalCols - 1) * spacingX) / 2;
    const startY = viewportCenter.y - 200;

    // Build all nodes with positions
    const allNewNodes = workflow.nodes.map((def, i) => ({
      id: createId(),
      type: (NodeType[def.type as keyof typeof NodeType] ??
        NodeType.AI_CHAIN) as string,
      position: {
        x: startX + (i % cols) * spacingX,
        y: startY + Math.floor(i / cols) * spacingY,
      },
      data: def.data ?? {},
    }));

    // Skip trigger if canvas already has one
    const filteredNodes = hasInitial
      ? allNewNodes.filter(
          (_, i) =>
            workflow.nodes[i].type !== "MANUAL_TRIGGER" &&
            workflow.nodes[i].type !== "INITIAL" &&
            workflow.nodes[i].type !== "SCHEDULE_TRIGGER" &&
            workflow.nodes[i].type !== "WEBHOOK_TRIGGER",
        )
      : allNewNodes;

    // Build edges using the original index→id mapping
    const idByIndex = allNewNodes.map((n) => n.id);
    const addedIdSet = new Set(filteredNodes.map((n) => n.id));

    const newEdges = workflow.edges
      .map((e) => {
        const sourceId = idByIndex[e.from];
        const targetId = idByIndex[e.to];
        if (!sourceId || !targetId) return null;
        if (!addedIdSet.has(sourceId) || !addedIdSet.has(targetId)) return null;
        return { id: createId(), source: sourceId, target: targetId };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    // Use the real React state setters — this persists through re-renders
    setters.setNodes((prev) => [...prev, ...filteredNodes]);
    setters.setEdges((prev) => [...prev, ...newEdges]);

    toast.success(`Added ${filteredNodes.length} nodes to the canvas!`);
  }, [editor, setters, workflow]);

  return (
    <button
      onClick={handleAdd}
      className="mt-2 flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 active:bg-purple-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
    >
      <ZapIcon className="size-3" />
      Add to Canvas
    </button>
  );
}

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || isLoading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text,
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      const assistantId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: accumulated } : m,
            ),
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, isLoading],
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg hover:from-purple-500 hover:to-violet-600 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Kryptonite AI Assistant"
      >
        {open ? (
          <XIcon className="size-5 text-white" />
        ) : (
          <SparklesIcon className="size-5 text-white" />
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-[400px] flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-600 to-violet-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-4 text-white" />
              <span className="font-semibold text-white text-sm">
                Kryptonite AI
              </span>
              <span className="text-white/60 text-xs">
                · can build workflows
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setMessages([])}
              title="Clear chat"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[480px] min-h-[200px]">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 text-center py-6">
                <SparklesIcon className="size-8 mx-auto text-purple-500" />
                <p className="text-sm font-medium">How can I help?</p>
                <p className="text-xs text-muted-foreground">
                  Ask me to <strong>build</strong> a workflow and I&apos;ll add
                  the nodes directly to your canvas.
                </p>
              </div>
            )}
            {messages.map((m) => {
              const workflow =
                m.role === "assistant" ? parseWorkflow(m.content) : null;
              const displayText =
                m.role === "assistant" ? renderContent(m.content) : m.content;

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col",
                    m.role === "user" ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-purple-600 text-white rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm",
                    )}
                  >
                    {displayText ||
                      (isLoading && m.role === "assistant" ? (
                        <span className="inline-flex gap-1">
                          <span className="animate-bounce">.</span>
                          <span
                            className="animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          >
                            .
                          </span>
                          <span
                            className="animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          >
                            .
                          </span>
                        </span>
                      ) : null)}
                  </div>
                  {workflow && <AddToCanvasButton workflow={workflow} />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="flex items-end gap-2 border-t p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Kryptonite AI or say 'build me a workflow that…'"
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 max-h-32"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(e as unknown as React.FormEvent);
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700 size-9"
            >
              <SendIcon className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
