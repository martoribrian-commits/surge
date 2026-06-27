/**
 * Engine utilities — wake lock, pointer coords.
 */
(function (global) {
  var wakeLock = null;

  function acquireWakeLock() {
    if (!('wakeLock' in navigator)) return Promise.resolve();
    return navigator.wakeLock
      .request('screen')
      .then(function (lock) {
        wakeLock = lock;
        lock.addEventListener('release', function () {
          wakeLock = null;
        });
      })
      .catch(function () {
        /* unsupported or denied */
      });
  }

  function releaseWakeLock() {
    if (!wakeLock) return;
    wakeLock.release().catch(function () {});
    wakeLock = null;
  }

  function pointerCoords(e, canvas) {
    var rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
    var x = (e.clientX != null ? e.clientX : 0) - rect.left;
    var y = (e.clientY != null ? e.clientY : 0) - rect.top;
    return { x: x, y: y };
  }

  global.EngineUtil = {
    acquireWakeLock: acquireWakeLock,
    releaseWakeLock: releaseWakeLock,
    pointerCoords: pointerCoords,
  };
})(typeof window !== 'undefined' ? window : globalThis);
