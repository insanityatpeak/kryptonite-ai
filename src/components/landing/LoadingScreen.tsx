"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const WORDS = ["Build", "Connect", "Deploy", "Automate"];

export default function LoadingScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [count, setCount] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);
  const doneRef = useRef(false);
  const completeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const DURATION = 2700;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      setCount(Math.round(p * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        completeTimerRef.current = window.setTimeout(onComplete, 400);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (completeTimerRef.current !== null) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, [onComplete]);

  useEffect(() => {
    const t = setInterval(() => setWordIdx((i) => (i + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "2rem",
          left: "2rem",
          fontFamily: '"Instrument Serif", serif',
          fontStyle: "italic",
          fontSize: "0.7rem",
          color: "rgba(17,24,39,0.55)",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}
      >
        Kryptonite
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={wordIdx}
          initial={{ y: 24, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -24, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            fontFamily: '"Instrument Serif", serif',
            fontStyle: "italic",
            fontSize: "clamp(4rem, 14vw, 10rem)",
            color: "#111827",
            lineHeight: 1,
            position: "absolute",
            userSelect: "none",
          }}
        >
          {WORDS[wordIdx]}
        </motion.div>
      </AnimatePresence>

      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
          fontFamily: '"Instrument Serif", serif',
          fontStyle: "italic",
          fontSize: "clamp(4.5rem, 14vw, 10rem)",
          color: "#111827",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {String(count).padStart(3, "0")}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "rgba(17,24,39,0.08)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${count}%`,
            background: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            boxShadow: "0 0 8px rgba(59,130,246,0.5)",
            transition: "width 30ms linear",
          }}
        />
      </div>
    </div>
  );
}
