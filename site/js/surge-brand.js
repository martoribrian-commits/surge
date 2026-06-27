/**
 * Surge v1.1 brand — logomark, lockup, mount helpers.
 */
(function (global) {
  var MARK_PATH =
    'M6 58 C14 56 22 50 30 34 C36 22 40 6 52 4 C64 2 70 34 80 48 C88 58 90 58 92 58 L134 58';
  var VIEWBOX = '0 0 140 70';

  var SIZES = {
    sm: { markW: 60, markH: 20, word: 16, rule: 16, gap: 8 },
    md: { markW: 110, markH: 34, word: 28, rule: 26, gap: 14 },
    lg: { markW: 200, markH: 60, word: 52, rule: 44, gap: 20 },
  };

  function markSvg(theme, width, height) {
    var dotOuter = theme === 'light' ? '#0A0A0A' : '#F4F0EB';
    return (
      '<svg width="' +
      width +
      '" height="' +
      height +
      '" viewBox="' +
      VIEWBOX +
      '" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path d="' +
      MARK_PATH +
      '" stroke="#B6502E" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="134" cy="58" r="3.5" fill="' +
      dotOuter +
      '"/>' +
      '<circle cx="134" cy="58" r="1.5" fill="#B6502E"/>' +
      '</svg>'
    );
  }

  function lockupHtml(options) {
    var size = SIZES[options.size || 'md'] || SIZES.md;
    var theme = options.theme || 'dark';
    var href = options.href;
    var tag = href ? 'a' : 'div';
    var wordColor = theme === 'light' ? '#0A0A0A' : '#F4F0EB';
    var ruleColor = theme === 'light' ? '#D4CFC9' : '#1E1E1E';
    var attrs = href ? ' href="' + href + '"' : '';
    var cls = 'surge-lockup surge-lockup--' + (options.size || 'md') + ' surge-lockup--' + theme;
    if (options.className) cls += ' ' + options.className;

    return (
      '<' +
      tag +
      ' class="' +
      cls +
      '"' +
      attrs +
      (href ? ' aria-label="Surge home"' : '') +
      '>' +
      markSvg(theme, size.markW, size.markH) +
      '<span class="surge-lockup-rule" style="height:' +
      size.rule +
      'px;background:' +
      ruleColor +
      '"></span>' +
      '<span class="surge-lockup-word" style="font-size:' +
      size.word +
      'px;color:' +
      wordColor +
      '">Surge</span>' +
      '</' +
      tag +
      '>'
    );
  }

  function mountLockups() {
    var nodes = document.querySelectorAll('[data-surge-lockup]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.innerHTML = lockupHtml({
        size: el.getAttribute('data-surge-lockup') || 'md',
        theme: el.getAttribute('data-surge-theme') || 'dark',
        href: el.getAttribute('data-surge-href') || null,
        className: el.getAttribute('data-surge-class') || '',
      });
    }
  }

  global.SurgeBrand = {
    MARK_PATH: MARK_PATH,
    VIEWBOX: VIEWBOX,
    markSvg: markSvg,
    lockupHtml: lockupHtml,
    mountLockups: mountLockups,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLockups);
  } else {
    mountLockups();
  }
})(typeof window !== 'undefined' ? window : globalThis);
