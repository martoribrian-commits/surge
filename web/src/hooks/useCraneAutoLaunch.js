import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Countdown auto-launch for Crane navigate actions (start_sequence_for_user).
 */
export function useCraneAutoLaunch({ onLaunch, onCancel, closeCrane }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

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
    onCancel?.();
  }, [clearTimers, onCancel]);

  const launchNow = useCallback(
    (target) => {
      const launch = target ?? pending;
      if (!launch?.path) return;
      clearTimers();
      setPending(null);
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

      const ms = autoLaunch.countdownMs ?? 2500;
      const secs = Math.max(1, Math.ceil(ms / 1000));
      setPending(autoLaunch);
      setSecondsLeft(secs);

      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);

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
    schedule,
    cancel,
    launchNow,
    isActive: Boolean(pending),
  };
}
