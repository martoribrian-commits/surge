import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sovereignty-aware sequence clock.
 * - HOLD: advances only while `isEngaged`; pauses without resetting elapsed.
 * - AUTO: runs once started until duration completes.
 * - BILATERAL: advances on valid alternation taps (see registerBilateralTap).
 */
export function useSequenceClock({
  durationSeconds,
  interactionMode,
  isEngaged = false,
  enabled = true,
}) {
  const durationMs = durationSeconds * 1000;
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const rafRef = useRef(null);
  const lastTickRef = useRef(null);
  const elapsedRef = useRef(0);
  const lastSideRef = useRef(null);

  const progress = Math.min(1, elapsedMs / durationMs);
  const remainingMs = Math.max(0, durationMs - elapsedMs);

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    lastTickRef.current = null;
  }, []);

  const tick = useCallback(
    function loop(now) {
      if (lastTickRef.current == null) lastTickRef.current = now;
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      elapsedRef.current = Math.min(durationMs, elapsedRef.current + delta);
      setElapsedMs(elapsedRef.current);

      if (elapsedRef.current >= durationMs) {
        setIsRunning(false);
        setIsComplete(true);
        stopLoop();
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    },
    [durationMs, stopLoop],
  );

  const start = useCallback(() => {
    if (isComplete || !enabled) return;
    setIsRunning(true);
    lastTickRef.current = null;
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  }, [enabled, isComplete, tick]);

  const pause = useCallback(() => {
    setIsRunning(false);
    stopLoop();
  }, [stopLoop]);

  const reset = useCallback(() => {
    stopLoop();
    elapsedRef.current = 0;
    lastSideRef.current = null;
    setElapsedMs(0);
    setIsRunning(false);
    setIsComplete(false);
  }, [stopLoop]);

  /** Advance clock by ms (bilateral mode). */
  const advance = useCallback(
    (ms) => {
      if (isComplete || !enabled) return;
      elapsedRef.current = Math.min(durationMs, elapsedRef.current + ms);
      setElapsedMs(elapsedRef.current);
      if (elapsedRef.current >= durationMs) {
        setIsRunning(false);
        setIsComplete(true);
        stopLoop();
      }
    },
    [durationMs, enabled, isComplete, stopLoop],
  );

  /**
   * @param {'left' | 'right'} side
   * @returns {boolean} whether tap was accepted
   */
  const registerBilateralTap = useCallback(
    (side) => {
      if (isComplete || !enabled) return false;
      if (lastSideRef.current === side) return false;
      lastSideRef.current = side;
      if (!isRunning) setIsRunning(true);
      advance(durationMs / Math.max(12, durationSeconds * 2));
      return true;
    },
    [advance, durationMs, durationSeconds, enabled, isComplete, isRunning],
  );

  // HOLD mode: clock follows engagement
  useEffect(() => {
    if (interactionMode !== 'hold' || !enabled || isComplete) return;
    if (isEngaged) start();
    else pause();
  }, [interactionMode, isEngaged, enabled, isComplete, start, pause]);

  // AUTO mode: start once regulation is enabled (covers late mount after beginRegulation)
  useEffect(() => {
    if (interactionMode !== 'auto' || !enabled || isComplete || isRunning) return;
    start();
  }, [interactionMode, enabled, isComplete, isRunning, start]);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return {
    elapsedMs,
    elapsedSeconds: elapsedMs / 1000,
    progress,
    remainingMs,
    isRunning,
    isComplete,
    isPaused: !isRunning && !isComplete && elapsedMs > 0,
    start,
    pause,
    reset,
    advance,
    registerBilateralTap,
  };
}
