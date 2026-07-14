"use client";

import { motion } from "framer-motion";
import {
  DoorOpenIcon,
  MessagesSquareIcon,
  RadioIcon,
  UsersIcon,
} from "lucide-react";

const POINTS = [
  {
    icon: DoorOpenIcon,
    title: "One Band room per run",
    desc: "Any workflow execution with at least one AI node spins up a dedicated Band.ai room via the Band API, named after the workflow and execution id — created fresh every run.",
  },
  {
    icon: UsersIcon,
    title: "11 node types speak through it",
    desc: "OpenAI, Llama, Gemma, Mistral, and Qwen agents, plus AI Agent, AI Chain, Summarizer, Text Classifier, Info Extractor, and the Autonomous Search Agent all post their output into the same room, under their own name.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Shared context, not parallel silos",
    desc: "Because every agent posts to the same room, later nodes in the workflow inherit what earlier agents already said. That's the actual coordination — not five isolated API calls stitched together after the fact.",
  },
  {
    icon: RadioIcon,
    title: "Live in the product, not just logs",
    desc: "The execution page polls the Band room every 1.5 seconds and renders it as a live chat feed, so you watch agents hand off work to each other while the workflow is still running.",
  },
];

export default function BandHowSection() {
  return (
    <section
      style={{ background: "rgb(var(--lp-paper))", padding: "7rem 1.5rem" }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(var(--lp-ink),0.45)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            // Under the hood
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2.5rem,6vw,4.5rem)",
              color: "rgb(var(--lp-ink))",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            How Kryptonite actually uses Band
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: "1.25rem",
          }}
        >
          {POINTS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              className="liquid-glass"
              style={{ borderRadius: "1.5rem", padding: "1.75rem 1.5rem" }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.12))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <item.icon size={20} style={{ color: "#3b82f6" }} />
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "rgb(var(--lp-ink))",
                  marginBottom: 6,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontSize: 13.5,
                  color: "rgba(var(--lp-ink),0.65)",
                  lineHeight: 1.65,
                }}
              >
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
