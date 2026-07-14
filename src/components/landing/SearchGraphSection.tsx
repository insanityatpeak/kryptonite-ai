"use client";

import { motion } from "framer-motion";
import { Building2Icon, FolderIcon } from "lucide-react";

const APPS = [
  { label: "Gmail", icon: "/logos/email.svg", angle: 0 },
  { label: "WhatsApp", icon: "/logos/whatsapp.svg", angle: 51.4 },
  { label: "Slack", icon: "/logos/slack.svg", angle: 102.8 },
  { label: "Notion", icon: "/logos/notion.svg", angle: 154.2 },
  { label: "Drive", icon: FolderIcon, angle: 205.6 },
  { label: "CRM", icon: Building2Icon, angle: 257 },
  { label: "GitHub", icon: "/logos/github.svg", angle: 308.4 },
];

const RADIUS = 190;

export default function SearchGraphSection() {
  return (
    <section
      id="universal-search"
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
            // One Agent, Every App
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: "clamp(2.2rem,6vw,4.2rem)",
              color: "#111827",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            Your AI agent
            <br />
            <span className="accent-gradient-text">across every app.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 560,
            height: 480,
            margin: "0 auto",
          }}
        >
          {/* Orbit ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: RADIUS * 2,
              height: RADIUS * 2,
              marginLeft: -RADIUS,
              marginTop: -RADIUS,
              borderRadius: "50%",
              border: "1px dashed rgba(59,130,246,0.25)",
            }}
          />

          {/* Connecting lines */}
          <svg
            viewBox="0 0 480 480"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              overflow: "visible",
            }}
          >
            {APPS.map((app) => {
              const rad = (app.angle * Math.PI) / 180;
              const x =
                240 + RADIUS * Math.cos(rad) * (480 / (RADIUS * 2 + 100));
              const y =
                240 + RADIUS * Math.sin(rad) * (480 / (RADIUS * 2 + 100));
              return (
                <line
                  key={app.label}
                  x1={240}
                  y1={240}
                  x2={x}
                  y2={y}
                  stroke="rgba(59,130,246,0.35)"
                  strokeWidth={1.5}
                  strokeDasharray="6 6"
                  className="lp-dash-flow"
                />
              );
            })}
          </svg>

          {/* Orbiting app nodes */}
          <div
            className="lp-orbit"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: RADIUS * 2,
              height: RADIUS * 2,
              marginLeft: -RADIUS,
              marginTop: -RADIUS,
              animationDuration: "40s",
            }}
          >
            {APPS.map((app) => {
              const rad = (app.angle * Math.PI) / 180;
              const x = RADIUS + RADIUS * Math.cos(rad);
              const y = RADIUS + RADIUS * Math.sin(rad);
              return (
                <div
                  key={app.label}
                  className="lp-orbit-reverse liquid-glass-strong"
                  style={{
                    position: "absolute",
                    left: x - 38,
                    top: y - 38,
                    width: 76,
                    height: 76,
                    borderRadius: "1.1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    animationDuration: "40s",
                  }}
                >
                  {typeof app.icon === "string" ? (
                    <img
                      src={app.icon}
                      alt={app.label}
                      width={22}
                      height={22}
                      style={{ objectFit: "contain", borderRadius: 4 }}
                    />
                  ) : (
                    <app.icon size={22} style={{ color: "#3b82f6" }} />
                  )}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(17,24,39,0.65)",
                    }}
                  >
                    {app.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Kryptonite AI center */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 132,
              height: 132,
              marginLeft: -66,
              marginTop: -66,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              boxShadow: "0 0 60px rgba(99,102,241,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              zIndex: 10,
            }}
            className="lp-pulse-glow"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="26"
              height="26"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" />
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="2" y1="7" x2="22" y2="17" />
              <line x1="22" y1="7" x2="2" y2="17" />
            </svg>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              Kryptonite AI
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
