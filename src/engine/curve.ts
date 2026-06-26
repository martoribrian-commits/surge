/*
 * The 90-second curve.
 *
 * Surge maps a single normalized progress value (0 -> 1) onto every
 * sensory channel: visual, audio, and haptic. The session opens at the
 * chaotic peak and decays to baseline. When `progress` reaches 1 the
 * curve has hit 0.0 and the session is complete.
 */

export const DEFAULT_DURATION_MS = 90_000;

/** One beat per second == 60 BPM. The somatic heartbeat. */
export const HEARTBEAT_HZ = 1;

/** Peak strobe rate. Kept at/below ~2.5Hz to avoid photosensitivity. */
export const STROBE_HZ = 2.5;

export const SUB_BASS_HZ = 55; // warm, low.

export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * The shape of every channel at a given moment in the curve.
 * `progress` is elapsed/duration, clamped to [0, 1].
 */
export interface CurveState {
  /** elapsed / duration, clamped to [0, 1]. */
  progress: number;
  /** The decaying curve value shown as "the curve": 1.0 -> 0.0. */
  value: number;
  /**
   * Chaos energy. High at the peak (overwhelm), gone by ~30% in.
   * Drives strobe intensity, white-noise density, and haptic static.
   */
  chaos: number;
  /**
   * Grounded heartbeat strength. Low at the peak, full near baseline.
   * Drives the radial pulse and the sub-bass thud.
   */
  heartbeat: number;
}

export function curveAt(progress: number): CurveState {
  const p = clamp01(progress);

  // Chaos collapses over the first third of the session.
  const chaos = 1 - smoothstep(0, 0.32, p);

  // The heartbeat emerges as the chaos recedes and dominates the tail.
  const heartbeat = smoothstep(0.12, 0.7, p);

  return {
    progress: p,
    value: 1 - p,
    chaos,
    heartbeat,
  };
}
