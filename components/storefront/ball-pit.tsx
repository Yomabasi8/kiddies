"use client";

import { useEffect, useRef } from "react";

/**
 * Interactive ball pit. Glossy balls and rings drop in one after another
 * when the pit scrolls into view, pile up with simple verlet physics, get
 * shoved around by the pointer, and tapping drops in a few more.
 *
 * Decorative only (aria-hidden). With reduced motion the pile is
 * pre-settled and drawn once, with no animation or interaction.
 */

type Kind = "ball" | "ring";
type Ball = { x: number; y: number; px: number; py: number; r: number; fill: string; kind: Kind };

const PALETTE = [
  { fill: "#EF6F6C", kind: "ball" },
  { fill: "#F2B040", kind: "ball" },
  { fill: "#4FB3A5", kind: "ball" },
  { fill: "#7B6CF6", kind: "ball" },
  { fill: "#FFFFFF", kind: "ball" },
  { fill: "#1B1B1B", kind: "ball" },
  { fill: "#086F54", kind: "ball" },
  { fill: "#7B6CF6", kind: "ring" },
  { fill: "#EF6F6C", kind: "ring" },
  { fill: "#1B1B1B", kind: "ring" },
] as const;

const GRAVITY = 1800; // px/s²
const STEP = 1 / 120;
const ITERATIONS = 3;

export function BallPit({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const balls: Ball[] = [];
    let width = 0;
    let height = 0;
    let target = 0;
    let spawned = 0;
    let raf = 0;
    let spawnTimer: ReturnType<typeof setInterval> | undefined;
    let running = false;
    let started = false;
    let visible = false;
    let calmFrames = 0;
    const pointer = { x: -9999, y: -9999, vx: 0, vy: 0, active: false };

    const scale = () => Math.max(0.55, Math.min(1, width / 1280));

    function makeBall(x?: number, y?: number): Ball {
      const p = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const r = (20 + Math.random() * 30) * scale();
      const bx = x ?? r + Math.random() * (width - r * 2);
      const by = y ?? -r - Math.random() * 40;
      const drift = (Math.random() - 0.5) * 2;
      return { x: bx, y: by, px: bx - drift, py: by, r, fill: p.fill, kind: p.kind };
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Fill roughly the bottom 40% of the canvas.
      const avgArea = Math.PI * Math.pow(33 * scale(), 2);
      target = Math.round((width * height * 0.42) / avgArea);
      for (const b of balls) b.x = Math.min(Math.max(b.x, b.r), width - b.r);
      draw();
    }

    function step(dt: number) {
      const g = GRAVITY * dt * dt;
      for (const b of balls) {
        const vx = (b.x - b.px) * 0.992;
        const vy = (b.y - b.py) * 0.992;
        b.px = b.x;
        b.py = b.y;
        b.x += vx;
        b.y += vy + g;
      }

      for (let k = 0; k < ITERATIONS; k++) {
        // Ball-ball collisions, heavier (bigger) balls move less.
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i];
          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const min = a.r + b.r;
            const d2 = dx * dx + dy * dy;
            if (d2 >= min * min || d2 === 0) continue;
            const d = Math.sqrt(d2);
            const overlap = (min - d) / d;
            const ma = a.r * a.r;
            const mb = b.r * b.r;
            const ta = mb / (ma + mb);
            const tb = ma / (ma + mb);
            a.x -= dx * overlap * ta;
            a.y -= dy * overlap * ta;
            b.x += dx * overlap * tb;
            b.y += dy * overlap * tb;
          }
        }

        // Walls and floor, with a little bounce.
        for (const b of balls) {
          if (b.y + b.r > height) {
            const vy = b.y - b.py;
            b.y = height - b.r;
            b.py = b.y + vy * 0.35;
          }
          if (b.x - b.r < 0) {
            const vx = b.x - b.px;
            b.x = b.r;
            b.px = b.x + vx * 0.5;
          } else if (b.x + b.r > width) {
            const vx = b.x - b.px;
            b.x = width - b.r;
            b.px = b.x + vx * 0.5;
          }
        }
      }

      // Pointer shove.
      if (pointer.active) {
        for (const b of balls) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const reach = b.r + 40;
          const d2 = dx * dx + dy * dy;
          if (d2 < reach * reach && d2 > 0) {
            const d = Math.sqrt(d2);
            const push = (reach - d) / reach;
            b.x += (dx / d) * push * 6 + pointer.vx * 0.15 * push;
            b.y += (dy / d) * push * 6 + pointer.vy * 0.15 * push;
          }
        }
      }
    }

    function drawBall(b: Ball) {
      ctx!.beginPath();
      if (b.kind === "ring") {
        ctx!.arc(b.x, b.y, b.r * 0.82, 0, Math.PI * 2);
        ctx!.lineWidth = b.r * 0.36;
        ctx!.strokeStyle = b.fill;
        ctx!.stroke();
        return;
      }
      ctx!.arc(b.x, b.y, b.r - 1.5, 0, Math.PI * 2);
      ctx!.fillStyle = b.fill;
      ctx!.fill();
      ctx!.lineWidth = 3;
      ctx!.strokeStyle = "#1B1B1B";
      ctx!.stroke();
      // Glossy highlight
      ctx!.beginPath();
      ctx!.arc(b.x - b.r * 0.38, b.y - b.r * 0.38, b.r * 0.2, 0, Math.PI * 2);
      ctx!.fillStyle = b.fill === "#FFFFFF" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.55)";
      ctx!.fill();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const b of balls) drawBall(b);
    }

    let last = 0;
    let acc = 0;
    function frame(t: number) {
      const dt = last ? Math.min((t - last) / 1000, 1 / 20) : STEP;
      last = t;
      acc += dt;
      let energy = 0;
      while (acc >= STEP) {
        step(STEP);
        acc -= STEP;
      }
      for (const b of balls) energy += Math.abs(b.x - b.px) + Math.abs(b.y - b.py);
      draw();

      // Sleep when everything has settled and nothing is happening.
      calmFrames = energy / Math.max(balls.length, 1) < 0.02 && !pointer.active && spawned >= target ? calmFrames + 1 : 0;
      if (calmFrames > 60 || !visible) {
        running = false;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function wake() {
      if (running || reduceMotion) return;
      running = true;
      calmFrames = 0;
      raf = requestAnimationFrame(frame);
    }

    function startDropping() {
      if (started) return;
      started = true;
      spawnTimer = setInterval(() => {
        if (spawned >= target) {
          clearInterval(spawnTimer);
          return;
        }
        balls.push(makeBall());
        spawned++;
        wake();
      }, 55);
    }

    resize();

    if (reduceMotion) {
      // Pre-settle a static pile and draw it once.
      for (let i = 0; i < target; i++) balls.push(makeBall(undefined, height - Math.random() * height * 0.8));
      for (let i = 0; i < 600; i++) step(STEP);
      spawned = target;
      draw();
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduceMotion) {
          startDropping();
          wake();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
      wake();
    });
    ro.observe(canvas);

    function localPoint(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    function onMove(e: PointerEvent) {
      const p = localPoint(e);
      pointer.vx = p.x - pointer.x;
      pointer.vy = p.y - pointer.y;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = true;
      wake();
    }
    function onLeave() {
      pointer.active = false;
      pointer.x = pointer.y = -9999;
    }
    function onDown(e: PointerEvent) {
      if (reduceMotion) return;
      const p = localPoint(e);
      for (let i = 0; i < 3; i++) {
        balls.push(makeBall(Math.min(Math.max(p.x + (i - 1) * 30, 30), width - 30), -40 - i * 50));
      }
      // Keep the pile from overflowing: retire the oldest extras.
      while (balls.length > target * 1.35) balls.shift();
      wake();
    }

    if (!reduceMotion) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
      canvas.addEventListener("pointerdown", onDown);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(spawnTimer);
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
