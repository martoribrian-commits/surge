(function () {
  var TOKEN_KEY = 'surge_token';
  var HANDOFF_KEY = 'surge.craneHandoff';
  var OPENING_DEFAULT =
    "You made it through. There's no agenda here. We can talk about what happened, or we can just sit. What do you need right now?";

  var messagesEl = document.getElementById('crane-messages');
  var input = document.getElementById('crane-input');
  var gateEl = document.getElementById('crane-gate');
  var gateLink = document.getElementById('crane-gate-link');

  if (!messagesEl || !input) return;

  var hasToken = false;
  try {
    hasToken = !!(localStorage.getItem(TOKEN_KEY) && localStorage.getItem(TOKEN_KEY).length === 6);
  } catch {
    hasToken = false;
  }

  var handoff = null;
  try {
    var raw = sessionStorage.getItem(HANDOFF_KEY);
    if (raw) handoff = JSON.parse(raw);
  } catch {
    handoff = null;
  }

  var history = [];

  function buildOpening() {
    if (handoff && handoff.durationSeconds) {
      return (
        'You held for ' +
        handoff.durationSeconds +
        " seconds. There's no agenda here. What do you need right now?"
      );
    }
    return OPENING_DEFAULT;
  }

  function buildContext() {
    if (!handoff) return null;
    return {
      durationSeconds: handoff.durationSeconds,
      completionState: handoff.completionState || 'complete',
      brainDump: handoff.brainDump,
    };
  }

  function append(role, content) {
    history.push({ role: role, content: content });
    var div = document.createElement('div');
    div.className = 'crane-msg ' + role + ' crane-msg-enter';
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    requestAnimationFrame(function () {
      div.classList.add('crane-msg-visible');
    });
  }

  function setGateVisible(visible) {
    if (!gateEl) return;
    gateEl.hidden = !visible;
    input.disabled = visible;
    if (visible) {
      input.placeholder = 'Connect through your provider to speak with Crane.';
    }
  }

  append('crane', buildOpening());

  if (!hasToken) {
    setGateVisible(true);
    if (gateLink) {
      gateLink.href = 'clinical-token.html';
    }
  } else {
    setGateVisible(false);
    input.focus();
  }

  input.addEventListener('keydown', async function (e) {
    if (e.key !== 'Enter') return;
    if (!hasToken) return;

    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    append('user', text);

    try {
      var res = await fetch('/.netlify/functions/crane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          context: buildContext(),
        }),
      });
      var data = await res.json();
      if (data.response) {
        append('crane', data.response);
      } else {
        append('crane', 'Connection lost. Rest when you need to.');
      }
    } catch {
      append('crane', 'Connection lost. Rest when you need to.');
    }
  });
})();
