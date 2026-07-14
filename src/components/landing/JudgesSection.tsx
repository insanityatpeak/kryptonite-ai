"use client";

import { motion } from "framer-motion";

const POINTS = [
  {
    title: "Track fit",
    desc: "The submission directly matches the event theme: practical multi-agent workflows that coordinate through Band.",
  },
  {
    title: "Prototype clarity",
    desc: "Judges can understand the app quickly because the homepage, demo, and workflow language all tell the same story.",
  },
  {
    title: "Presentation value",
    desc: "The site now frames the required video presentation and pitch deck as part of the product, not an afterthought.",
  },
  {
    title: "Polish",
    desc: "A lighter UI, stronger contrast, and friendlier section flow make the product feel finished and credible.",
  },
];

export default function JudgesSection() {
  return (
    <section style={{ background: "#fff", padding: "7rem 1.5rem" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
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
            // Why this stands out
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2.5rem,6vw,4.5rem)",
              color: "#111827",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            Built to feel like a winner
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
              style={{
                borderRadius: "1.5rem",
                padding: "1.5rem",
                minHeight: 180,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  marginBottom: 14,
                }}
              />
              <h3
                className="font-heading"
                style={{
                  fontSize: "1.6rem",
                  color: "#111827",
                  marginBottom: 8,
                  fontStyle: "normal",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  color: "rgba(17,24,39,0.68)",
                  lineHeight: 1.7,
                  fontSize: 14.5,
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
