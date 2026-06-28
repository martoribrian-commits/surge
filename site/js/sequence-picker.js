/**
 * Landing sequence picker — 30 / 60 / 90 selector with dynamic headline.
 * Links to React engine routes after Netlify publishes web/dist.
 */
(function () {
  var VARIANTS = {
    'instant-reset': {
      seconds: 30,
      name: 'Instant Reset',
      tagline: 'Physiological sigh',
      href: '/engine/instant-reset',
      headline: 'Thirty seconds\nto reset your nervous system.',
      sub: 'Double inhale, long exhale — runs automatically once you begin.',
    },
    'orienting-anchor': {
      seconds: 60,
      name: 'Orienting Anchor',
      tagline: 'Bilateral grounding',
      href: '/engine/orienting-anchor',
      headline: 'Sixty seconds\nto reset your nervous system.',
      sub: 'Alternate left and right taps to integrate hemispheres.',
    },
    'coherence-ripple': {
      seconds: 90,
      name: 'Coherence Ripple',
      tagline: 'Deep diaphragmatic regulation',
      href: '/engine/coherence-ripple',
      headline: 'Ninety seconds\nto reset your nervous system.',
      sub: 'Press and hold through one guided cycle. Release to pause.',
    },
  };

  var DEFAULT_ID = 'coherence-ripple';
  var activeId = DEFAULT_ID;

  var tabsEl = document.getElementById('sequence-tabs');
  var headlineEl = document.getElementById('sequence-headline');
  var subEl = document.getElementById('sequence-subhead');
  var ctaEl = document.getElementById('sequence-cta');
  var previewNameEl = document.getElementById('sequence-preview-name');
  var previewTagEl = document.getElementById('sequence-preview-tag');

  if (!tabsEl || !headlineEl || !ctaEl) return;

  function renderTabs() {
    tabsEl.innerHTML = '';
    Object.keys(VARIANTS).forEach(function (id) {
      var v = VARIANTS[id];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sequence-tab' + (id === activeId ? ' sequence-tab--active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', id === activeId ? 'true' : 'false');
      btn.textContent = v.seconds + 's';
      btn.addEventListener('click', function () {
        activeId = id;
        renderTabs();
        renderCopy();
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderCopy() {
    var v = VARIANTS[activeId];
    headlineEl.innerHTML = v.headline.replace('\n', '<br>');
    if (subEl) subEl.textContent = v.sub;
    ctaEl.textContent = 'Begin ' + v.seconds + 's cycle';
    ctaEl.setAttribute('href', v.href);
    if (previewNameEl) previewNameEl.textContent = v.name;
    if (previewTagEl) previewTagEl.textContent = v.tagline;
  }

  renderTabs();
  renderCopy();
})();
