import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { generateClinicalToken } from '../lib/clinicalToken';

/**
 * Provider portal — token inventory, generation, activation stats.
 * Supabase Auth email/password only. Brutally simple.
 */
export default function ProviderPortal() {
  const [session, setSession] = useState(null);
  const [provider, setProvider] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [expiryDays, setExpiryDays] = useState(30);
  const [useCount, setUseCount] = useState(1);
  const [patientAlias, setPatientAlias] = useState('');

  const loadProviderData = useCallback(async (userId) => {
    if (!supabase) return;

    const { data: providerRow, error: providerError } = await supabase
      .from('providers')
      .select('id, name, org_name, tier, active')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (providerError || !providerRow) {
      setProvider(null);
      setTokens([]);
      return;
    }

    setProvider(providerRow);

    const { data: tokenRows } = await supabase
      .from('clinical_tokens')
      .select('token, patient_alias, issued_at, activated_at, expires_at, uses_remaining')
      .eq('provider_id', providerRow.id)
      .order('issued_at', { ascending: false });

    setTokens(tokenRows ?? []);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProviderData(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProviderData(nextSession.user.id);
      } else {
        setProvider(null);
        setTokens([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProviderData]);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setAuthError('');
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
  };

  const handleSignOut = async () => {
    await supabase?.auth.signOut();
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!supabase || !provider || generating) return;

    setGenerating(true);
    const token = generateClinicalToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + Number(expiryDays));

    const { error } = await supabase.from('clinical_tokens').insert({
      token,
      provider_id: provider.id,
      patient_alias: patientAlias.trim() || null,
      expires_at: expiresAt.toISOString(),
      uses_remaining: Number(useCount),
    });

    if (!error) {
      setPatientAlias('');
      await loadProviderData(session.user.id);
    }

    setGenerating(false);
  };

  const activatedCount = tokens.filter((t) => t.activated_at).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-gray-500">
        <p className="text-xs uppercase tracking-[0.3em]">Loading.</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <header className="border-b border-[#222] px-8 py-6">
          <p className="text-xs uppercase tracking-[0.45em]">Surge Portal</p>
        </header>
        <main className="mx-auto w-full max-w-md flex-1 px-8 py-16">
          <h1 className="mb-8 text-sm uppercase tracking-[0.25em] text-gray-500">Provider sign in</h1>
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full border border-[#222] bg-black px-4 py-3 text-sm tracking-wide text-white placeholder:text-gray-600 focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full border border-[#222] bg-black px-4 py-3 text-sm tracking-wide text-white placeholder:text-gray-600 focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
            {authError && (
              <p className="text-xs tracking-wide text-gray-500">{authError}</p>
            )}
            <button
              type="submit"
              className="border border-[#222] px-6 py-3 text-xs uppercase tracking-[0.3em] text-white hover:border-[#fbbf24] hover:text-[#fbbf24]"
            >
              Sign in
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        <header className="flex items-center justify-between border-b border-[#222] px-8 py-6">
          <p className="text-xs uppercase tracking-[0.45em]">Surge Portal</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:text-white"
          >
            Sign out
          </button>
        </header>
        <main className="mx-auto w-full max-w-lg px-8 py-16">
          <p className="text-sm tracking-wide text-gray-500">
            No provider account linked to this email. Contact Surge to provision access.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-between border-b border-[#222] px-8 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.45em]">Surge Portal</p>
          <p className="mt-1 text-[10px] tracking-[0.15em] text-gray-600">
            {provider.org_name} · {provider.tier}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="text-[10px] uppercase tracking-[0.2em] text-gray-600 hover:text-white"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-8 py-12">
        {/* Stats */}
        <div className="mb-12 grid grid-cols-3 gap-px border border-[#222] bg-[#222]">
          {[
            { label: 'Issued', value: tokens.length },
            { label: 'Activated', value: activatedCount },
            { label: 'Pending', value: tokens.length - activatedCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-black px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gray-600">{stat.label}</p>
              <p className="mt-2 text-2xl font-light tracking-wide">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Generate */}
        <section className="mb-12 border border-[#222] p-6">
          <h2 className="mb-6 text-[10px] uppercase tracking-[0.35em] text-gray-600">
            Generate token
          </h2>
          <form onSubmit={handleGenerate} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Expiry (days)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full border border-[#222] bg-black px-3 py-2 text-sm text-white focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Use count
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={useCount}
                onChange={(e) => setUseCount(e.target.value)}
                className="w-full border border-[#222] bg-black px-3 py-2 text-sm text-white focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-gray-600">
                Patient alias (internal only)
              </label>
              <input
                type="text"
                value={patientAlias}
                onChange={(e) => setPatientAlias(e.target.value)}
                placeholder="Optional"
                className="w-full border border-[#222] bg-black px-3 py-2 text-sm text-white placeholder:text-gray-700 focus:border-[#fbbf24] focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={generating}
                className="border border-[#222] px-6 py-3 text-xs uppercase tracking-[0.3em] hover:border-[#fbbf24] hover:text-[#fbbf24] disabled:opacity-40"
              >
                {generating ? 'Generating.' : 'Generate token'}
              </button>
            </div>
          </form>
        </section>

        {/* Inventory */}
        <section>
          <h2 className="mb-4 text-[10px] uppercase tracking-[0.35em] text-gray-600">
            Token inventory
          </h2>
          {tokens.length === 0 ? (
            <p className="text-sm text-gray-600">No tokens issued.</p>
          ) : (
            <div className="border border-[#222]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#222] text-[10px] uppercase tracking-[0.2em] text-gray-600">
                    <th className="px-4 py-3 font-normal">Token</th>
                    <th className="px-4 py-3 font-normal">Status</th>
                    <th className="px-4 py-3 font-normal">Uses</th>
                    <th className="px-4 py-3 font-normal">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((row) => {
                    const expired = new Date(row.expires_at) < new Date();
                    const status = expired
                      ? 'Expired'
                      : row.activated_at
                        ? 'Activated'
                        : 'Pending';
                    return (
                      <tr key={row.token} className="border-b border-[#222] last:border-0">
                        <td className="px-4 py-3 font-mono tracking-widest">{row.token}</td>
                        <td className="px-4 py-3 text-gray-500">{status}</td>
                        <td className="px-4 py-3 text-gray-500">{row.uses_remaining}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(row.expires_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
