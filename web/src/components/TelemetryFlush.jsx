import { useEffect } from 'react';
import { flushPendingTelemetry } from '../lib/sessionPayload';

/** Flushes offline-queued telemetry on mount — never blocks UI. */
export default function TelemetryFlush() {
  useEffect(() => {
    flushPendingTelemetry();
  }, []);

  return null;
}
