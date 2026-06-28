/**
 * Landing sequence picker — 30 / 60 / 90 breath / 90 decay selector.
 */
(function () {
  var VARIANTS = {
    'instant-reset': {
      tabLabel: '30',
      seconds: 30,
      name: 'Instant Reset',
      tagline: 'Physiological sigh',
      href: '/engine/instant-reset',
      headline: 'Thirty seconds\nto reset your nervous system.',
      sub: 'Double inhale, long exhale — runs automatically once you begin.',
    },
    'orienting-anchor': {
      tabLabel: '60',
      seconds: 60,
      name: 'Orienting Anchor',
      tagline: 'Bilateral grounding',
      href: '/engine/orienting-anchor',
      headline: 'Sixty seconds\nto reset your nervous system.',
      sub: 'Alternate left and right taps to integrate hemispheres.',
    },
    'coherence-ripple': {
      tabLabel: '90 · breath',
      seconds: 90,
      name: 'Coherence Ripple',
      tagline: 'Resonant breath hold',
      href: '/engine/coherence-ripple',
      headline: 'Ninety seconds\nto reset your nervous system.',
      sub: 'Resonant 4/6 breath — press and hold. Release to pause.',
    },
    'vagal-downshift': {
      tabLabel: '90 · decay',
      seconds: 90,
      name: 'Vagal Downshift',
      tagline: 'Classic decay curve',
      href: '/engine/vagal-downshift',
      headline: 'Ninety seconds\nto reset your nervous system.',
      sub: 'The original Surge engine — press and hold as chaos decays to heartbeat.',
    },
  };

  var DEFAULT_ID = 'vagal-downshift';
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
      btn.setAttribute('aria-label', v.name + ', ' + v.seconds + ' seconds');
      btn.textContent = v.tabLabel;
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
    ctaEl.textContent = 'Begin ' + v.name.toLowerCase() + ' cycle';
    ctaEl.setAttribute('href', v.href);
    if (previewNameEl) previewNameEl.textContent = v.name;
    if (previewTagEl) previewTagEl.textContent = v.tagline;
  }

  renderTabs();
  renderCopy();
})();
