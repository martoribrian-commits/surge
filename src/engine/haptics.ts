/*
 * The Haptic Brand.
 *
 * Surge does not use standard notification buzzes. At the peak it is sharp,
 * chaotic static; as the curve decays it resolves into a heavy, resonant
 * 60 BPM heartbeat thud (lub-dub). Driven off a fixed scheduler that reads
 * the live curve state each tick.
 *
 * Note: the Web Vibration API is a no-op on most desktop browsers and on
 * iOS Safari. On supported hardware (Android/Chrome) the Taptic-style
 * weight comes through. Everything is guarded so it degrades silently.
 */

import type { CurveState } from "./curve";

function canVibrate(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

function vibrate(pattern: number | number[]): void {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore unsupported patterns.
  }
}

export class HapticEngine {
  private timer: number | null = null;
  private getState: (() => CurveState) | null = null;
  private lastBeat = 0;
  private tickMs = 90;

  get supported(): boolean {
    return canVibrate();
  }

  start(getState: () => CurveState): void {
    this.getState = getState;
    this.lastBeat = 0;
    this.stopTimer();
    this.timer = window.setInterval(() => this.tick(), this.tickMs);
  }

  private tick(): void {
    if (!this.getState) return;
    const { chaos, heartbeat } = this.getState();
    const now = performance.now();

    if (chaos > 0.45) {
      // Chaotic static: short, irregular bursts.
      const a = 8 + Math.floor(Math.random() * 30 * chaos);
      const b = 6 + Math.floor(Math.random() * 20 * chaos);
      vibrate([a, 10, b]);
      return;
    }

    // 60 BPM heavy heartbeat (lub-dub), scaled by heartbeat strength.
    const beatInterval = 1000; // 60 BPM
    if (now - this.lastBeat >= beatInterval) {
      this.lastBeat = now;
      const weight = 40 + Math.round(60 * heartbeat);
      vibrate([weight, 80, Math.round(weight * 1.4)]);
    }
  }

  /** Dead-man's switch: a slow, gentle pulse that waits for the user. */
  pause(): void {
    this.stopTimer();
    this.timer = window.setInterval(() => vibrate(30), 1800);
  }

  resume(): void {
    if (!this.getState) return;
    this.start(this.getState);
  }

  /** Three final, deliberate thuds. */
  complete(): void {
    this.stopTimer();
    vibrate([120, 880, 120, 880, 120]);
  }

  stop(): void {
    this.stopTimer();
    this.getState = null;
    if (canVibrate()) {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
