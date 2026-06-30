import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  fetchPortalStats,
  fetchPortalTokens,
  fetchPortalSessions,
  generatePortalToken,
  revokePortalToken,
} from '../lib/portalClient';
import ProviderPortalLogin from './portal/ProviderPortalLogin';
import ProviderStatsBar from './portal/ProviderStatsBar';
import ProviderGenerateForm from './portal/ProviderGenerateForm';
import ProviderTokenTable from './portal/ProviderTokenTable';
import ProviderSessionsTable from './portal/ProviderSessionsTable';
import { BRAND } from '../brand/tokens';

const REVEAL_MS = 10_000;

/**
 * Provider portal — Netlify API + Supabase Auth. Service role only on backend.
 */
export default function ProviderPortal() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [portalError, setPortalError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [orgName, setOrgName] = useState('');
  const [tier, setTier] = useState('');
  const [stats, setStats] = useState({ tokensIssued: 0, tokensActivated: 0, sessionsCompleted: 0 });
  const [tokens, setTokens] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [generating, setGenerating] = useState(false);
  const [revealedToken, setRevealedToken] = useState(null);
  const [revoking, setRevoking] = useState(null);
  const revealTimerRef = useRef(null);

  const clearReveal = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    setRevealedToken(null);
  }, []);

  const showReveal = useCallback(
    (token) => {
      clearReveal();
      setRevealedToken(token);
      revealTimerRef.current = window.setTimeout(clearReveal, REVEAL_MS);
    },
    [clearReveal],
  );

  const loadDashboard = useCallback(async (accessToken) => {
    if (!accessToken) return;
    setDashboardLoading(true);
    setPortalError('');
    try {
      const [statsData, tokensData, sessionsData] = await Promise.all([
        fetchPortalStats(accessToken),
        fetchPortalTokens(accessToken),
        fetchPortalSessions(accessToken),
      ]);
      setOrgName(statsData.orgName ?? '');
      setTier(statsData.tier ?? '');
      setStats(statsData.stats ?? { tokensIssued: 0, tokensActivated: 0, sessionsCompleted: 0 });
      setTokens(tokensData.tokens ?? []);
      setSessions(sessionsData.sessions ?? []);
    } catch (err) {
      if (err.status === 401) {
        setOrgName('');
        setPortalError('No provider account linked to this email.');
      } else {
        setPortalError('Could not load dashboard. Try again.');
      }
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.access_token) {
        loadDashboard(data.session.access_token);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        loadDashboard(nextSession.access_token);
      } else {
        setOrgName('');
        setTier('');
        setTokens([]);
        setSessions([]);
        clearReveal();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      clearReveal();
    };
  }, [loadDashboard, clearReveal]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setAuthError('');
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleSignOut = async () => {
    clearReveal();
    await supabase?.auth.signOut();
  };

  const handleGenerate = async (payload) => {
    if (!session?.access_token || generating) return;
    setGenerating(true);
    setPortalError('');
    try {
      const result = await generatePortalToken(session.access_token, payload);
      if (result?.token?.token) {
        showReveal(result.token.token);
      }
      await loadDashboard(session.access_token);
    } catch {
      setPortalError('Token generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyReveal = () => {
    if (revealedToken) {
      navigator.clipboard.writeText(revealedToken).catch(() => {});
    }
  };

  const handleRevoke = async (token) => {
    if (!session?.access_token || revoking) return;
    setRevoking(token);
    try {
      await revokePortalToken(session.access_token, token);
      await loadDashboard(session.access_token);
    } catch {
      setPortalError('Could not revoke token.');
    } finally {
      setRevoking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BRAND.void, color: BRAND.boneDim }}>
        <p className="font-sans text-[10px] uppercase tracking-[0.3em]">Loading</p>
      </div>
    );
  }

  if (!session) {
    return (
      <ProviderPortalLogin
        email={email}
        password={password}
        authError={authError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSignIn}
      />
    );
  }

  if (!orgName && !dashboardLoading && portalError) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: BRAND.void, color: BRAND.bone }}>
        <header className="flex items-center justify-between border-b border-white/[0.08] px-8 py-6">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.42em]" style={{ color: BRAND.clay }}>
            Surge Portal
          </p>
          <button type="button" onClick={handleSignOut} className="font-sans text-[10px] uppercase tracking-[0.2em]" style={{ color: BRAND.boneDim }}>
            Sign out
          </button>
        </header>
        <main className="mx-auto max-w-lg px-8 py-16">
          <p className="font-sans text-sm" style={{ color: BRAND.boneMuted }}>{portalError}</p>
          <p className="mt-4 font-sans text-sm" style={{ color: BRAND.boneDim }}>
            No provider account linked to this email. Contact Surge to provision access.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: BRAND.void, color: BRAND.bone }}>
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 80% 50% at 50% -20%, ${BRAND.emberGlow}, transparent 55%)` }}
      />

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.08] px-6 py-5 sm:px-8">
        <div>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.38em]" style={{ color: BRAND.clay }}>
            Surge Portal
          </p>
          <p className="mt-1 font-sans text-sm font-medium">{orgName || '…'}</p>
          {tier ? (
            <p className="font-sans text-[10px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
              {tier} tier
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="font-sans text-[10px] uppercase tracking-[0.2em] transition-colors hover:text-[#B6502E]"
          style={{ color: BRAND.boneDim }}
        >
          Sign out
        </button>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-10 sm:px-8 sm:py-12">
        {portalError ? (
          <p className="mb-6 font-sans text-xs" style={{ color: BRAND.clay }}>{portalError}</p>
        ) : null}

        <ProviderStatsBar stats={stats} />

        <div className="mt-10 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ProviderGenerateForm
              generating={generating}
              revealedToken={revealedToken}
              onGenerate={handleGenerate}
              onCopy={handleCopyReveal}
            />
          </div>

          <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6 lg:col-span-3">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
                Token inventory
              </h2>
              {dashboardLoading ? (
                <span className="font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
                  Updating…
                </span>
              ) : null}
            </div>
            <ProviderTokenTable tokens={tokens} revoking={revoking} onRevoke={handleRevoke} />
          </section>
        </div>

        <section className="mt-10 rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
            Recent sessions
          </h2>
          <ProviderSessionsTable sessions={sessions} />
        </section>
      </main>
    </div>
  );
}
