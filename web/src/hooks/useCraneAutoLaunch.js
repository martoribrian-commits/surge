import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Countdown auto-launch with smooth progress for Crane navigate actions.
 */
export function useCraneAutoLaunch({ onLaunch, onCancel, closeCrane }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const startRef = useRef(0);
  const durationRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimers();
    setPending(null);
    setSecondsLeft(0);
    setProgress(0);
    onCancel?.();
  }, [clearTimers, onCancel]);

  const launchNow = useCallback(
    (target) => {
      const launch = target ?? pending;
      if (!launch?.path) return;
      clearTimers();
      setPending(null);
      setProgress(100);
      closeCrane?.();
      onLaunch?.(launch);
      navigate(launch.path);
    },
    [pending, clearTimers, closeCrane, onLaunch, navigate],
  );

  const schedule = useCallback(
    (autoLaunch) => {
      if (!autoLaunch?.path) return;
      clearTimers();

      const ms = autoLaunch.countdownMs ?? 4000;
      durationRef.current = ms;
      startRef.current = Date.now();
      const secs = Math.max(1, Math.ceil(ms / 1000));
      setPending(autoLaunch);
      setSecondsLeft(secs);
      setProgress(0);

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startRef.current;
        const pct = Math.min(100, (elapsed / durationRef.current) * 100);
        setProgress(pct);
        setSecondsLeft(Math.max(0, Math.ceil((durationRef.current - elapsed) / 1000)));
      }, 80);

      timerRef.current = setTimeout(() => {
        launchNow(autoLaunch);
      }, ms);
    },
    [clearTimers, launchNow],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return {
    pending,
    secondsLeft,
    progress,
    schedule,
    cancel,
    launchNow,
    isActive: Boolean(pending),
  };
}
