/**
 * Landing hero — animated decay curve logomark (brand v1.1).
 */
(function () {
  var container = document.getElementById('decay-hero');
  if (!container || typeof SurgeBrand === 'undefined') return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cycleMs = reducedMotion ? 0 : 4200;

  container.innerHTML =
    '<svg class="decay-hero-svg" viewBox="' +
    SurgeBrand.VIEWBOX +
    '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path class="decay-hero-baseline" d="M6 58 L134 58" stroke="rgba(244,240,235,0.08)" stroke-width="1"/>' +
    '<path class="decay-hero-curve" d="' +
    SurgeBrand.MARK_PATH +
    '" stroke="#B6502E" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
    '<circle class="decay-hero-dot-outer" cx="134" cy="58" r="3.5" fill="#F4F0EB"/>' +
    '<circle class="decay-hero-dot-inner" cx="134" cy="58" r="1.5" fill="#B6502E"/>' +
    '<circle class="decay-hero-pulse" cx="134" cy="58" r="8" fill="none" stroke="#B6502E" stroke-width="1" opacity="0"/>' +
    '</svg>';

  var svg = container.querySelector('.decay-hero-svg');
  var curve = container.querySelector('.decay-hero-curve');
  var dotOuter = container.querySelector('.decay-hero-dot-outer');
  var dotInner = container.querySelector('.decay-hero-dot-inner');
  var pulse = container.querySelector('.decay-hero-pulse');
  if (!curve) return;

  var length = curve.getTotalLength();
  curve.style.strokeDasharray = String(length);
  curve.style.strokeDashoffset = String(length);

  var tiltX = 0;
  var tiltY = 0;

  if (!reducedMotion) {
    container.addEventListener('mousemove', function (e) {
      var rect = container.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      tiltX = nx * 6;
      tiltY = ny * 4;
    });

    container.addEventListener('mouseleave', function () {
      tiltX = 0;
      tiltY = 0;
    });
  }

  if (reducedMotion) {
    curve.style.strokeDashoffset = '0';
    return;
  }

  var start = performance.now();

  function tick(now) {
    var t = ((now - start) % cycleMs) / cycleMs;
    var draw = easeInOutCubic(t);
    curve.style.strokeDashoffset = String(length * (1 - draw));

    var dotOn = draw > 0.92;
    dotOuter.style.opacity = dotOn ? '1' : String(Math.max(0, (draw - 0.85) / 0.07));
    dotInner.style.opacity = dotOuter.style.opacity;

    if (draw > 0.96) {
      var pulseK = (draw - 0.96) / 0.04;
      pulse.setAttribute('r', String(8 + pulseK * 18));
      pulse.style.opacity = String(0.35 * (1 - pulseK));
    } else {
      pulse.style.opacity = '0';
      pulse.setAttribute('r', '8');
    }

    if (svg) {
      svg.style.transform =
        'perspective(600px) rotateY(' + tiltX + 'deg) rotateX(' + -tiltY + 'deg)';
    }

    requestAnimationFrame(tick);
  }

  function easeInOutCubic(x) {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  requestAnimationFrame(tick);
})();
