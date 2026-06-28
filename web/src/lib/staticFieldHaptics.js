/**
 * Chaotic static haptics at peak, lub-dub as curve decays.
 * Ported from site/js/engine-haptics.js.
 */

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function vibrate(pattern) {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

export class StaticFieldHaptics {
  constructor() {
    this.timer = null;
    /** @type {(() => { chaos: number, heartbeat: number }) | null} */
    this.getState = null;
    this.lastBeat = 0;
    this.pauseTimer = null;
  }

  ack() {
    vibrate(12);
  }

  /** @param {() => { chaos: number, heartbeat: number }} getState */
  start(getState) {
    this.getState = getState;
    this.lastBeat = 0;
    this.stopTimer();
    this.timer = window.setInterval(() => this.tick(), 90);
  }

  tick() {
    if (!this.getState) return;
    const state = this.getState();
    const { chaos, heartbeat } = state;
    const now = performance.now();

    if (chaos > 0.45) {
      const a = 8 + Math.floor(Math.random() * 30 * chaos);
      const b = 6 + Math.floor(Math.random() * 20 * chaos);
      vibrate([a, 10, b]);
      return;
    }

    const beatInterval = 1000;
    if (now - this.lastBeat >= beatInterval) {
      this.lastBeat = now;
      const weight = 40 + Math.round(60 * heartbeat);
      vibrate([weight, 80, Math.round(weight * 1.4)]);
    }
  }

  pause() {
    this.stopTimer();
    this.timer = window.setInterval(() => vibrate(30), 1800);
  }

  resume() {
    if (!this.getState) return;
    this.start(this.getState);
  }

  complete() {
    this.stopTimer();
    vibrate([120, 880, 120, 880, 120]);
  }

  stop() {
    this.stopTimer();
    this.getState = null;
    if (canVibrate()) {
      try {
        navigator.vibrate(0);
      } catch {
        /* ignore */
      }
    }
  }

  stopTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
