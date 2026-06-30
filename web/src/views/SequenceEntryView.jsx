import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { useCraneOptional } from '../context/CraneProvider';
import { unlockAudioContext } from '../lib/proceduralAudio/shared';
import { SequencePicker, SequencePreview } from '../components/sequence';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import { MarketingShell, SiteFooter } from '../components/marketing';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';
import { getVariant } from '../sequences';

const HEADLINE_BY_SECONDS = {
  30: 'Thirty seconds\nto bring your body back down.',
  60: 'Sixty seconds\nto bring your body back down.',
  90: 'Ninety seconds\nto bring your body back down.',
};

export default function SequenceEntryView() {
  usePageMeta({
    title: 'Start · Surge',
    description: PAGE_META.home.description,
  });

  const { variantId, selectVariant, beginRegulation } = useSequenceSession();
  const crane = useCraneOptional();
  const variant = getVariant(variantId);
  const headline = HEADLINE_BY_SECONDS[variant.durationSeconds] ?? HEADLINE_BY_SECONDS[90];

  return (
    <MarketingShell>
      <motion.div
        className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl flex-col px-5 py-[max(1.25rem,env(safe-area-inset-top))] pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <SiteHeader />

        <div className="mb-5 text-center">
          <p
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: BRAND.clay }}
          >
            Somatic circuit breaker
          </p>
          <motion.h1
            key={variant.durationSeconds}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 whitespace-pre-line font-sans text-[clamp(1.65rem,4.5vw,2.35rem)] font-extrabold leading-[1.08] tracking-[-0.03em]"
            style={{ color: BRAND.bone }}
          >
            {headline}
          </motion.h1>
          <motion.p
            key={variant.id + '-sub'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed"
            style={{ color: BRAND.boneMuted }}
          >
            When your body will not wait for an appointment. No account. No jargon. Pick the
            sequence that matches what you feel right now, or{' '}
            {crane ? (
              <button
                type="button"
                onClick={crane.openCrane}
                className="underline decoration-[#B6502E]/50 underline-offset-2 transition-colors hover:text-[#B6502E]"
              >
                ask Crane
              </button>
            ) : (
              <Link
                to="/crane"
                className="underline decoration-[#B6502E]/50 underline-offset-2 transition-colors hover:text-[#B6502E]"
              >
                ask Crane
              </Link>
            )}{' '}
            to explain which one fits.
          </motion.p>
        </div>

        <DecayHero className="mb-5 py-2" compact />

        <div className="mb-5 overflow-hidden rounded-sm border border-white/[0.08]">
          <SequencePreview variantId={variantId} />
        </div>

        <SequencePicker activeId={variantId} onSelect={selectVariant} />

        <div className="mt-auto pt-8">
          <motion.button
            type="button"
            className="w-full border px-6 py-5 font-sans text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{
              color: BRAND.bone,
              borderColor: `${variant.palette.accent}66`,
              background: `linear-gradient(135deg, ${variant.palette.accent}22, ${variant.palette.accentCalm ?? variant.palette.accent}12)`,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => {
              unlockAudioContext();
              beginRegulation();
            }}
          >
            Begin {variant.durationSeconds}s · {variant.name}
          </motion.button>

          <p className="mt-3 text-center font-sans text-[10px] tracking-[0.08em]" style={{ color: BRAND.boneDim }}>
            Headphones help · Exit anytime from the session header
          </p>

          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              to="/clinical-token"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneDim }}
            >
              I have a token
            </Link>
          </div>
        </div>
      </motion.div>

      <SiteFooter />
    </MarketingShell>
  );
}
