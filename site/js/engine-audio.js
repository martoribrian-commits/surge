/**
 * Procedural sonic field — white noise carved to sub-bass heartbeat.
 */
(function (global) {
  const { SUB_BASS_HZ } = global.SurgeCurve;

  function createContext() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  }

  function makeNoiseBuffer(ctx) {
    const seconds = 2;
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
    this.endTime = 0;
  }

  AudioEngine.prototype.start = function start(durationMs) {
    if (this.ctx) return;
    const ctx = createContext();
    if (!ctx) return;
    this.ctx = ctx;
    void ctx.resume();

    const now = ctx.currentTime;
    const end = now + durationMs / 1000;
    this.endTime = end;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.9, now + 0.4);
    master.connect(ctx.destination);
    this.master = master;

    const noise = ctx.createBufferSource();
    noise.buffer = makeNoiseBuffer(ctx);
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(16000, now);
    filter.frequency.exponentialRampToValueAtTime(140, end);
    filter.Q.setValueAtTime(0.7, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.04, end);

    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start(now);
    this.noise = noise;
    this.noiseGain = noiseGain;

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(SUB_BASS_HZ, now);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.05, now);
    subGain.gain.linearRampToValueAtTime(0.6, end);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1, now);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.045, now);
    lfoGain.gain.linearRampToValueAtTime(0.4, end);
    lfo.connect(lfoGain).connect(subGain.gain);

    sub.connect(subGain).connect(master);
    sub.start(now);
    lfo.start(now);
    this.sub = sub;
    this.subGain = subGain;
    this.lfo = lfo;
  };

  AudioEngine.prototype.pause = function pause() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.12, now + 0.3);
  };

  AudioEngine.prototype.resume = function resume() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.9, now + 0.3);
  };

  AudioEngine.prototype.complete = function complete() {
    if (!this.ctx || !this.master || !this.noiseGain || !this.subGain) return;
    const now = this.ctx.currentTime;

    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(Math.max(this.noiseGain.gain.value, 0.0001), now);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    const sub = this.subGain.gain;
    sub.cancelScheduledValues(now);
    const base = 0.0001;
    for (let i = 0; i < 3; i++) {
      const beat = now + i;
      sub.setValueAtTime(base, beat);
      sub.exponentialRampToValueAtTime(0.7, beat + 0.18);
      sub.exponentialRampToValueAtTime(base, beat + 0.9);
    }

    const fadeEnd = now + 3.4;
    this.master.gain.cancelScheduledValues(now + 3);
    this.master.gain.setValueAtTime(0.9, now + 3);
    this.master.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
    const self = this;
    window.setTimeout(function () {
      self.stop();
    }, 3600);
  };

  AudioEngine.prototype.stop = function stop() {
    if (!this.ctx) return;
    try {
      if (this.noise) this.noise.stop();
      if (this.sub) this.sub.stop();
      if (this.lfo) this.lfo.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
  };

  global.SurgeAudio = AudioEngine;
})(typeof window !== 'undefined' ? window : globalThis);
