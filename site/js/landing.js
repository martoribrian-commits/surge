/**
 * Landing — scroll reveals; optional deceleration hero on legacy pages.
 */
(function () {
  var hero = document.getElementById('deceleration-hero');

  if (hero) {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clamp01(v) {
      return v < 0 ? 0 : v > 1 ? 1 : v;
    }

    function range(progress, in0, in1, out0, out1) {
      return out0 + clamp01((progress - in0) / (in1 - in0)) * (out1 - out0);
    }

    function updateDeceleration() {
      var scrollable = hero.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var progress = clamp01(window.scrollY / scrollable);
      hero.style.setProperty('--distress-opacity', String(range(progress, 0, 0.32, 1, 0)));
      hero.style.setProperty('--calm-opacity', String(range(progress, 0.28, 0.62, 0, 1)));
      hero.style.setProperty('--forest-opacity', String(range(progress, 0.12, 0.55, 0, 1)));
      hero.style.setProperty('--ocean-opacity', String(range(progress, 0.38, 0.78, 0, 0.75)));
      hero.style.setProperty('--dawn-opacity', String(range(progress, 0.58, 1, 0, 0.55)));
      hero.style.setProperty('--ritual-hint-opacity', String(range(progress, 0.48, 0.82, 0, 1)));
      hero.style.setProperty('--scroll-hint-opacity', String(range(progress, 0, 0.12, 1, 0)));
      hero.style.setProperty('--distress-y', String(range(progress, 0, 0.45, 0, -28)) + 'px');
    }

    if (!reducedMotion) {
      var ticking = false;
      window.addEventListener(
        'scroll',
        function () {
          if (!ticking) {
            ticking = true;
            requestAnimationFrame(function () {
              updateDeceleration();
              ticking = false;
            });
          }
        },
        { passive: true },
      );
      window.addEventListener('resize', updateDeceleration);
      updateDeceleration();
    }
  }

  var revealEls = document.querySelectorAll('.landing-reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '-40px 0px', threshold: 0.08 },
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }
})();
