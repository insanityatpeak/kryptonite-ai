"use client";

import { useEffect, useRef } from "react";

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const enabledRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    if (
      reducedMotion.matches ||
      coarsePointer.matches ||
      window.innerWidth < 900
    ) {
      enabledRef.current = false;
      return;
    }
    enabledRef.current = true;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["255,255,255", "59,130,246", "139,92,246"];
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.4,
      base: Math.random() * 0.4 + 0.08,
      color: COLORS[Math.floor(Math.random() * 3)],
      ps: Math.random() * 0.02 + 0.008,
      po: Math.random() * Math.PI * 2,
    }));

    let t = 0,
      raf: number;
    const draw = () => {
      if (!enabledRef.current) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      for (const p of pts) {
        p.x = (p.x + p.vx + canvas.width) % canvas.width;
        p.y = (p.y + p.vy + canvas.height) % canvas.height;
        const op = Math.max(
          0.02,
          Math.min(0.7, p.base + Math.sin(t * p.ps + p.po) * 0.2),
        );
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${op})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      enabledRef.current = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
}
