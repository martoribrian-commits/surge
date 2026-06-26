import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "./engine/audio";
import { HapticEngine } from "./engine/haptics";
import {
  curveAt,
  clamp01,
  DEFAULT_DURATION_MS,
  HEARTBEAT_HZ,
  type CurveState,
} from "./engine/curve";
import { draw, type Phase, type Ring } from "./render/draw";
import "./App.css";

const COMPLETE_FADE_MS = 3400;
const TRANSITION_MS = 2600;

/** Allow a faster session for development/testing via ?d=<seconds>. */
function resolveDuration(): number {
  if (typeof window === "undefined") return DEFAULT_DURATION_MS;
  const raw = new URLSearchParams(window.location.search).get("d");
  if (!raw) return DEFAULT_DURATION_MS;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) return DEFAULT_DURATION_MS;
  return Math.round(seconds * 1000);
}

type UiPhase = Phase | "transition";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const hapticRef = useRef<HapticEngine | null>(null);

  const durationRef = useRef(resolveDuration());
  const accumulatedRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const completeStartRef = useRef<number | null>(null);
  const ringsRef = useRef<Ring[]>([]);
  const lastRingBeatRef = useRef(-1);
  const curveRef = useRef<CurveState>(curveAt(0));
  const phaseRef = useRef<UiPhase>("idle");
  const rafRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<number | null>(null);

  const [phase, setPhaseState] = useState<UiPhase>("idle");

  const setPhase = useCallback((next: UiPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // Lazily create the engines once.
  if (!audioRef.current) audioRef.current = new AudioEngine();
  if (!hapticRef.current) hapticRef.current = new HapticEngine();

  const getCurve = useCallback(() => curveRef.current, []);

  const startSession = useCallback(() => {
    accumulatedRef.current = 0;
    startedAtRef.current = performance.now();
    completeStartRef.current = null;
    ringsRef.current = [];
    lastRingBeatRef.current = -1;
    audioRef.current?.start(durationRef.current);
    hapticRef.current?.start(getCurve);
    setPhase("active");
  }, [getCurve, setPhase]);

  const pauseSession = useCallback(() => {
    if (phaseRef.current !== "active") return;
    if (startedAtRef.current !== null) {
      accumulatedRef.current += performance.now() - startedAtRef.current;
      startedAtRef.current = null;
    }
    audioRef.current?.pause();
    hapticRef.current?.pause();
    setPhase("paused");
  }, [setPhase]);

  const resumeSession = useCallback(() => {
    startedAtRef.current = performance.now();
    audioRef.current?.resume();
    hapticRef.current?.resume();
    setPhase("active");
  }, [setPhase]);

  const completeSession = useCallback(() => {
    accumulatedRef.current = durationRef.current;
    startedAtRef.current = null;
    completeStartRef.current = performance.now();
    audioRef.current?.complete();
    hapticRef.current?.complete();
    setPhase("complete");
    window.setTimeout(() => {
      if (phaseRef.current === "complete") setPhase("handoff");
    }, COMPLETE_FADE_MS);
  }, [setPhase]);

  const beginHeron = useCallback(() => {
    setPhase("transition");
    hapticRef.current?.stop();
    transitionTimerRef.current = window.setTimeout(() => {
      // Reset to a calm baseline, ready for the next acute strike.
      accumulatedRef.current = 0;
      startedAtRef.current = null;
      completeStartRef.current = null;
      ringsRef.current = [];
      setPhase("idle");
    }, TRANSITION_MS);
  }, [setPhase]);

  // --- Pointer: the dead-man's switch ---
  const handlePointerDown = useCallback(() => {
    const p = phaseRef.current;
    if (p === "idle") startSession();
    else if (p === "paused") resumeSession();
  }, [startSession, resumeSession]);

  const handlePointerRelease = useCallback(() => {
    if (phaseRef.current === "active") pauseSession();
  }, [pauseSession]);

  // Lift-anywhere safety net for the dead-man's switch.
  useEffect(() => {
    const onUp = () => handlePointerRelease();
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [handlePointerRelease]);

  // --- The single render loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const tick = () => {
      const now = performance.now();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      const wantW = Math.round(cssW * dpr);
      const wantH = Math.round(cssH * dpr);
      if (canvas.width !== wantW || canvas.height !== wantH) {
        canvas.width = wantW;
        canvas.height = wantH;
      }

      const active = phaseRef.current === "active";
      const elapsed =
        (active && startedAtRef.current !== null
          ? now - startedAtRef.current
          : 0) + accumulatedRef.current;
      const progress = clamp01(elapsed / durationRef.current);
      const curve = curveAt(progress);
      curveRef.current = curve;

      if (active && progress >= 1) {
        completeSession();
      }

      const tSec = now / 1000;

      // Spawn an ink ring on every heartbeat while engaged.
      if (active) {
        const beatIndex = Math.floor(tSec * HEARTBEAT_HZ);
        if (beatIndex !== lastRingBeatRef.current) {
          lastRingBeatRef.current = beatIndex;
          ringsRef.current.push({
            born: tSec,
            strength: 0.25 + 0.75 * curve.heartbeat,
          });
        }
      }
      // Prune dead rings.
      ringsRef.current = ringsRef.current.filter((r) => tSec - r.born <= 2.7);

      let completeFade = 0;
      if (completeStartRef.current !== null) {
        completeFade = clamp01((now - completeStartRef.current) / COMPLETE_FADE_MS);
      }

      const uiPhase = phaseRef.current;
      const drawPhase: Phase = uiPhase === "transition" ? "handoff" : uiPhase;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, {
        phase: drawPhase,
        t: tSec,
        progress,
        chaos: curve.chaos,
        heartbeat: curve.heartbeat,
        completeFade,
        rings: ringsRef.current,
        reducedMotion,
        width: cssW,
        height: cssH,
        dpr,
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [completeSession]);

  // Tear down engines on unmount.
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null)
        window.clearTimeout(transitionTimerRef.current);
      audioRef.current?.stop();
      hapticRef.current?.stop();
    };
  }, []);

  return (
    <div
      className="surge-stage"
      data-phase={phase}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerRelease}
      onPointerCancel={handlePointerRelease}
      role="application"
      aria-label="Surge somatic circuit breaker"
    >
      <canvas ref={canvasRef} className="surge-canvas" />

      {phase === "idle" && (
        <div className="surge-overlay surge-overlay--idle">
          <span className="surge-eyebrow">SOMATIC CIRCUIT BREAKER</span>
          <p className="surge-instruction">Press and hold.</p>
        </div>
      )}

      {phase === "handoff" && (
        <div className="surge-overlay surge-overlay--handoff">
          <button
            type="button"
            className="surge-button"
            onPointerDown={(e) => {
              e.stopPropagation();
              beginHeron();
            }}
          >
            Begin Recovery (Heron)
          </button>
        </div>
      )}

      {phase === "transition" && (
        <div className="surge-overlay surge-overlay--transition">
          <p className="surge-handoff-text">Transitioning to Heron.</p>
        </div>
      )}
    </div>
  );
}
