/**
 * Procedural sonic field — pink noise carve, 60 BPM sub-bass, 5 BPM breath layer.
 * Real-time sync to curve state each frame.
 */
(function (global) {
  var SUB_BASS_HZ = global.SurgeCurve.SUB_BASS_HZ;
  var BREATH_HZ = global.SurgeCurve.BREATH_HZ;

  function createContext() {
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  }

  function makePinkNoiseBuffer(ctx) {
    var seconds = 2;
    var length = ctx.sampleRate * seconds;
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    var b0 = 0;
    var b1 = 0;
    var b2 = 0;
    var b3 = 0;
    var b4 = 0;
    var b5 = 0;
    var b6 = 0;
    for (var i = 0; i < length; i++) {
      var white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  function AudioEngine() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
    this.breathOsc = null;
    this.breathGain = null;
    this.panner = null;
    this.endTime = 0;
    this.lastPan = 0;
  }

  AudioEngine.prototype.start = function start(durationMs) {
    if (this.ctx) return;
    var ctx = createContext();
    if (!ctx) return;
    this.ctx = ctx;
    void ctx.resume();

    var now = ctx.currentTime;
    this.endTime = now + durationMs / 1000;

    var master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.92, now + 0.45);
    master.connect(ctx.destination);
    this.master = master;

    var panner = ctx.createStereoPanner();
    panner.pan.setValueAtTime(0, now);
    panner.connect(master);
    this.panner = panner;

    var noise = ctx.createBufferSource();
    noise.buffer = makePinkNoiseBuffer(ctx);
    noise.loop = true;

    var filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(14000, now);
    filter.Q.setValueAtTime(0.65, now);
    this.noiseFilter = filter;

    var noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.62, now);
    this.noiseGain = noiseGain;

    noise.connect(filter).connect(noiseGain).connect(panner);
    noise.start(now);
    this.noise = noise;

    var sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(SUB_BASS_HZ, now);

    var subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.04, now);
    this.subGain = subGain;

    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1, now);
    var lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.035, now);
    lfo.connect(lfoGain).connect(subGain.gain);
    this.lfoGain = lfoGain;

    sub.connect(subGain).connect(panner);
    sub.start(now);
    lfo.start(now);
    this.sub = sub;
    this.lfo = lfo;

    var breathOsc = ctx.createOscillator();
    breathOsc.type = 'sine';
    breathOsc.frequency.setValueAtTime(196, now);
    var breathGain = ctx.createGain();
    breathGain.gain.setValueAtTime(0, now);
    breathOsc.connect(breathGain).connect(panner);
    breathOsc.start(now);
    this.breathOsc = breathOsc;
    this.breathGain = breathGain;
  };

  AudioEngine.prototype.sync = function sync(state, elapsedMs) {
    if (!this.ctx || !this.noiseGain || !this.noiseFilter || !this.subGain || !this.breathGain) {
      return;
    }
    var now = this.ctx.currentTime;
    var progress = state.progress;
    var chaos = state.chaos;
    var heartbeat = state.heartbeat;

    var noiseVol = 0.08 + chaos * 0.58;
    this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.08);

    var cutoff = 120 + (1 - chaos) * 8200 + heartbeat * 400;
    this.noiseFilter.frequency.setTargetAtTime(Math.max(140, cutoff), now, 0.12);

    var subVol = 0.04 + heartbeat * 0.52;
    this.subGain.gain.setTargetAtTime(subVol, now, 0.1);

    var lfoDepth = 0.02 + heartbeat * 0.38;
    if (this.lfo && this.lfoGain) {
      this.lfoGain.gain.setTargetAtTime(lfoDepth, now, 0.1);
    }

    var breathVol = heartbeat > 0.4 ? (heartbeat - 0.4) * 0.22 : 0;
    this.breathGain.gain.setTargetAtTime(breathVol, now, 0.15);

    if (this.panner && chaos > 0.2) {
      var panTarget = Math.sin(elapsedMs * 0.0022) * chaos * 0.35;
      if (Math.abs(panTarget - this.lastPan) > 0.02) {
        this.panner.pan.setTargetAtTime(panTarget, now, 0.06);
        this.lastPan = panTarget;
      }
    } else if (this.panner) {
      this.panner.pan.setTargetAtTime(0, now, 0.1);
      this.lastPan = 0;
    }

    if (this.breathOsc && heartbeat > 0.35) {
      var breathMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * BREATH_HZ * (elapsedMs / 1000));
      var breathFreq = 180 + breathMod * 40;
      this.breathOsc.frequency.setTargetAtTime(breathFreq, now, 0.08);
    }
  };

  AudioEngine.prototype.pause = function pause() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    var now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.1, now + 0.35);
  };

  AudioEngine.prototype.resume = function resume() {
    if (!this.ctx || !this.master) return;
    void this.ctx.resume();
    var now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(0.92, now + 0.35);
  };

  AudioEngine.prototype.complete = function complete() {
    if (!this.ctx || !this.master || !this.noiseGain || !this.subGain) return;
    var now = this.ctx.currentTime;

    this.noiseGain.gain.cancelScheduledValues(now);
    this.noiseGain.gain.setValueAtTime(Math.max(this.noiseGain.gain.value, 0.0001), now);
    this.noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    if (this.breathGain) {
      this.breathGain.gain.setTargetAtTime(0.0001, now, 0.2);
    }

    var sub = this.subGain.gain;
    sub.cancelScheduledValues(now);
    var base = 0.0001;
    for (var i = 0; i < 3; i++) {
      var beat = now + i;
      sub.setValueAtTime(base, beat);
      sub.exponentialRampToValueAtTime(0.75, beat + 0.16);
      sub.exponentialRampToValueAtTime(base, beat + 0.88);
    }

    if (this.panner) {
      this.panner.pan.setTargetAtTime(0, now, 0.2);
    }

    var fadeEnd = now + 3.6;
    this.master.gain.cancelScheduledValues(now + 3);
    this.master.gain.setValueAtTime(0.92, now + 3);
    this.master.gain.exponentialRampToValueAtTime(0.0001, fadeEnd);
    var self = this;
    window.setTimeout(function () {
      self.stop();
    }, 3800);
  };

  AudioEngine.prototype.stop = function stop() {
    if (!this.ctx) return;
    try {
      if (this.noise) this.noise.stop();
      if (this.sub) this.sub.stop();
      if (this.lfo) this.lfo.stop();
      if (this.breathOsc) this.breathOsc.stop();
    } catch {
      /* already stopped */
    }
    void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.noiseGain = null;
    this.noiseFilter = null;
    this.sub = null;
    this.subGain = null;
    this.lfo = null;
    this.breathOsc = null;
    this.breathGain = null;
    this.panner = null;
  };

  global.SurgeAudio = AudioEngine;
})(typeof window !== 'undefined' ? window : globalThis);
