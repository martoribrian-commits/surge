/**
 * Local recovery prompts — heuristics from session metadata, no cloud.
 */
(function (global) {
  var DEFAULT_ENVIRONMENT = [
    'Splash cold water on your face and wrists',
    'Step outside, even for sixty seconds',
    'Name three objects you can see without moving',
  ];

  var DEFAULT_RITUALS = [
    'Brew tea and wait for it to cool before the first sip',
    'Straighten one surface in a single room',
    'Fold laundry with attention to texture and weight',
  ];

  var NIGHT_ENVIRONMENT = [
    'Splash cold water on your face and wrists',
    'Name three objects you can see without moving',
    'Adjust one light source in the room you are in',
  ];

  var NIGHT_RITUALS = [
    'Brew tea and wait for it to cool before the first sip',
    'Change into different clothes, even if you stay in',
    'Write tomorrow on a single sticky note, then set it aside',
  ];

  var MORNING_ENVIRONMENT = [
    'Step outside, even for sixty seconds',
    'Open a window and notice the air temperature',
    'Splash cold water on your face and wrists',
  ];

  function isNightHour(hour) {
    return hour >= 22 || hour < 6;
  }

  function isMorningHour(hour) {
    return hour >= 6 && hour < 11;
  }

  /**
   * @param {{
   *   durationSeconds?: number,
   *   completionState?: string,
   *   completedAt?: number,
   * }} meta
   */
  function getRecoveryPlan(meta) {
    var duration = meta.durationSeconds || 90;
    var completionState = meta.completionState || 'complete';
    var hour = new Date(meta.completedAt || Date.now()).getHours();
    var introLine = null;
    var environment = DEFAULT_ENVIRONMENT.slice();
    var rituals = DEFAULT_RITUALS.slice();

    if (completionState === 'interrupted') {
      if (duration < 30) {
        introLine = 'You paused early. One small physical action may be enough for now.';
        environment = [
          'Splash cold water on your face and wrists',
          'Place both feet flat on the floor and press down for ten seconds',
          'Name three objects you can see without moving',
        ];
        rituals = [
          'Brew tea and wait for it to cool before the first sip',
          'Straighten one surface in a single room',
        ];
      } else if (duration >= 60) {
        introLine = 'You were close. The tail of the curve matters less than what you already did.';
        environment.unshift('Take three slow breaths with your shoulders dropped');
      } else {
        introLine = 'You paused mid-cycle. The hold still counted.';
      }
    } else if (duration >= 88) {
      introLine = 'The full cycle completed. Move slowly from here.';
    }

    if (isNightHour(hour)) {
      environment = NIGHT_ENVIRONMENT.slice();
      rituals = NIGHT_RITUALS.slice();
    } else if (isMorningHour(hour)) {
      environment = MORNING_ENVIRONMENT.slice();
    }

    return {
      introLine: introLine,
      environment: environment,
      rituals: rituals,
    };
  }

  function renderList(el, items) {
    if (!el) return;
    el.innerHTML = '';
    items.forEach(function (item) {
      var li = document.createElement('li');
      li.textContent = item;
      el.appendChild(li);
    });
  }

  /**
   * @param {{
   *   introEl?: HTMLElement,
   *   environmentListEl?: HTMLElement,
   *   ritualsListEl?: HTMLElement,
   *   durationSeconds?: number,
   *   completionState?: string,
   *   completedAt?: number,
   * }} options
   */
  function applyRecoveryPrompts(options) {
    var plan = getRecoveryPlan({
      durationSeconds: options.durationSeconds,
      completionState: options.completionState,
      completedAt: options.completedAt,
    });

    if (options.introEl) {
      if (plan.introLine) {
        options.introEl.textContent = plan.introLine;
        options.introEl.hidden = false;
      } else {
        options.introEl.hidden = true;
      }
    }

    renderList(options.environmentListEl, plan.environment);
    renderList(options.ritualsListEl, plan.rituals);

    return plan;
  }

  global.RecoveryPrompts = {
    getRecoveryPlan: getRecoveryPlan,
    applyRecoveryPrompts: applyRecoveryPrompts,
  };
})(typeof window !== 'undefined' ? window : globalThis);
