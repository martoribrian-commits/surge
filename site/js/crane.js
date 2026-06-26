(function () {
  const TOKEN_KEY = 'surge_token';
  const OPENING =
    "You made it through. There's no agenda here. We can talk about what happened, or we can just sit. What do you need right now?";

  const messagesEl = document.getElementById('crane-messages');
  const input = document.getElementById('crane-input');

  if (!messagesEl || !input) return;

  if (!localStorage.getItem(TOKEN_KEY)) {
    window.location.href = 'clinical-token.html';
    return;
  }

  const history = [];

  function append(role, content) {
    history.push({ role: role, content: content });
    const div = document.createElement('div');
    div.className = 'crane-msg ' + role;
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  append('crane', OPENING);

  input.addEventListener('keydown', async function (e) {
    if (e.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    append('user', text);

    try {
      const res = await fetch('/.netlify/functions/crane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.response) {
        append('crane', data.response);
      }
    } catch {
      append('crane', 'Connection lost. Rest when you need to.');
    }
  });

  input.focus();
})();
