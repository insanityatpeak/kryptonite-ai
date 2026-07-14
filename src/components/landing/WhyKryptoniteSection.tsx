"use client";

import { motion } from "framer-motion";

const ROWS = [
  {
    other: "Search one app at a time",
    kryptonite: "Search every connected app at once",
  },
  {
    other: "Manual filtering and copy-pasting",
    kryptonite: "Understands context and intent automatically",
  },
  {
    other: "Manual reporting, spreadsheet by spreadsheet",
    kryptonite: "Generates insights and reports instantly",
  },
  {
    other: "You have to remember where things are",
    kryptonite: "Remembers every interaction for you",
  },
  {
    other: "You take every action yourself",
    kryptonite: "Takes action automatically when authorized",
  },
];

export default function WhyKryptoniteSection() {
  return (
    <section
      style={{ background: "#fff", padding: "7rem 1.5rem", overflow: "hidden" }}
    >
      <div style={{ maxWidth: "64rem", margin: "0 auto" }}>
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
            // Why Kryptonite
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
            Other tools search.
            <br />
            <span className="accent-gradient-text">
              Kryptonite understands.
            </span>
          </h2>
        </motion.div>

        <div
          className="liquid-glass-strong"
          style={{
            borderRadius: "1.5rem",
            padding: "0.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              padding: "0.75rem 1.5rem",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(17,24,39,0.4)",
            }}
          >
            <span>Current tools</span>
            <span className="accent-gradient-text">Kryptonite</span>
          </div>

          {ROWS.map((row, i) => (
            <motion.div
              key={row.other}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                padding: "1.1rem 1.5rem",
                borderTop: "1px solid rgba(17,24,39,0.06)",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <span
                  style={{
                    color: "#ef4444",
                    fontSize: 14,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✕
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(17,24,39,0.55)",
                    lineHeight: 1.5,
                  }}
                >
                  {row.other}
                </span>
              </div>
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
              >
                <span
                  style={{
                    color: "#16a34a",
                    fontSize: 14,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ✓
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: "#111827",
                    fontWeight: 500,
                    lineHeight: 1.5,
                  }}
                >
                  {row.kryptonite}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
