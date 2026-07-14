"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const DEMO_NODES = [
  {
    id: "trigger",
    label: "Webhook Trigger",
    sub: "On POST /webhook",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.12)",
    border: "rgba(34,197,94,0.35)",
    x: 40,
    y: 160,
    status: "done",
  },
  {
    id: "gemini",
    label: "Gemini AI",
    sub: "Analyze request",
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
    border: "rgba(99,102,241,0.35)",
    x: 220,
    y: 80,
    status: "done",
  },
  {
    id: "openai",
    label: "OpenAI GPT-4",
    sub: "Summarize output",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.12)",
    border: "rgba(129,140,248,0.35)",
    x: 220,
    y: 240,
    status: "running",
  },
  {
    id: "slack",
    label: "Slack",
    sub: "Send to #alerts",
    color: "#E01E5A",
    bg: "rgba(224,30,90,0.12)",
    border: "rgba(224,30,90,0.35)",
    x: 420,
    y: 80,
    status: "pending",
  },
  {
    id: "notion",
    label: "Notion DB",
    sub: "Save log entry",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.12)",
    border: "rgba(148,163,184,0.25)",
    x: 420,
    y: 240,
    status: "pending",
  },
];

const STEPS = [
  {
    nodeId: "trigger",
    label: "Webhook received",
    output: '{ "user": "alex@acme.com", "event": "upgrade" }',
    status: "done",
  },
  {
    nodeId: "gemini",
    label: "Gemini analysed intent",
    output: '"User upgraded to Pro — high intent signal detected."',
    status: "done",
  },
  {
    nodeId: "openai",
    label: "OpenAI running summary…",
    output: null,
    status: "running",
  },
  {
    nodeId: "slack",
    label: "Slack message queued",
    output: null,
    status: "pending",
  },
  {
    nodeId: "notion",
    label: "Notion record queued",
    output: null,
    status: "pending",
  },
];

type Status = "idle" | "running" | "done";

export default function DemoPage() {
  const [runState, setRunState] = useState<Status>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const timersRef = useRef<number[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  };

  const handleRun = () => {
    clearTimers();
    mountedRef.current = true;
    setRunState("running");
    setStepIndex(0);
    let i = 0;
    const tick = () => {
      i++;
      if (!mountedRef.current) return;
      setStepIndex(i);
      if (i < STEPS.length) {
        timersRef.current.push(
          window.setTimeout(tick, 900 + Math.random() * 400),
        );
      } else {
        setRunState("done");
      }
    };
    timersRef.current.push(window.setTimeout(tick, 900));
  };

  const handleReset = () => {
    clearTimers();
    setRunState("idle");
    setStepIndex(-1);
  };

  const getNodeStatus = (id: string) => {
    const stepIdx = STEPS.findIndex((s) => s.nodeId === id);
    if (stepIndex < 0) return "idle";
    if (stepIdx < stepIndex) return "done";
    if (stepIdx === stepIndex && runState === "running") return "running";
    if (stepIdx === stepIndex && runState === "done") return "done";
    return "pending";
  };

  const statusColor: Record<string, string> = {
    idle: "rgba(255,255,255,0.15)",
    done: "#22c55e",
    running: "#6366f1",
    pending: "rgba(255,255,255,0.08)",
  };

  return (
    <div className="demo-page min-h-screen bg-[#f7f8fc] text-zinc-900 flex flex-col">
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .pulse-ring { animation: pulse-ring 1s ease-in-out infinite; }

        @keyframes flow-dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -32; }
        }
        .flow-line-active { animation: flow-dash 1.2s linear infinite; }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.3s ease forwards; }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xl px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-950 transition-colors text-sm font-medium"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-4"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to home
        </Link>

        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
          <div className="size-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5 text-white"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
          </div>
          Kryptonite — Demo
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
            Live workflow demo
          </span>
          <Link
            href="/signup"
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            Start free →
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas */}
        <div
          className="flex-1 relative bg-gradient-to-br from-white via-slate-50 to-slate-100"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(15,23,42,0.05) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          {/* Toolbar */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <div className="px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 text-xs text-slate-600 font-medium shadow-sm backdrop-blur">
              Webhook → AI Agent → Notify
            </div>
          </div>

          {/* Run button */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {runState !== "idle" && (
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white/90 text-slate-600 hover:text-slate-950 text-sm font-medium transition-all shadow-sm"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleRun}
              disabled={runState === "running"}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]"
            >
              {runState === "running" ? (
                <>
                  <span className="size-3.5 rounded-full border-2 border-white/30 border-t-white spin" />
                  Running…
                </>
              ) : runState === "done" ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4 text-emerald-300"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Completed
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Run workflow
                </>
              )}
            </button>
          </div>

          {/* SVG Canvas */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative" style={{ width: 620, height: 360 }}>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 620 360"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="4"
                    refY="4"
                    orient="auto"
                  >
                    <path d="M0,0 L8,4 L0,8 Z" fill="rgba(99,102,241,0.5)" />
                  </marker>
                </defs>
                {/* Trigger → Gemini */}
                {[
                  {
                    d: "M 165 185 C 195 185 195 120 215 120",
                    active: stepIndex >= 0,
                  },
                  {
                    d: "M 165 185 C 195 185 195 265 215 265",
                    active: stepIndex >= 1,
                  },
                  {
                    d: "M 350 120 C 390 120 390 120 415 120",
                    active: stepIndex >= 1,
                  },
                  {
                    d: "M 350 265 C 390 265 390 265 415 265",
                    active: stepIndex >= 2,
                  },
                ].map((edge, i) => (
                  <path
                    key={i}
                    d={edge.d}
                    stroke={
                      edge.active
                        ? "rgba(99,102,241,0.7)"
                        : "rgba(148,163,184,0.22)"
                    }
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="6 4"
                    className={
                      edge.active && runState === "running"
                        ? "flow-line-active"
                        : ""
                    }
                    markerEnd="url(#arrowhead)"
                  />
                ))}
              </svg>

              {/* Nodes */}
              {DEMO_NODES.map((node) => {
                const ns = getNodeStatus(node.id);
                const isRunning = ns === "running";
                const isDone = ns === "done";
                const isIdle = ns === "idle";
                return (
                  <div
                    key={node.id}
                    className="absolute transition-all duration-500"
                    style={{
                      left: node.x,
                      top: node.y,
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div
                      className="relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold select-none cursor-default transition-all duration-300"
                      style={{
                        background: isIdle ? "rgba(255,255,255,0.88)" : node.bg,
                        border: `1.5px solid ${isIdle ? "rgba(203,213,225,0.9)" : node.border}`,
                        minWidth: "130px",
                        boxShadow: isDone
                          ? `0 12px 28px ${node.color}12`
                          : isRunning
                            ? `0 18px 36px ${node.color}20`
                            : "0 10px 24px rgba(15,23,42,0.06)",
                      }}
                    >
                      {/* Status dot */}
                      <div className="relative shrink-0">
                        <span
                          className="size-2.5 rounded-full block"
                          style={{
                            background: isIdle
                              ? "rgba(148,163,184,0.35)"
                              : statusColor[ns],
                          }}
                        />
                        {isRunning && (
                          <span
                            className="absolute inset-0 rounded-full pulse-ring"
                            style={{ background: statusColor[ns] }}
                          />
                        )}
                      </div>
                      <div>
                        <div className="text-zinc-900 text-[13px]">
                          {node.label}
                        </div>
                        <div className="text-slate-500 text-[11px] font-normal">
                          {node.sub}
                        </div>
                      </div>
                      {/* Check mark */}
                      {isDone && (
                        <div className="ml-auto shrink-0">
                          <svg
                            viewBox="0 0 16 16"
                            fill="none"
                            className="size-4 text-emerald-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              stroke="currentColor"
                              d="M3 8l3.5 3.5L13 4.5"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Idle hint */}
          {runState === "idle" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white/90 text-slate-600 text-sm animate-bounce shadow-sm backdrop-blur">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-4 text-indigo-400"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                  clipRule="evenodd"
                />
              </svg>
              Press &ldquo;Run workflow&rdquo; to watch it execute live
            </div>
          )}

          {runState === "done" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-50 text-emerald-700 text-sm font-medium fade-in shadow-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                  clipRule="evenodd"
                />
              </svg>
              All 5 nodes completed successfully
            </div>
          )}
        </div>

        {/* Right panel: execution log */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col bg-white/95 backdrop-blur-xl">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-900">
              Execution log
            </span>
            {runState === "running" && (
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
                <span className="size-1.5 rounded-full bg-indigo-500 pulse-ring" />
                Live
              </div>
            )}
            {runState === "done" && (
              <span className="text-xs font-medium text-emerald-600">Done</span>
            )}
            {runState === "idle" && (
              <span className="text-xs text-slate-500">Waiting</span>
            )}
          </div>

          {/* Steps */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {runState === "idle" ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="size-10 mx-auto mb-3 opacity-30"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                  />
                </svg>
                Run the workflow to see logs
              </div>
            ) : (
              STEPS.slice(0, stepIndex + 1).map((step, i) => {
                const isActive = i === stepIndex && runState === "running";
                const isDone = i < stepIndex || runState === "done";
                return (
                  <div key={step.nodeId} className="fade-in">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isDone ? (
                          <div className="size-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              className="size-3 text-emerald-400"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                stroke="currentColor"
                                d="M2.5 8l3.5 3.5L13.5 4"
                              />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <div className="size-5 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                            <span className="size-2 rounded-full border border-indigo-300/40 border-t-indigo-300 spin" />
                          </div>
                        ) : (
                          <div className="size-5 rounded-full bg-slate-100 border border-slate-200" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-900">
                          {step.label}
                        </p>
                        {step.output && isDone && (
                          <pre className="mt-1.5 text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 whitespace-pre-wrap break-all leading-relaxed">
                            {step.output}
                          </pre>
                        )}
                        {isActive && (
                          <p className="text-[11px] text-indigo-600 mt-1 font-medium">
                            Processing…
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 shrink-0">
                        {new Date().toLocaleTimeString("en", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sign up CTA */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/80">
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900 mb-1">
                Ready to build your own?
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Start with 100 free executions — no credit card.
              </p>
              <Link
                href="/signup"
                className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01]"
              >
                Get started free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
