/**
 * Haptic field — chaotic static at peak, 60 BPM lub-dub as curve decays.
 */
(function (global) {
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

  function HapticEngine() {
    this.timer = null;
    this.getState = null;
    this.lastBeat = 0;
  }

  HapticEngine.prototype.start = function start(getState) {
    this.getState = getState;
    this.lastBeat = 0;
    this.stopTimer();
    const self = this;
    this.timer = window.setInterval(function () {
      self.tick();
    }, 90);
  };

  HapticEngine.prototype.tick = function tick() {
    if (!this.getState) return;
    const state = this.getState();
    const chaos = state.chaos;
    const heartbeat = state.heartbeat;
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
  };

  HapticEngine.prototype.pause = function pause() {
    this.stopTimer();
    this.timer = window.setInterval(function () {
      vibrate(30);
    }, 1800);
  };

  HapticEngine.prototype.resume = function resume() {
    if (!this.getState) return;
    this.start(this.getState);
  };

  HapticEngine.prototype.complete = function complete() {
    this.stopTimer();
    vibrate([120, 880, 120, 880, 120]);
  };

  HapticEngine.prototype.stop = function stop() {
    this.stopTimer();
    this.getState = null;
    if (canVibrate()) {
      try {
        navigator.vibrate(0);
      } catch {
        /* ignore */
      }
    }
  };

  HapticEngine.prototype.stopTimer = function stopTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  };

  global.SurgeHaptics = HapticEngine;
})(typeof window !== 'undefined' ? window : globalThis);
