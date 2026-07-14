"use client";

import { motion } from "framer-motion";
import { CheckCircle2Icon, StarIcon, WrenchIcon, ZapIcon } from "lucide-react";
import { useEffect, useState } from "react";

function DisagreementDiagram() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 4), 1200);
    return () => clearInterval(t);
  }, []);
  const statuses = [
    {
      text: "Engineer submits work",
      eng: "#3b82f6",
      rev: "rgba(255,255,255,0.1)",
      arrow: "→",
      badge: null,
    },
    {
      text: "Reviewer checks code",
      eng: "rgba(255,255,255,0.15)",
      rev: "#8b5cf6",
      arrow: "→",
      badge: null,
    },
    {
      text: "REJECTED ✗ – rate limiting missing",
      eng: "rgba(255,255,255,0.08)",
      rev: "#ef4444",
      arrow: "←",
      badge: "reject",
    },
    {
      text: "APPROVED ✓ – fix applied",
      eng: "#3b82f6",
      rev: "#10b981",
      arrow: "→",
      badge: "approve",
    },
  ][phase];

  return (
    <div
      style={{
        padding: "1.5rem 0",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        flexGrow: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: "center",
        }}
      >
        <div
          style={{
            borderRadius: 10,
            padding: "0.6rem 1rem",
            background: statuses.eng,
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            color: "#fff",
            fontWeight: 600,
            transition: "background 0.4s",
          }}
        >
          Engineer
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color:
                statuses.badge === "reject"
                  ? "#ef4444"
                  : statuses.badge === "approve"
                    ? "#10b981"
                    : "rgba(255,255,255,0.4)",
              transition: "color 0.4s",
            }}
          >
            {statuses.arrow}
          </span>
          {statuses.badge && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background:
                  statuses.badge === "reject" ? "#ef444420" : "#10b98120",
                color: statuses.badge === "reject" ? "#ef4444" : "#10b981",
              }}
            >
              {statuses.badge === "reject" ? "REJECT" : "APPROVE"}
            </span>
          )}
        </div>
        <div
          style={{
            borderRadius: 10,
            padding: "0.6rem 1rem",
            background: statuses.rev,
            border: "1px solid rgba(255,255,255,0.1)",
            fontSize: 12,
            color: "#fff",
            fontWeight: 600,
            transition: "background 0.4s",
          }}
        >
          Reviewer
        </div>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.4)",
          textAlign: "center",
          transition: "opacity 0.3s",
          minHeight: 32,
        }}
      >
        {statuses.text}
      </p>
    </div>
  );
}

function BranchDiagram() {
  const [dot, setDot] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDot((p) => (p + 1) % 2), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "1rem 0",
        flexGrow: 1,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          padding: "0.5rem 1.25rem",
          borderRadius: 8,
          background: "rgba(59,130,246,0.15)",
          border: "1px solid rgba(59,130,246,0.4)",
          fontSize: 12,
          color: "#93c5fd",
          fontWeight: 600,
        }}
      >
        Risk Agent
      </div>
      <svg width="160" height="60" viewBox="0 0 160 60">
        <line
          x1="80"
          y1="0"
          x2="20"
          y2="55"
          stroke="rgba(239,68,68,0.5)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        <line
          x1="80"
          y1="0"
          x2="140"
          y2="55"
          stroke="rgba(16,185,129,0.5)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        {dot === 0 && (
          <circle cx="50" cy="27" r="4" fill="#ef4444" opacity="0.9" />
        )}
        {dot === 1 && (
          <circle cx="110" cy="27" r="4" fill="#10b981" opacity="0.9" />
        )}
      </svg>
      <div style={{ display: "flex", gap: 24 }}>
        <div
          style={{
            fontSize: 11,
            color: "#fca5a5",
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#ef4444",
            }}
          />
          HIGH_RISK
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#6ee7b7",
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#10b981",
            }}
          />
          LOW_RISK
        </div>
      </div>
    </div>
  );
}

function VoiceDiagram() {
  const [nodes, setNodes] = useState<string[]>([]);
  const NODE_LIST = ["Planner", "Engineer", "Reviewer", "Tester"];
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < NODE_LIST.length) {
        setNodes((n) => [...n, NODE_LIST[i]]);
        i++;
      } else {
        setNodes([]);
        i = 0;
      }
    }, 800);
    return () => clearInterval(t);
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "1rem 0",
        flexGrow: 1,
      }}
    >
      <div style={{ position: "relative", width: 64, height: 64 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1px solid rgba(139,92,246,0.4)",
              animation: `lp-float ${1.5 + i * 0.5}s ease-in-out ${i * 0.3}s infinite`,
              transform: `scale(${1 + i * 0.5})`,
              opacity: 0.5 - i * 0.15,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            width="28"
            height="28"
            stroke="#8b5cf6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
          </svg>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          minHeight: 28,
        }}
      >
        {nodes.map((n) => (
          <span
            key={n}
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 6,
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              color: "#c4b5fd",
              animation: "lp-fade-in 0.4s ease",
            }}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function AIChatDiagram() {
  const CHATS = [
    {
      user: "Add a code reviewer agent",
      icon: CheckCircle2Icon,
      ai: "Added @Reviewer to canvas. Connecting to @Engineer node...",
    },
    {
      user: "Fix the broken engineer node",
      icon: WrenchIcon,
      ai: "Found issue: missing error handler. Fixed and reconnected.",
    },
    {
      user: "Set all agents to GPT-4o",
      icon: ZapIcon,
      ai: "Updated 5 agent models to GPT-4o. Costs updated in sidebar.",
    },
  ];
  const [idx, setIdx] = useState(0);
  const [showAi, setShowAi] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShowAi(true), 900);
    const t2 = setTimeout(() => {
      setShowAi(false);
      setIdx((i) => (i + 1) % CHATS.length);
    }, 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0.5rem 0",
        flexGrow: 1,
        justifyContent: "center",
        minHeight: 100,
      }}
    >
      <div
        style={{
          alignSelf: "flex-end",
          maxWidth: "80%",
          padding: "0.5rem 0.875rem",
          borderRadius: "12px 12px 4px 12px",
          background: "rgba(59,130,246,0.2)",
          border: "1px solid rgba(59,130,246,0.3)",
          fontSize: 12,
          color: "#93c5fd",
        }}
      >
        {CHATS[idx].user}
      </div>
      {showAi &&
        (() => {
          const AiIcon = CHATS[idx].icon;
          return (
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "90%",
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
                padding: "0.5rem 0.875rem",
                borderRadius: "12px 12px 12px 4px",
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                fontSize: 12,
                color: "#c4b5fd",
                animation: "lp-fade-in 0.4s ease",
              }}
            >
              <AiIcon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{CHATS[idx].ai}</span>
            </div>
          );
        })()}
    </div>
  );
}

const CARDS = [
  {
    title: "Agents That Argue",
    desc: "Reviewer agents can reject work through Band. Real back-and-forth debate — not a linear pipeline.",
    tag: "ORIGINALITY",
    col: 7,
    Diagram: DisagreementDiagram,
  },
  {
    title: "Smart Branching",
    desc: "Flow adapts based on agent output. Dashed edges show conditional paths.",
    tag: "INTELLIGENCE",
    col: 5,
    Diagram: BranchDiagram,
  },
  {
    title: "Build by Voice",
    desc: "Describe your workflow by voice — watch the canvas build itself live.",
    tag: "WOW FACTOR",
    col: 5,
    Diagram: VoiceDiagram,
  },
  {
    title: "AI That Builds For You",
    desc: "Chat to add nodes, fix errors, and build entire flows automatically.",
    tag: "MAGIC",
    col: 7,
    Diagram: AIChatDiagram,
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      style={{ background: "#000", padding: "7rem 1.5rem" }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="font-heading"
          style={{
            fontSize: "clamp(2.5rem,6vw,4.5rem)",
            color: "#fff",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            textAlign: "center",
            marginBottom: "3.5rem",
          }}
        >
          Three features nobody else has
        </motion.h2>

        <style>{`@media(max-width:768px){.feat-item{grid-column:span 12 !important;}}`}</style>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12,1fr)",
            gap: "1.25rem",
          }}
        >
          {CARDS.map((card, i) => {
            const { Diagram } = card;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="liquid-glass feat-item"
                style={{
                  gridColumn: `span ${card.col}`,
                  borderRadius: "1.75rem",
                  padding: "2rem",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 360,
                }}
              >
                <Diagram />
                <div style={{ marginTop: "auto" }}>
                  <h3
                    className="font-heading"
                    style={{
                      fontSize: "clamp(1.5rem,3vw,2rem)",
                      color: "#fff",
                      marginBottom: 8,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13.5,
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.65,
                      marginBottom: "1rem",
                    }}
                  >
                    {card.desc}
                  </p>
                  <div
                    className="liquid-glass"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 9999,
                      padding: "4px 12px",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    {card.tag}
                    <span style={{ display: "inline-flex", gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <StarIcon
                          key={idx}
                          size={10}
                          fill="#fbbf24"
                          stroke="#fbbf24"
                        />
                      ))}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
