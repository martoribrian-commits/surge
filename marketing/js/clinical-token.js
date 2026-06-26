/**
 * Clinical token keypad — anonymous validation, no account creation.
 */
(function () {
  const TOKEN_PATTERN = /^[A-Za-z0-9]{6}$/;
  const STORAGE_TOKEN = 'surge.clinicalToken';
  const STORAGE_UNLOCK = 'surge.isHeronUnlocked';

  const keypad = document.getElementById('token-keypad');
  const input = document.getElementById('token-input');
  const statusEl = document.getElementById('token-status');
  const slots = Array.from(document.querySelectorAll('.token-slot'));

  if (!keypad || !input) return;

  function renderSlots(value) {
    const chars = value.toUpperCase().split('');
    slots.forEach((slot, index) => {
      slot.textContent = chars[index] ?? '';
      slot.classList.toggle('filled', index < chars.length);
      slot.classList.toggle('active', index === chars.length && chars.length < 6);
    });
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = 'token-status' + (type ? ` ${type}` : '');
  }

  async function validateToken(token) {
    const config = window.SURGE_CONFIG ?? {};
    const { supabaseUrl, supabaseAnonKey } = config;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('offline');
    }

    const functionUrl = `${supabaseUrl}/functions/v1/validate-clinical-token`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('network');
    }

    const data = await response.json();
    return Boolean(data?.valid);
  }

  function persistUnlock(token) {
    try {
      localStorage.setItem(STORAGE_TOKEN, token);
      localStorage.setItem(STORAGE_UNLOCK, 'true');
    } catch {
      // Private browsing — proceed anyway
    }
  }

  async function submitToken(raw) {
    const token = raw.toUpperCase().trim();

    if (!TOKEN_PATTERN.test(token)) {
      setStatus('Invalid token.', 'error');
      input.value = '';
      renderSlots('');
      return;
    }

    setStatus('Validating.', '');

    try {
      const valid = await validateToken(token);

      if (valid) {
        persistUnlock(token);
        setStatus('Access granted.', 'success');
        window.location.href = '/surge';
        return;
      }

      setStatus('Invalid token.', 'error');
      input.value = '';
      renderSlots('');
    } catch {
      setStatus('Connection unavailable. Try again.', 'error');
      input.value = '';
      renderSlots('');
    }
  }

  keypad.addEventListener('click', () => input.focus());

  input.addEventListener('input', () => {
    const sanitized = input.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    input.value = sanitized;
    renderSlots(sanitized);
    setStatus('', '');

    if (sanitized.length === 6) {
      submitToken(sanitized);
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.length === 6) {
      submitToken(input.value);
    }
  });

  renderSlots('');
  input.focus();
})();
