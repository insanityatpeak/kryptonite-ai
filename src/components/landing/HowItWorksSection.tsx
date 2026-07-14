"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    emoji: "Drag",
    title: "Drag Agents",
    desc: "Add unlimited AI agent nodes to the infinite visual canvas",
  },
  {
    n: "02",
    emoji: "Role",
    title: "Set Roles",
    desc: "Give each agent a role in plain English - no code required",
  },
  {
    n: "03",
    emoji: "Flow",
    title: "Draw Flow",
    desc: "Connect agents with arrows and add conditional branches",
  },
  {
    n: "04",
    emoji: "Run",
    title: "Launch",
    desc: "Agents join Band rooms and start collaborating instantly",
  },
  {
    n: "05",
    emoji: "Done",
    title: "Get Results",
    desc: "Watch agents debate and deliver production-ready output",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      style={{ background: "#fff", padding: "7rem 1.5rem", overflow: "hidden" }}
    >
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ textAlign: "center", marginBottom: "4rem" }}
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
            // How Kryptonite Works
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2.5rem,7vw,5rem)",
              color: "#111827",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              marginBottom: "0.75rem",
            }}
          >
            From idea to running AI team
          </h2>
          <p
            className="font-heading accent-gradient-text"
            style={{
              fontSize: "clamp(1.5rem,4vw,2.5rem)",
              letterSpacing: "-0.02em",
            }}
          >
            in 60 seconds.
          </p>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: "1rem",
            position: "relative",
          }}
        >
          <style>{`@media(max-width:768px){.how-steps{grid-template-columns:1fr 1fr !important;}}`}</style>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{ position: "relative" }}
            >
              <div
                className="liquid-glass"
                style={{
                  borderRadius: "1.25rem",
                  padding: "1.75rem 1.25rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <p
                  className="font-heading accent-gradient-text"
                  style={{
                    fontSize: "2.25rem",
                    lineHeight: 1,
                    marginBottom: "0.75rem",
                  }}
                >
                  {step.n}
                </p>
                <span
                  style={{
                    fontSize: "1.75rem",
                    marginBottom: "0.75rem",
                    display: "block",
                  }}
                >
                  {step.emoji}
                </span>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: 6,
                  }}
                >
                  {step.title}
                </p>
                <p
                  style={{
                    fontSize: 12.5,
                    color: "rgba(17,24,39,0.58)",
                    lineHeight: 1.6,
                    flexGrow: 1,
                  }}
                >
                  {step.desc}
                </p>
              </div>

              {i < 4 && (
                <div
                  style={{
                    position: "absolute",
                    right: -12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10,
                    width: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 1,
                      background:
                        "linear-gradient(90deg,rgba(59,130,246,0.35),rgba(139,92,246,0.35))",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="lp-marquee accent-gradient"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "200%",
                        height: "100%",
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
