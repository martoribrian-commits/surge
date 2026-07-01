import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  fetchPortalStats,
  fetchPortalTokens,
  fetchPortalSessions,
  fetchPortalTeam,
  fetchPortalSessionDetail,
  acceptPortalInvite,
  exportPortalSessions,
  generatePortalToken,
  revokePortalToken,
} from '../lib/portalClient';
import ProviderPortalLogin from './portal/ProviderPortalLogin';
import ProviderStatsBar from './portal/ProviderStatsBar';
import ProviderGenerateForm from './portal/ProviderGenerateForm';
import ProviderTokenTable from './portal/ProviderTokenTable';
import ProviderSessionsTable from './portal/ProviderSessionsTable';
import ProviderVariantBreakdown from './portal/ProviderVariantBreakdown';
import ProviderOnboardingGuide from './portal/ProviderOnboardingGuide';
import ProviderSessionFilters, { EMPTY_SESSION_FILTERS } from './portal/ProviderSessionFilters';
import ProviderTeamStrip from './portal/ProviderTeamStrip';
import ProviderSessionDetail from './portal/ProviderSessionDetail';
import ProviderInvitePanel from './portal/ProviderInvitePanel';
import ProviderPortalNav from './portal/ProviderPortalNav';
import ProviderCaseloadPanel from './portal/ProviderCaseloadPanel';
import ProviderAnalyticsChart from './portal/ProviderAnalyticsChart';
import ProviderSettingsPanel from './portal/ProviderSettingsPanel';
import { BRAND } from '../brand/tokens';
import { Link } from 'react-router-dom';

const REVEAL_MS = 10_000;
const ONBOARDING_KEY = 'surge.portal.onboardingDismissed';

/**
 * Provider portal — Netlify API + Supabase Auth. Service role only on backend.
 */
export default function ProviderPortal() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [portalError, setPortalError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [orgName, setOrgName] = useState('');
  const [tier, setTier] = useState('');
  const [teamSize, setTeamSize] = useState(1);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    tokensIssued: 0,
    tokensActivated: 0,
    sessionsCompleted: 0,
    sessionsInterrupted: 0,
    sessionsLast7Days: 0,
    completionRate: null,
    variantBreakdown: {},
  });
  const [tokens, setTokens] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [sessionsHasMore, setSessionsHasMore] = useState(false);
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const [sessionFilters, setSessionFilters] = useState({ ...EMPTY_SESSION_FILTERS });
  const [exporting, setExporting] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch {
      return false;
    }
  });

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

  const loadDashboard = useCallback(async (accessToken, filters) => {
    if (!accessToken) return;
    setDashboardLoading(true);
    setPortalError('');
    try {
      const [statsData, tokensData, sessionsData, teamData] = await Promise.all([
        fetchPortalStats(accessToken),
        fetchPortalTokens(accessToken),
        fetchPortalSessions(accessToken, filters),
        fetchPortalTeam(accessToken),
      ]);
      setOrgName(statsData.orgName ?? '');
      setTier(statsData.tier ?? '');
      setTeamSize(statsData.teamSize ?? 1);
      setIsAdmin(Boolean(statsData.isAdmin));
      setStats(statsData.stats ?? {
        tokensIssued: 0,
        tokensActivated: 0,
        sessionsCompleted: 0,
        sessionsInterrupted: 0,
        sessionsLast7Days: 0,
        completionRate: null,
        variantBreakdown: {},
      });
      setTokens(tokensData.tokens ?? []);
      setSessions(sessionsData.sessions ?? []);
      setSessionsHasMore(Boolean(sessionsData.hasMore));
      setTeamMembers(teamData.members ?? []);
    } catch (err) {
      if (err.status === 401) {
        try {
          await acceptPortalInvite(accessToken);
          return loadDashboard(accessToken, filters);
        } catch {
          setOrgName('');
          setPortalError('No provider account linked to this email.');
        }
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
        loadDashboard(data.session.access_token, EMPTY_SESSION_FILTERS);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.access_token) {
        loadDashboard(nextSession.access_token, EMPTY_SESSION_FILTERS);
      } else {
        setOrgName('');
        setTier('');
        setTokens([]);
        setSessions([]);
        setTeamMembers([]);
        clearReveal();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      clearReveal();
    };
  }, [loadDashboard, clearReveal]);

  useEffect(() => {
    if (!session?.access_token) return;
    const timer = window.setTimeout(() => {
      loadDashboard(session.access_token, { ...sessionFilters, offset: 0 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [sessionFilters, session?.access_token, loadDashboard]);

  const handleLoadMoreSessions = async () => {
    if (!session?.access_token || loadingMoreSessions || !sessionsHasMore) return;
    setLoadingMoreSessions(true);
    try {
      const data = await fetchPortalSessions(session.access_token, {
        ...sessionFilters,
        offset: sessions.length,
      });
      setSessions((prev) => [...prev, ...(data.sessions ?? [])]);
      setSessionsHasMore(Boolean(data.hasMore));
    } catch {
      setPortalError('Could not load more sessions.');
    } finally {
      setLoadingMoreSessions(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetSent(false);
    setResetError('');
    if (!supabase || !email.trim()) {
      setResetError('Enter your email above, then tap Forgot password.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/portal`,
    });
    if (error) setResetError(error.message);
    else setResetSent(true);
  };

  const sessionsFiltered = Boolean(
    sessionFilters.variant ||
      sessionFilters.completion ||
      sessionFilters.from ||
      sessionFilters.to ||
      sessionFilters.token,
  );

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
      await loadDashboard(session.access_token, sessionFilters);
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
      await loadDashboard(session.access_token, sessionFilters);
    } catch {
      setPortalError('Could not revoke token.');
    } finally {
      setRevoking(null);
    }
  };

  const handleExport = async () => {
    if (!session?.access_token || exporting) return;
    setExporting(true);
    setPortalError('');
    try {
      const blob = await exportPortalSessions(session.access_token, sessionFilters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `surge-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setPortalError('Export failed. Try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleDismissOnboarding = () => {
    setOnboardingDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      /* ignore */
    }
  };

  const showOnboarding = stats.tokensIssued === 0 && !onboardingDismissed;

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
        resetSent={resetSent}
        resetError={resetError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSignIn}
        onForgotPassword={handleForgotPassword}
        supabaseConfigured={Boolean(supabase)}
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
            No provider account linked to this email.{' '}
            <Link to="/for-providers#contact" className="underline hover:text-[#B6502E]">
              Request access
            </Link>
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
              {tier} tier{teamSize > 1 ? ` · ${teamSize} clinicians` : ''}
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

        {showOnboarding && activeTab === 'dashboard' ? (
          <ProviderOnboardingGuide onDismiss={handleDismissOnboarding} />
        ) : null}

        <ProviderPortalNav activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 'dashboard' ? (
          <>
        <ProviderTeamStrip members={teamMembers} teamSize={teamSize} isAdmin={isAdmin} />

        <ProviderInvitePanel accessToken={session?.access_token} isAdmin={isAdmin} />

        <ProviderStatsBar stats={stats} />

        <div className="mt-8">
          <ProviderAnalyticsChart accessToken={session?.access_token} days={30} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <ProviderVariantBreakdown breakdown={stats.variantBreakdown} />
        </div>

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
            <ProviderTokenTable
              tokens={tokens}
              revoking={revoking}
              onRevoke={handleRevoke}
              showIssuer={teamSize > 1}
              onFilterSessions={(token) =>
                setSessionFilters((prev) => ({ ...prev, token, offset: 0 }))
              }
            />
          </section>
        </div>

        <section className="mt-10 rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
          <h2 className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
            Recent sessions
          </h2>
          <ProviderSessionFilters
            filters={sessionFilters}
            onChange={setSessionFilters}
            onExport={handleExport}
            exporting={exporting}
          />
          <ProviderSessionsTable
            sessions={sessions}
            filtered={sessionsFiltered}
            onSelectSession={setSelectedSessionId}
          />
          {sessionsHasMore ? (
            <div className="mt-4 text-center">
              <button
                type="button"
                disabled={loadingMoreSessions}
                onClick={handleLoadMoreSessions}
                className="font-sans text-[10px] uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E] disabled:opacity-40"
                style={{ color: BRAND.boneDim }}
              >
                {loadingMoreSessions ? 'Loading…' : 'Load more sessions'}
              </button>
            </div>
          ) : null}
        </section>
          </>
        ) : null}

        {activeTab === 'caseload' ? (
          <ProviderCaseloadPanel
            accessToken={session?.access_token}
            onFilterToken={(token) => {
              setSessionFilters((prev) => ({ ...prev, token, offset: 0 }));
              setActiveTab('dashboard');
            }}
          />
        ) : null}

        {activeTab === 'settings' ? (
          <ProviderSettingsPanel
            accessToken={session?.access_token}
            onProfileUpdated={(profile) => {
              setOrgName(profile.orgName ?? orgName);
              loadDashboard(session.access_token, sessionFilters);
            }}
          />
        ) : null}

        <ProviderSessionDetail
          sessionId={selectedSessionId}
          accessToken={session?.access_token}
          onClose={() => setSelectedSessionId(null)}
          fetchDetail={fetchPortalSessionDetail}
        />
      </main>
    </div>
  );
}
