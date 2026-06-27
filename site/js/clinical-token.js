(function () {
  const input = document.getElementById('token-input');
  const errorEl = document.getElementById('token-error');

  if (!input) return;

  input.addEventListener('input', function () {
    input.value = input.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase();
    errorEl.classList.remove('visible');
    if (input.value.length === 6) submit();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submit();
  });

  async function submit() {
    const token = input.value.trim();
    if (token.length !== 6) return;

    try {
      const res = await fetch('/.netlify/functions/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token }),
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem('surge_token', token);
        window.location.href = 'engine.html';
        return;
      }
    } catch {
      /* fall through */
    }

    errorEl.classList.add('visible');
    input.value = '';
    input.focus();
  }

  input.focus();
})();
