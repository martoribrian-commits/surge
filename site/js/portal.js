import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const API = {
  tokens: '/.netlify/functions/portal-tokens',
  generate: '/.netlify/functions/portal-generate',
  stats: '/.netlify/functions/portal-stats',
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginState = document.getElementById('login-state');
const dashboardState = document.getElementById('dashboard-state');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const signOutBtn = document.getElementById('sign-out');
const orgNameEl = document.getElementById('org-name');
const tokenTableBody = document.getElementById('token-table-body');
const generateForm = document.getElementById('generate-form');
const tokenReveal = document.getElementById('token-reveal');
const revealCode = document.getElementById('reveal-code');
const copyBtn = document.getElementById('copy-btn');
const statIssued = document.getElementById('stat-issued');
const statActivated = document.getElementById('stat-activated');
const statSessions = document.getElementById('stat-sessions');

let revealTimer = null;

function authHeaders(session) {
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

function formatDate(iso) {
  if (!iso) return 'No expiry';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function statusLabel(status) {
  if (status === 'expired') return 'Expired';
  if (status === 'activated') return 'Activated';
  return 'Active';
}

function showLogin() {
  loginState.hidden = false;
  dashboardState.hidden = true;
}

function showDashboard() {
  loginState.hidden = true;
  dashboardState.hidden = false;
}

async function apiGet(url, session) {
  const res = await fetch(url, { headers: authHeaders(session) });
  if (res.status === 401) throw new Error('unauthorized');
  return res.json();
}

async function apiPost(url, session, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(session),
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('unauthorized');
  return res.json();
}

function renderTokens(tokens) {
  tokenTableBody.innerHTML = '';
  if (!tokens.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" class="portal-empty">No tokens issued.</td>';
    tokenTableBody.appendChild(row);
    return;
  }

  tokens.forEach(function (t) {
    const row = document.createElement('tr');
    row.innerHTML =
      '<td class="mono">' +
      t.token +
      '</td><td>' +
      formatDate(t.issued_at) +
      '</td><td>' +
      formatDate(t.expires_at) +
      '</td><td>' +
      t.uses_remaining +
      '</td><td>' +
      statusLabel(t.status) +
      '</td>';
    tokenTableBody.appendChild(row);
  });
}

function showTokenReveal(token) {
  if (revealTimer) clearTimeout(revealTimer);
  revealCode.textContent = token;
  tokenReveal.hidden = false;

  revealTimer = setTimeout(function () {
    tokenReveal.hidden = true;
  }, 10000);
}

async function loadDashboard(session) {
  try {
    const [statsData, tokensData] = await Promise.all([
      apiGet(API.stats, session),
      apiGet(API.tokens, session),
    ]);

    orgNameEl.textContent = statsData.orgName ?? '';
    statIssued.textContent = statsData.stats?.tokensIssued ?? 0;
    statActivated.textContent = statsData.stats?.tokensActivated ?? 0;
    statSessions.textContent = statsData.stats?.sessionsCompleted ?? 0;
    renderTokens(tokensData.tokens ?? []);
  } catch (err) {
    if (err.message === 'unauthorized') {
      await supabase.auth.signOut();
      showLogin();
    }
  }
}

loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  loginError.hidden = true;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    loginError.hidden = false;
    return;
  }

  showDashboard();
  await loadDashboard(data.session);
});

signOutBtn.addEventListener('click', async function () {
  await supabase.auth.signOut();
  showLogin();
});

generateForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    showLogin();
    return;
  }

  const expiresIn = document.getElementById('expires-in').value;
  const uses = document.getElementById('uses-count').value;

  try {
    const result = await apiPost(API.generate, session, { expiresIn, uses });
    if (result.token) {
      showTokenReveal(result.token.token);
      await loadDashboard(session);
    }
  } catch (err) {
    if (err.message === 'unauthorized') {
      await supabase.auth.signOut();
      showLogin();
    }
  }
});

copyBtn.addEventListener('click', function () {
  const code = revealCode.textContent;
  if (code) {
    navigator.clipboard.writeText(code).catch(function () {});
  }
});

supabase.auth.getSession().then(function ({ data }) {
  if (data.session) {
    showDashboard();
    loadDashboard(data.session);
  } else {
    showLogin();
  }
});

supabase.auth.onAuthStateChange(function (_event, session) {
  if (session) {
    showDashboard();
    loadDashboard(session);
  } else {
    showLogin();
  }
});
