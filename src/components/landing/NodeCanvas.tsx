"use client";

import { useEffect, useRef } from "react";

const NODE_NAMES = [
  "Planner",
  "Engineer",
  "Reviewer",
  "Tester",
  "Writer",
  "Researcher",
  "Analyzer",
  "Publisher",
  "Collector",
  "Validator",
  "Formatter",
  "Reporter",
];
const NODE_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#3b82f6",
  "#8b5cf6",
  "#3b82f6",
  "#8b5cf6",
  "#3b82f6",
  "#8b5cf6",
  "#3b82f6",
  "#8b5cf6",
  "#3b82f6",
  "#8b5cf6",
];

function hexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
    else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  ctx.closePath();
}

export default function NodeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const N = NODE_NAMES.length;
    let rotation = 0;
    const dots: {
      from: number;
      to: number;
      progress: number;
      speed: number;
    }[] = [];
    for (let i = 0; i < 8; i++) {
      dots.push({
        from: i % N,
        to: (i + 1) % N,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.004,
      });
    }

    let t = 0,
      raf: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      rotation += 0.0006;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.35;

      const positions = NODE_NAMES.map((_, i) => {
        const angle = (i / N) * Math.PI * 2 + rotation;
        return {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        };
      });

      // Lines between adjacent nodes
      for (let i = 0; i < N; i++) {
        const a = positions[i];
        const b = positions[(i + 1) % N];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross lines (every 2nd)
      for (let i = 0; i < N; i += 2) {
        const a = positions[i];
        const b = positions[(i + 4) % N];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(59,130,246,0.04)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Moving dots
      for (const d of dots) {
        d.progress += d.speed;
        if (d.progress >= 1) {
          d.progress = 0;
          d.from = d.to;
          d.to = (d.to + 1) % N;
        }
        const a = positions[d.from];
        const b = positions[d.to];
        const x = a.x + (b.x - a.x) * d.progress;
        const y = a.y + (b.y - a.y) * d.progress;
        const col = NODE_COLORS[d.from];
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.shadowBlur = 8;
        ctx.shadowColor = col;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Nodes
      positions.forEach((pos, i) => {
        const col = NODE_COLORS[i];
        const pulse = 10 + Math.sin(t * 0.025 + i * 0.8) * 2;

        // Glow
        ctx.shadowBlur = 18;
        ctx.shadowColor = col;
        hexagon(ctx, pos.x, pos.y, pulse);
        ctx.fillStyle = col + "20";
        ctx.fill();
        ctx.strokeStyle = col + "80";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = "9px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText(NODE_NAMES[i], pos.x, pos.y + pulse + 14);
      });

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.45,
      }}
    />
  );
}
