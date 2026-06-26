/*
 * Slow Tech rendering.
 *
 * One function paints the whole field for a given moment. The chaotic peak
 * is a stark, high-contrast amber/white core with a restrained luminance
 * strobe (<= 2.5Hz, low amplitude, disabled under reduced-motion). As the
 * curve decays the strobe morphs into a slow radial blur that expands and
 * contracts on the 60 BPM heartbeat — ink spreading in water.
 */

import { HEARTBEAT_HZ, STROBE_HZ, lerp } from "../engine/curve";

export type Phase = "idle" | "active" | "paused" | "complete" | "handoff";

export interface Ring {
  /** seconds (performance.now()/1000) at which the ring was born */
  born: number;
  strength: number;
}

export interface RenderInput {
  phase: Phase;
  /** continuous clock in seconds, for oscillators */
  t: number;
  progress: number;
  chaos: number;
  heartbeat: number;
  /** 0 -> 1 fade applied during the completion handoff */
  completeFade: number;
  rings: Ring[];
  reducedMotion: boolean;
  width: number;
  height: number;
  dpr: number;
}

function rgb(v: number): string {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${c}, ${c}, ${Math.min(255, c + 2)})`;
}

export function draw(ctx: CanvasRenderingContext2D, input: RenderInput): void {
  const { width: w, height: h, t } = input;
  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);

  // --- Background: true black at the peak, softening to charcoal, then
  // a softer gray during the Heron handoff. ---
  let bgLevel = lerp(0, 28, input.progress);
  bgLevel = lerp(bgLevel, 58, input.completeFade);
  if (input.phase === "idle") bgLevel = 0;
  ctx.fillStyle = rgb(bgLevel);
  ctx.fillRect(0, 0, w, h);

  // --- Heartbeat pulse (60 BPM) drives the radial expand/contract. ---
  const beat = 0.5 + 0.5 * Math.sin(2 * Math.PI * HEARTBEAT_HZ * t);

  // --- Strobe: low-amplitude luminance modulation, peak only. ---
  let strobe = 1;
  if (!input.reducedMotion && input.phase === "active") {
    const s = 0.5 + 0.5 * Math.sin(2 * Math.PI * STROBE_HZ * t);
    strobe = 1 - 0.22 * input.chaos * s;
  }

  // --- Expanding ink rings, spawned on each heartbeat. ---
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const ring of input.rings) {
    const age = t - ring.born;
    const life = 2.6;
    if (age < 0 || age > life) continue;
    const k = age / life;
    const radius = minDim * (0.08 + k * 0.55);
    const alpha = (1 - k) * 0.18 * ring.strength;
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
    grad.addColorStop(0, `rgba(255, 159, 10, 0)`);
    grad.addColorStop(0.85, `rgba(255, 180, 70, ${alpha})`);
    grad.addColorStop(1, `rgba(255, 159, 10, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // --- Core glow: amber/white energy that calms into a warm pulse. ---
  let coreAlpha: number;
  let coreRadius: number;
  let amber: number; // 0 = amber, 1 = white-hot

  if (input.phase === "idle") {
    // A slow, inviting breath. Calm and dim.
    const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / 4));
    coreAlpha = 0.22 + 0.12 * breath;
    coreRadius = minDim * (0.16 + 0.015 * breath);
    amber = 0.15;
  } else if (input.phase === "paused") {
    // Dead-man's switch: gentle pulse, waiting.
    const breath = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / 3));
    coreAlpha = 0.16 + 0.1 * breath;
    coreRadius = minDim * (0.14 + 0.02 * breath);
    amber = 0.1;
  } else {
    const energy = lerp(0.95, 0.45, input.progress);
    coreAlpha = (energy * strobe) * (1 - 0.4 * input.completeFade);
    const pulseAmp = lerp(0.02, 0.14, input.heartbeat);
    coreRadius = minDim * (lerp(0.34, 0.2, input.progress) + pulseAmp * beat);
    amber = input.chaos; // white-hot at the peak, amber as it cools
  }

  const r = 255;
  const g = Math.round(lerp(159, 255, amber));
  const b = Math.round(lerp(10, 255, amber));

  const blur = lerp(0.2, 0.62, input.progress); // softer/blurrier as it decays
  const core = ctx.createRadialGradient(
    cx,
    cy,
    coreRadius * (1 - blur) * 0.4,
    cx,
    cy,
    coreRadius,
  );
  core.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${coreAlpha})`);
  core.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${coreAlpha * 0.45})`);
  core.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  // A small, sharp anchor point at the very center keeps the eye fixed.
  if (input.phase === "active" || input.phase === "paused") {
    const dotAlpha = input.phase === "paused" ? 0.3 : lerp(0.85, 0.4, input.progress);
    ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha * (1 - input.completeFade)})`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, minDim * 0.006), 0, Math.PI * 2);
    ctx.fill();
  }
}
