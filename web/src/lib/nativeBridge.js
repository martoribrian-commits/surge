/**
 * Native WebView bridge wrappers for iOS (WKWebView) and Android (JavascriptInterface).
 * Falls back to navigator.vibrate and silent no-ops when bridges are unavailable.
 *
 * Bridge contract (native side must implement):
 *   iOS:     window.webkit.messageHandlers.surgeNative.postMessage({ action, ...payload })
 *   Android: window.SurgeNativeBridge.{method}(JSON.stringify(payload))
 */

const BRIDGE_CHANNEL = 'surgeNative';

/** @typedef {'ios' | 'android' | 'web'} BridgePlatform */

/** @returns {BridgePlatform} */
export function detectBridgePlatform() {
  if (typeof window === 'undefined') return 'web';
  if (window.webkit?.messageHandlers?.[BRIDGE_CHANNEL]) return 'ios';
  if (window.SurgeNativeBridge) return 'android';
  return 'web';
}

/**
 * Posts a structured message to the native host.
 * @param {string} action
 * @param {Record<string, unknown>} [payload]
 */
export function postNativeMessage(action, payload = {}) {
  if (typeof window === 'undefined') return;

  const envelope = { action, timestamp: Date.now(), ...payload };

  try {
    const iosHandler = window.webkit?.messageHandlers?.[BRIDGE_CHANNEL];
    if (iosHandler?.postMessage) {
      iosHandler.postMessage(envelope);
      return;
    }

    const android = window.SurgeNativeBridge;
    if (android) {
      const method = android[action];
      if (typeof method === 'function') {
        method.call(android, JSON.stringify(envelope));
        return;
      }
      if (typeof android.postMessage === 'function') {
        android.postMessage(JSON.stringify(envelope));
        return;
      }
    }
  } catch {
    /* Bridge unavailable — fall through to web shims */
  }

  dispatchWebShim(envelope);
}

/** Web fallback shims — vibrate API only; audio is silent until native wired. */
function dispatchWebShim(envelope) {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  switch (envelope.action) {
    case 'hapticTransient':
      navigator.vibrate(envelope.pattern ?? 40);
      break;
    case 'hapticContinuousStart':
      navigator.vibrate(envelope.durationMs ?? 200);
      break;
    case 'hapticStopAll':
      navigator.vibrate(0);
      break;
    case 'hapticPattern':
      if (Array.isArray(envelope.pattern)) navigator.vibrate(envelope.pattern);
      break;
    default:
      break;
  }
}

/** Sharp transient pulse — CoreHaptics CHHapticEventTypeHapticTransient equivalent. */
export function triggerTransientHaptic({
  intensity = 1,
  sharpness = 1,
  pattern = [40, 60, 40],
} = {}) {
  postNativeMessage('hapticTransient', {
    intensity: clamp01(intensity),
    sharpness: clamp01(sharpness),
    pattern,
  });
}

/** Continuous haptic with optional linear/exponential decay envelope. */
export function startContinuousHaptic({
  intensity = 0.8,
  durationMs = 20_000,
  decay = 'linear',
  id = 'default',
} = {}) {
  postNativeMessage('hapticContinuousStart', {
    id,
    intensity: clamp01(intensity),
    durationMs,
    decay,
  });
}

/** Update continuous haptic intensity mid-flight (breathing swell/ebbs). */
export function updateContinuousIntensity({ id = 'default', intensity = 0.5 } = {}) {
  postNativeMessage('hapticContinuousUpdate', {
    id,
    intensity: clamp01(intensity),
  });
}

/** Pan stereo haptic field — negative = left, positive = right. */
export function setHapticPan({ pan = 0, intensity = 0.35 } = {}) {
  postNativeMessage('hapticPan', {
    pan: clampPan(pan),
    intensity: clamp01(intensity),
  });
}

/** Light bilateral thud — maps to UIImpactFeedbackGenerator .light on iOS. */
export function triggerLightThud({ pan = 0 } = {}) {
  postNativeMessage('hapticLight', {
    pan: clampPan(pan),
    intensity: 0.35,
  });
}

/** Instantly kill all active haptic engines and cancel pending patterns. */
export function stopAllHaptics() {
  postNativeMessage('hapticStopAll', {});
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(0);
    } catch {
      /* iOS Safari */
    }
  }
}

/** Play named audio cue stem via native AVAudioEngine / ExoPlayer bridge. */
export function playAudioCue({ cueId, pan = 0, volume = 1, loop = false } = {}) {
  if (!cueId) return;
  postNativeMessage('audioPlay', {
    cueId,
    pan: clampPan(pan),
    volume: clamp01(volume),
    loop,
  });
}

/** Stop a specific audio cue or all cues when cueId omitted. */
export function stopAudioCue({ cueId = null } = {}) {
  postNativeMessage('audioStop', { cueId });
}

/** Nuclear stop — haptics + audio. Call on anchor release or navigation away. */
export function killAllSensoryOutput() {
  stopAllHaptics();
  stopAudioCue({});
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampPan(value) {
  return Math.max(-1, Math.min(1, Number(value) || 0));
}
