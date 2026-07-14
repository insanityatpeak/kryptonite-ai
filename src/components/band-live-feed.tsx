"use client";

import { Loader2Icon, RadioIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BandMessage {
  id: string;
  roomId: string;
  agent: string;
  content: string;
  createdAt: string;
}

interface Props {
  roomId: string;
  isRunning: boolean;
}

const AGENT_COLORS: Record<string, string> = {
  "OpenAI Agent": "#10a37f",
  "Anthropic Agent": "#d4a94e",
  "Gemini Agent": "#4285f4",
  "Mistral Agent": "#ff6b35",
  "Qwen Agent": "#7c3aed",
  "AI Agent": "#6366f1",
  "AI Chain": "#0ea5e9",
  Summarizer: "#14b8a6",
  "Text Classifier": "#f59e0b",
  "Info Extractor": "#ec4899",
};

function agentColor(name: string): string {
  return AGENT_COLORS[name] ?? "#6b7280";
}

function agentInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BandLiveFeed({ roomId, isRunning }: Props) {
  const [messages, setMessages] = useState<BandMessage[]>([]);
  const [error, setError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const seenRef = useRef(new Set<string>());

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/band/${roomId}/messages`);
        if (!res.ok) {
          setError(true);
          return;
        }
        const data = (await res.json()) as { messages: BandMessage[] };
        const fresh = data.messages.filter((m) => !seenRef.current.has(m.id));
        if (fresh.length > 0) {
          fresh.forEach((m) => seenRef.current.add(m.id));
          setMessages((prev) => [...prev, ...fresh]);
        }
      } catch {
        setError(true);
      }
    }

    poll();
    pollRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollRef.current);
  }, [roomId]);

  // Stop polling when execution finishes
  useEffect(() => {
    if (!isRunning && pollRef.current) {
      // Do one final poll after a short delay to catch last messages
      const t = setTimeout(() => clearInterval(pollRef.current), 3000);
      return () => clearTimeout(t);
    }
  }, [isRunning]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <RadioIcon className="size-4 text-violet-500" />
              Band Agent Room
            </CardTitle>
            <CardDescription className="font-mono text-xs mt-0.5">
              {roomId}
            </CardDescription>
          </div>
          {isRunning ? (
            <Badge
              variant="outline"
              className="gap-1 text-emerald-600 border-emerald-200 text-xs"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </Badge>
          ) : messages.length > 0 ? (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Could not load Band messages — check BAND_API_KEY.
          </p>
        )}

        {!error && messages.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-sm">Waiting for agents to speak…</span>
              </>
            ) : (
              <span className="text-sm">No messages yet</span>
            )}
          </div>
        )}

        {messages.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {messages.map((msg) => {
              const color = agentColor(msg.agent);
              return (
                <div
                  key={msg.id}
                  className="flex gap-2.5 p-2.5 rounded-lg bg-muted/40"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div
                    className="size-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                    style={{ background: color }}
                  >
                    {agentInitials(msg.agent)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {msg.agent}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                  </div>
                </div>
              );
            })}

            {isRunning && (
              <div className="flex gap-2.5 p-2.5 rounded-lg bg-muted/20 border-l-2 border-muted-foreground/20">
                <div className="size-7 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex items-center gap-1 py-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
