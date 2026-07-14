"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const MARQUEE_TEXT =
  " BAND OF AGENTS · MULTI-AGENT SOFTWARE DEVELOPMENT · WORKING ONLINE PROTOTYPE · VIDEO PRESENTATION · PITCH DECK · ";

const scrollToSection = (id: string) => {
  if (typeof document === "undefined") return;
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function FooterSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let tween: { kill: () => void } | null = null;
    import("gsap").then(({ gsap }) => {
      if (!trackRef.current) return;
      tween = gsap.to(trackRef.current, {
        xPercent: -50,
        duration: 22,
        ease: "none",
        repeat: -1,
      });
    });
    return () => {
      tween?.kill();
    };
  }, []);

  return (
    <footer
      style={{
        background: "#fff",
        borderTop: "1px solid rgba(17,24,39,0.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "6.5rem 1.5rem 5rem", textAlign: "center" }}>
        <p
          style={{
            fontSize: 11,
            color: "rgba(17,24,39,0.45)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Submission checklist
        </p>
        <h2
          className="font-heading"
          style={{
            fontSize: "clamp(2.8rem,8vw,6rem)",
            color: "#111827",
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
            marginBottom: "1rem",
          }}
        >
          Band of Agents
          <br />
          <span className="accent-gradient-text">track 2 ready</span>
        </h2>
        <p
          style={{
            color: "rgba(17,24,39,0.7)",
            maxWidth: 760,
            margin: "0 auto 2rem",
            lineHeight: 1.7,
          }}
        >
          Band.ai is the coordination layer, not a bolt-on integration: every AI
          agent node in a Kryptonite workflow — GPT-OSS, Llama, Gemma, Mistral,
          Qwen3 — joins a shared Band room for that run, posts its output there,
          and can see what every other agent already said before it acts.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <div
              className="lp-pulse-glow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                padding: "1.05rem 2.25rem",
                background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Start Building Free →
            </div>
          </Link>
          <Link
            href="https://github.com/insanityatpeak/kryptonite-ai"
            target="_blank"
            rel="noreferrer"
            className="liquid-glass"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 9999,
              padding: "1.05rem 2.25rem",
              fontSize: 15,
              fontWeight: 600,
              color: "#111827",
              textDecoration: "none",
            }}
          >
            View on GitHub →
          </Link>
        </div>
      </div>

      <div
        style={{
          overflow: "hidden",
          borderTop: "1px solid rgba(17,24,39,0.08)",
          borderBottom: "1px solid rgba(17,24,39,0.08)",
          padding: "1.25rem 0",
        }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            width: "max-content",
            willChange: "transform",
          }}
        >
          {[MARQUEE_TEXT, MARQUEE_TEXT].map((t, i) => (
            <span
              key={i}
              className="font-heading"
              style={{
                fontSize: "clamp(1.6rem,4vw,3rem)",
                color: "rgba(17,24,39,0.08)",
                whiteSpace: "nowrap",
                padding: "0 2rem",
                letterSpacing: "-0.02em",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="14"
              height="14"
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
          </div>
          <span
            className="font-heading"
            style={{ fontSize: 16, color: "#111827", letterSpacing: "0.05em" }}
          >
            KRYPTONITE
          </span>
        </div>
        <p style={{ fontSize: 12, color: "rgba(17,24,39,0.45)" }}>
          © 2026 Kryptonite AI. Built for the Band of Agents hackathon.
        </p>
        <div
          style={{
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { label: "Track 2", target: "how-it-works" },
            { label: "Band", target: "band" },
            {
              label: "GitHub",
              href: "https://github.com/insanityatpeak/kryptonite-ai",
            },
            { label: "Demo", href: "/demo" },
          ].map((link) =>
            link.target ? (
              <button
                key={link.label}
                type="button"
                style={{
                  fontSize: 12,
                  color: "rgba(17,24,39,0.55)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                onClick={() => scrollToSection(link.target)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#111827")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(17,24,39,0.55)")
                }
              >
                {link.label}
              </button>
            ) : (
              <a
                key={link.label}
                href={link.href}
                target={link.href?.startsWith("http") ? "_blank" : undefined}
                rel={link.href?.startsWith("http") ? "noreferrer" : undefined}
                style={{
                  fontSize: 12,
                  color: "rgba(17,24,39,0.55)",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "#111827")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color =
                    "rgba(17,24,39,0.55)")
                }
              >
                {link.label}
              </a>
            ),
          )}
        </div>
      </div>
    </footer>
  );
}
