"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const scrollToSection = (id: string) => {
  if (typeof document === "undefined") return;
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: { label: string; target?: string; href?: string }[] = [
    { label: "Universal Search", target: "universal-search" },
    { label: "Workflow", target: "how-it-works" },
    { label: "Band", target: "band" },
    { label: "Integrations", target: "integrations" },
    { label: "Demo", href: "/demo" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "1.25rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "padding 0.3s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: "80rem",
          background: scrolled
            ? "rgba(255,255,255,0.88)"
            : "rgba(255,255,255,0.74)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: 9999,
          padding: "0.5rem 0.5rem 0.5rem 1rem",
          boxShadow: scrolled
            ? "0 10px 30px rgba(15,23,42,0.08), inset 0 1px 1px rgba(255,255,255,0.9)"
            : "0 8px 24px rgba(15,23,42,0.04)",
          transition: "box-shadow 0.3s, background 0.3s",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 9999,
            padding: "1.4px",
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.35) 100%)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
          }}
        />

        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              boxShadow: "0 0 20px rgba(59,130,246,0.5)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="18"
              height="18"
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
            style={{ fontSize: 20, color: "#111827", letterSpacing: "0.05em" }}
          >
            KRYPTONITE
          </span>
        </Link>

        <span
          className="hidden lg:inline-flex"
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(17,24,39,0.5)",
            border: "1px solid rgba(17,24,39,0.12)",
            borderRadius: 9999,
            padding: "0.3rem 0.7rem",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Powered by Band.ai
        </span>

        <div
          style={{ display: "flex", alignItems: "center", gap: 2 }}
          className="hidden md:flex"
        >
          {navItems.map((item) =>
            item.target ? (
              <button
                key={item.label}
                type="button"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(17,24,39,0.68)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.45rem 0.875rem",
                  borderRadius: 9999,
                  transition: "color 0.15s, background 0.15s",
                }}
                onClick={() => item.target && scrollToSection(item.target)}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#111827";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(15,23,42,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(17,24,39,0.68)";
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                {item.label}
              </button>
            ) : (
              <a
                key={item.label}
                href={item.href}
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(17,24,39,0.62)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.45rem 0.875rem",
                  borderRadius: 9999,
                  transition: "color 0.15s, background 0.15s",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#111827";
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(15,23,42,0.04)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "rgba(17,24,39,0.62)";
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                {item.label}
              </a>
            ),
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Link
            href="/login"
            style={{
              fontSize: 13,
              color: "rgba(17,24,39,0.55)",
              textDecoration: "none",
              padding: "0.45rem 0.875rem",
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              padding: "0.6rem 1.25rem",
              borderRadius: 9999,
              background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
              boxShadow: "0 0 20px rgba(59,130,246,0.25)",
              whiteSpace: "nowrap",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1.04)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "scale(1)";
            }}
          >
            Get Started →
          </Link>
        </div>
      </div>
    </nav>
  );
}
