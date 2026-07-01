import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import {
  MarketingShell,
  SiteFooter,
  TokenSlotInput,
  fadeUp,
} from '../components/marketing';
import { useTokenManager } from '../hooks/useTokenManager';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

const STEPS = [
  { n: '1', label: 'Enter token' },
  { n: '2', label: 'Unlock Crane' },
  { n: '3', label: 'Start sequence' },
];

function stepState(index, unlocked) {
  if (unlocked) {
    if (index < 2) return 'complete';
    return 'active';
  }
  if (index === 0) return 'active';
  return 'pending';
}

export default function ClinicalTokenPage() {
  usePageMeta(PAGE_META.token);
  const navigate = useNavigate();
  const { validateToken, isLoading, error, isCraneUnlocked } = useTokenManager();
  const [input, setInput] = useState('');
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [tokenMeta, setTokenMeta] = useState(null);

  const unlocked = isCraneUnlocked || justUnlocked;

  const formatExpiry = (iso) => {
    if (!iso) return 'No expiry set';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (unlocked) {
        navigate('/start');
        return;
      }
      const result = await validateToken(input);
      if (result.valid) {
        setJustUnlocked(true);
        setTokenMeta({
          usesRemaining: result.usesRemaining,
          expiresAt: result.expiresAt,
        });
      }
    },
    [input, validateToken, navigate, unlocked],
  );

  return (
    <MarketingShell glow="cool">
      <div className="mx-auto max-w-lg px-5 py-[max(1.25rem,env(safe-area-inset-top))]">
        <SiteHeader />

        <motion.div {...fadeUp} className="pb-8 pt-4 text-center">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Clinical access
          </p>
          <h1 className="mt-3 font-sans text-2xl font-extrabold tracking-tight">
            {unlocked ? 'Crane unlocked' : 'Enter your token'}
          </h1>
        </motion.div>

        <motion.div {...fadeUp} className="mb-10 flex justify-center gap-2">
          {STEPS.map((step, i) => {
            const state = stepState(i, unlocked);
            return (
              <div key={step.n} className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full font-sans text-[10px] font-bold"
                  style={{
                    background:
                      state === 'complete'
                        ? `${BRAND.clay}33`
                        : state === 'active'
                          ? `${BRAND.clay}22`
                          : 'rgba(255,255,255,0.04)',
                    color: state === 'pending' ? BRAND.boneDim : BRAND.clay,
                  }}
                >
                  {state === 'complete' ? '✓' : step.n}
                </span>
                <span
                  className="hidden font-sans text-[9px] uppercase tracking-[0.14em] sm:inline"
                  style={{ color: state === 'pending' ? BRAND.boneDim : BRAND.boneMuted }}
                >
                  {step.label}
                </span>
                {i < STEPS.length - 1 ? (
                  <span className="mx-1 hidden h-px w-6 bg-white/10 sm:block" aria-hidden />
                ) : null}
              </div>
            );
          })}
        </motion.div>

        <DecayHero compact className="mx-auto mb-8 max-w-xs py-2" />

        {unlocked ? (
          <motion.div {...fadeUp} className="space-y-6 text-center">
            <p className="font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
              Post-session Crane is ready on this device. Your token unlocks care plans, body insights,
              and guided decompression after sequences.
            </p>
            {tokenMeta ? (
              <div className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left font-sans text-xs" style={{ color: BRAND.boneDim }}>
                {tokenMeta.usesRemaining != null ? (
                  <p>Uses remaining on this device: {tokenMeta.usesRemaining}</p>
                ) : null}
                <p className={tokenMeta.usesRemaining != null ? 'mt-1' : ''}>
                  Expires: {formatExpiry(tokenMeta.expiresAt)}
                </p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => navigate('/start')}
              className="w-full border py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-all hover:brightness-110"
              style={{
                borderColor: `${BRAND.clay}66`,
                background: `${BRAND.clay}15`,
                color: BRAND.bone,
              }}
            >
              Continue to sequences
            </button>
            {!isCraneUnlocked ? (
              <button
                type="button"
                onClick={() => setJustUnlocked(false)}
                className="font-sans text-[11px] uppercase tracking-[0.14em] transition-colors hover:text-[#B6502E]"
                style={{ color: BRAND.boneDim }}
              >
                Enter a different token
              </button>
            ) : null}
          </motion.div>
        ) : (
          <motion.form {...fadeUp} onSubmit={handleSubmit} className="space-y-6">
            <p className="text-center font-sans text-xs leading-relaxed" style={{ color: BRAND.boneDim }}>
              Six characters from your clinician. Unlocks Crane after sequences on this device only.
            </p>
            <TokenSlotInput value={input} onChange={setInput} disabled={isLoading} />

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center font-sans text-sm"
                style={{ color: BRAND.clay }}
                role="alert"
              >
                {error}
              </motion.p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || input.length !== 6}
              className="w-full border py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-all hover:brightness-110 disabled:opacity-40"
              style={{
                borderColor: `${BRAND.clay}66`,
                background: `${BRAND.clay}15`,
                color: BRAND.bone,
              }}
            >
              {isLoading ? 'Validating…' : 'Unlock Crane'}
            </button>
          </motion.form>
        )}

        <p className="mt-6 text-center font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
          From your clinician.{' '}
          <Link to="/for-providers" className="underline underline-offset-2 hover:text-[#B6502E]">
            Request access
          </Link>
        </p>

        <div className="mt-8 flex justify-center gap-6 pb-12">
          <Link
            to="/start"
            className="font-sans text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Sequences
          </Link>
          <Link
            to="/faq"
            className="font-sans text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            FAQ
          </Link>
        </div>
      </div>

      <SiteFooter />
    </MarketingShell>
  );
}
