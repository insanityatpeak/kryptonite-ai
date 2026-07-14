"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import NodeCanvas from "./NodeCanvas";

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 24, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  transition: { duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const QUERIES = [
  {
    text: "Find all emails from Adani in the last 2 years",
    results: [
      "284 emails found",
      "12 contracts",
      "4 invoices",
      "8 meeting notes",
      "Summary generated",
    ],
    sources: ["Gmail", "Google Drive", "Notion", "Report"],
  },
  {
    text: "Show every invoice above ₹50,000 from Gmail and Drive",
    results: [
      "37 invoices found",
      "₹18.4L total value",
      "6 overdue",
      "Report generated",
    ],
    sources: ["Gmail", "Google Drive", "Report"],
  },
  {
    text: "Summarize my conversations with Reliance across every app",
    results: [
      "142 messages found",
      "9 threads",
      "3 open commitments",
      "Summary generated",
    ],
    sources: ["Gmail", "Slack", "WhatsApp", "Report"],
  },
  {
    text: "Which clients have not been contacted in 30 days?",
    results: [
      "14 clients flagged",
      "6 high priority",
      "Follow-up list generated",
    ],
    sources: ["CRM", "Gmail", "Report"],
  },
];

export default function HeroSection() {
  const [queryIndex, setQueryIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "searching" | "results">(
    "typing",
  );

  const active = QUERIES[queryIndex];

  useEffect(() => {
    setTyped("");
    setPhase("typing");
    const full = active.text;
    let i = 0;
    const typeInterval = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeInterval);
        setPhase("searching");
        window.setTimeout(() => setPhase("results"), 900);
      }
    }, 28);
    return () => clearInterval(typeInterval);
  }, [queryIndex, active.text]);

  useEffect(() => {
    if (phase !== "results") return;
    const next = window.setTimeout(() => {
      setQueryIndex((i) => (i + 1) % QUERIES.length);
    }, 3200);
    return () => clearTimeout(next);
  }, [phase]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)",
        color: "#111827",
      }}
    >
      <NodeCanvas />

      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 2,
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "28%",
          background: "linear-gradient(to top, #fff 0%, transparent 100%)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "7rem 1.5rem 4rem",
          width: "100%",
          maxWidth: "74rem",
        }}
      >
        <motion.div {...fadeUp(0.15)} style={{ marginBottom: "1.5rem" }}>
          <div
            className="liquid-glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 9999,
              padding: "0.45rem 1rem 0.45rem 0.65rem",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#4ade80",
                flexShrink: 0,
                display: "inline-block",
              }}
              className="lp-pulse-dot"
            />
            <span style={{ fontSize: 12, color: "rgba(17,24,39,0.72)" }}>
              Universal AI Search &amp; Agent Memory
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>
              Powered by Band.ai
            </span>
          </div>
        </motion.div>

        <motion.h1
          {...fadeUp(0.28)}
          className="font-heading"
          style={{
            fontSize: "clamp(2.6rem,7.5vw,5.8rem)",
            color: "#111827",
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            maxWidth: "16ch",
          }}
        >
          Ask Anything.{" "}
          <span className="accent-gradient-text">Search Everything.</span>
          <br />
          Automate Anything.
        </motion.h1>

        <motion.p
          {...fadeUp(0.42)}
          style={{
            fontSize: "clamp(0.95rem,1.6vw,1.1rem)",
            color: "rgba(17,24,39,0.65)",
            maxWidth: "42rem",
            lineHeight: 1.8,
            marginTop: "1.1rem",
          }}
        >
          Kryptonite is your AI agent across every app — Gmail, WhatsApp, Slack,
          Notion, Drive, your CRM. One search bar that searches, reasons, and
          acts across all of your connected tools — every AI agent runs inside a
          shared <strong>Band.ai</strong> room, so they coordinate with each
          other in real time instead of working in isolation.
        </motion.p>

        {/* Universal Search Bar */}
        <motion.div
          {...fadeUp(0.58)}
          style={{ width: "100%", maxWidth: "46rem", marginTop: "2.5rem" }}
        >
          <div
            className="liquid-glass-strong"
            style={{
              borderRadius: "1.25rem",
              padding: "1.1rem 1.4rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
            }}
          >
            <SearchIcon size={18} style={{ flexShrink: 0, color: "#6b7280" }} />
            <span
              style={{
                flex: 1,
                fontSize: "clamp(0.85rem,1.6vw,1rem)",
                color: "#111827",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {typed}
              <span
                className="lp-typing-cursor"
                style={{ borderRight: "2px solid #2563eb", marginLeft: 2 }}
              />
            </span>
            <div
              className="lp-pulse-glow"
              style={{
                flexShrink: 0,
                borderRadius: 9999,
                padding: "0.55rem 1.1rem",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {phase === "typing"
                ? "Listening…"
                : phase === "searching"
                  ? "Searching…"
                  : "Ask Kryptonite"}
            </div>
          </div>

          {/* Animated results */}
          <div style={{ minHeight: 132, marginTop: "1.1rem" }}>
            <AnimatePresence mode="wait">
              {phase === "results" && (
                <motion.div
                  key={queryIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      justifyContent: "center",
                      marginBottom: "0.9rem",
                    }}
                  >
                    {active.results.map((r, i) => (
                      <motion.div
                        key={r}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.3 }}
                        className="liquid-glass"
                        style={{
                          borderRadius: 9999,
                          padding: "0.4rem 0.85rem",
                          fontSize: 12.5,
                          color: "#15803d",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ color: "#16a34a" }}>✓</span>
                        {r}
                      </motion.div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {active.sources.map((s, i) => (
                      <motion.span
                        key={s}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "rgba(17,24,39,0.55)",
                            border: "1px solid rgba(17,24,39,0.12)",
                            borderRadius: 9999,
                            padding: "0.3rem 0.7rem",
                          }}
                        >
                          {s}
                        </span>
                        {i < active.sources.length - 1 && (
                          <span
                            style={{
                              color: "rgba(59,130,246,0.5)",
                              fontSize: 13,
                            }}
                          >
                            →
                          </span>
                        )}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          {...fadeUp(0.78)}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
            marginTop: "1.5rem",
          }}
        >
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <div
              className="liquid-glass-strong lp-pulse-glow"
              style={{
                borderRadius: 9999,
                padding: "1rem 2.25rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.transform =
                  "scale(1.03)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.transform = "scale(1)")
              }
            >
              Start Building Free →
            </div>
          </Link>
          <Link href="/demo" style={{ textDecoration: "none" }}>
            <div
              style={{
                borderRadius: 9999,
                padding: "1rem 2.25rem",
                border: "1px solid rgba(17,24,39,0.12)",
                fontSize: 15,
                fontWeight: 600,
                color: "rgba(17,24,39,0.75)",
                background: "transparent",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(17,24,39,0.04)";
                (e.currentTarget as HTMLElement).style.color = "#111827";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(17,24,39,0.75)";
              }}
            >
              Watch Demo ▶
            </div>
          </Link>
        </motion.div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          zIndex: 10,
          opacity: 0.6,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "rgba(17,24,39,0.5)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Scroll
        </span>
        <div
          style={{
            width: 1,
            height: 40,
            background: "rgba(17,24,39,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="lp-scroll-down accent-gradient"
            style={{ position: "absolute", inset: 0 }}
          />
        </div>
      </div>
    </section>
  );
}
