import { Link } from 'react-router-dom';
import { BRAND } from '../../brand/tokens';

export default function ProviderPortalLogin({
  email,
  password,
  authError,
  resetSent,
  resetError,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  supabaseConfigured = true,
}) {
  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: BRAND.void, color: BRAND.bone }}>
        <header className="border-b border-white/[0.08] px-8 py-6">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.42em]" style={{ color: BRAND.clay }}>
            Surge Portal
          </p>
        </header>
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-8 py-16">
          <h1 className="mb-2 font-sans text-2xl font-extrabold tracking-tight">Configuration required</h1>
          <p className="font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            Supabase environment variables are not set for this deployment. Contact your administrator
            to configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
          <Link
            to="/for-providers"
            className="mt-6 inline-block font-sans text-[11px] uppercase tracking-[0.18em] underline"
            style={{ color: BRAND.clay }}
          >
            Back to providers
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: BRAND.void, color: BRAND.bone }}>
      <header className="border-b border-white/[0.08] px-8 py-6">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.42em]" style={{ color: BRAND.clay }}>
          Surge Portal
        </p>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-8 py-16">
        <h1 className="mb-2 font-sans text-2xl font-extrabold tracking-tight">Provider access</h1>
        <p className="mb-10 font-sans text-sm" style={{ color: BRAND.boneMuted }}>
          Issue clinical tokens and monitor session activity.
        </p>
        <form onSubmit={onSubmit} className="space-y-5">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full border border-white/[0.1] bg-black/40 px-4 py-3.5 font-sans text-sm text-white placeholder:text-white/30 focus:border-[#B6502E]/60 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full border border-white/[0.1] bg-black/40 px-4 py-3.5 font-sans text-sm text-white placeholder:text-white/30 focus:border-[#B6502E]/60 focus:outline-none"
          />
          {authError ? (
            <p className="font-sans text-xs" style={{ color: BRAND.boneMuted }}>{authError}</p>
          ) : null}
          {resetSent ? (
            <p className="font-sans text-xs" style={{ color: '#8FB596' }}>
              Password reset email sent. Check your inbox.
            </p>
          ) : null}
          {resetError ? (
            <p className="font-sans text-xs" style={{ color: BRAND.clay }}>{resetError}</p>
          ) : null}
          <button
            type="submit"
            className="w-full border px-6 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] transition-colors hover:brightness-110"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}12` }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={onForgotPassword}
            className="w-full font-sans text-[10px] uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Forgot password
          </button>
        </form>
      </main>
    </div>
  );
}
