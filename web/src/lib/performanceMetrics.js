/** @type {number | null} */
let appMountTimestamp = null;

/** @type {number | null} */
let anchorReadyTimestamp = null;

export const PERF_EVENT_ANCHOR_READY = 'surge:tti:anchor-ready';

export function markAppMount() {
  if (appMountTimestamp != null) return;
  appMountTimestamp = performance.now();
}

/**
 * Signal that the tactile anchor is ready for user input.
 * @param {string} [interactionMode]
 */
export function markTactileAnchorReady(interactionMode) {
  if (anchorReadyTimestamp != null) return;
  anchorReadyTimestamp = performance.now();

  const detail = {
    ttiMs: appMountTimestamp != null ? anchorReadyTimestamp - appMountTimestamp : null,
    interactionMode,
    timestamp: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(PERF_EVENT_ANCHOR_READY, { detail }));
  return detail;
}

export function getTimeToInteractiveMs() {
  if (appMountTimestamp == null || anchorReadyTimestamp == null) return null;
  return Math.round(anchorReadyTimestamp - appMountTimestamp);
}

export function resetPerformanceMarks() {
  appMountTimestamp = null;
  anchorReadyTimestamp = null;
}
