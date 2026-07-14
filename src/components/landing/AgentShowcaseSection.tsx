"use client";

import { motion } from "framer-motion";
import {
  BarChart3Icon,
  BrainIcon,
  CalendarIcon,
  HandshakeIcon,
  MailIcon,
  SearchIcon,
} from "lucide-react";

const AGENTS = [
  {
    icon: SearchIcon,
    name: "Search Agent",
    desc: "Finds anything across every connected app in seconds",
  },
  {
    icon: BrainIcon,
    name: "Research Agent",
    desc: "Digs deeper, cross-references sources, builds context",
  },
  {
    icon: BarChart3Icon,
    name: "Reporting Agent",
    desc: "Turns scattered data into a finished report",
  },
  {
    icon: MailIcon,
    name: "Email Agent",
    desc: "Triages, drafts, and follows up on your behalf",
  },
  {
    icon: CalendarIcon,
    name: "Scheduling Agent",
    desc: "Tracks commitments and surfaces what needs attention",
  },
  {
    icon: HandshakeIcon,
    name: "CRM Agent",
    desc: "Flags stale leads and clients overdue for follow-up",
  },
];

export default function AgentShowcaseSection() {
  return (
    <section
      style={{
        background: "#fafafa",
        padding: "7rem 1.5rem",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(17,24,39,0.45)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            // A Team Of Agents, On Call
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2.2rem,6vw,4rem)",
              color: "#111827",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            One search bar.
            <br />
            <span className="accent-gradient-text">
              Six agents working for you.
            </span>
          </h2>
        </motion.div>

        <div
          className="agent-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: "1.25rem",
          }}
        >
          <style>{`@media(max-width:900px){.agent-grid{grid-template-columns:1fr 1fr !important;}}@media(max-width:560px){.agent-grid{grid-template-columns:1fr !important;}}`}</style>
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.08,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              className="liquid-glass"
              style={{ borderRadius: "1.25rem", padding: "1.75rem 1.5rem" }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "0.9rem",
                  background:
                    "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(139,92,246,0.12))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <agent.icon size={22} style={{ color: "#3b82f6" }} />
              </div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                {agent.name}
              </p>
              <p
                style={{
                  fontSize: 13.5,
                  color: "rgba(17,24,39,0.6)",
                  lineHeight: 1.6,
                }}
              >
                {agent.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: 13,
            color: "rgba(17,24,39,0.5)",
          }}
        >
          All coordinating in real time, through Band rooms, to answer one
          request.
        </motion.p>
      </div>
    </section>
  );
}
