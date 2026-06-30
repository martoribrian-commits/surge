import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import {
  MarketingShell,
  MarketingCtaBand,
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

export default function ClinicalTokenPage() {
  usePageMeta(PAGE_META.token);
  const navigate = useNavigate();
  const { validateToken, isLoading, error, isCraneUnlocked } = useTokenManager();
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const result = await validateToken(input);
      if (result.valid) navigate('/start');
    },
    [input, validateToken, navigate],
  );

  return (
    <MarketingShell glow="cool">
      <div className="mx-auto max-w-lg px-5 py-[max(1.25rem,env(safe-area-inset-top))]">
        <SiteHeader />

        <motion.div {...fadeUp} className="pb-8 pt-4 text-center">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Clinical access
          </p>
          <h1 className="mt-3 font-sans text-2xl font-extrabold tracking-tight">Enter your token</h1>
        </motion.div>

        {/* Step strip */}
        <motion.div {...fadeUp} className="mb-10 flex justify-center gap-2">
          {STEPS.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full font-sans text-[10px] font-bold"
                style={{
                  background: i === 0 ? `${BRAND.clay}22` : 'rgba(255,255,255,0.04)',
                  color: i === 0 ? BRAND.clay : BRAND.boneDim,
                }}
              >
                {step.n}
              </span>
              <span className="hidden font-sans text-[9px] uppercase tracking-[0.14em] sm:inline" style={{ color: BRAND.boneDim }}>
                {step.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span className="mx-1 hidden h-px w-6 bg-white/10 sm:block" aria-hidden />
              ) : null}
            </div>
          ))}
        </motion.div>

        <DecayHero compact className="mx-auto mb-8 max-w-xs py-2" />

        <motion.form {...fadeUp} onSubmit={handleSubmit} className="space-y-6">
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

          {isCraneUnlocked ? (
            <p className="text-center font-sans text-sm" style={{ color: BRAND.boneMuted }}>
              Crane unlocked on this device.
            </p>
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

        <p className="mt-6 text-center font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
          From your clinician. No account required.
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

      <MarketingCtaBand primaryHref="/start" primaryLabel="Try without a token" secondaryHref="/for-providers" secondaryLabel="For providers" />
      <SiteFooter />
    </MarketingShell>
  );
}
