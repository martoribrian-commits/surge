import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSequenceSession } from '../context/SequenceSessionProvider';
import { SequencePicker, SequencePreview } from '../components/sequence';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import { getVariant } from '../sequences';

const HEADLINE_BY_SECONDS = {
  30: 'Thirty seconds\nto reset your nervous system.',
  60: 'Sixty seconds\nto reset your nervous system.',
  90: 'Ninety seconds\nto reset your nervous system.',
};

const SUBHEAD_BY_MODE = {
  auto: 'Double inhale, long exhale — runs automatically once you begin.',
  bilateral: 'Alternate left and right taps to integrate hemispheres.',
  hold: 'Press and hold through one guided cycle. Release to pause.',
};

/**
 * Entry — marketing hero + 30/60/90 picker + live preview.
 */
export default function SequenceEntryView() {
  const { variantId, selectVariant, beginRegulation } = useSequenceSession();
  const variant = getVariant(variantId);
  const headline = HEADLINE_BY_SECONDS[variant.durationSeconds] ?? HEADLINE_BY_SECONDS[90];
  const subhead = SUBHEAD_BY_MODE[variant.interactionMode] ?? SUBHEAD_BY_MODE.hold;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[#120a06] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(182,80,46,0.14)_0%,transparent_55%)]" />
      </div>
      <FilmGrainOverlay />

      <motion.div
        className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-[max(1.25rem,env(safe-area-inset-top))] pb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <SiteHeader />

        <div className="mb-6 text-center">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
            Somatic circuit breaker
          </p>
          <motion.h1
            key={variant.durationSeconds}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-3 whitespace-pre-line font-sans text-[clamp(1.65rem,4.5vw,2.35rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#F4F0EB]"
          >
            {headline}
          </motion.h1>
          <motion.p
            key={variant.id + '-sub'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-3 max-w-md font-sans text-sm leading-relaxed text-white/45"
          >
            When your body will not wait for an appointment. Secular. Private. No account.{' '}
            {subhead}
          </motion.p>
        </div>

        <DecayHero className="mb-6 py-2" compact />

        <div className="mb-6">
          <SequencePreview variantId={variantId} />
        </div>

        <SequencePicker activeId={variantId} onSelect={selectVariant} />

        <div className="mt-auto pt-8">
          <motion.button
            type="button"
            className="group relative w-full overflow-hidden border px-6 py-5 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-[#F4F0EB]"
            style={{
              borderColor: `${variant.palette.accent}66`,
              background: `linear-gradient(135deg, ${variant.palette.accent}22, ${variant.palette.accentCalm ?? variant.palette.accent}12)`,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.985 }}
            onClick={beginRegulation}
          >
            <span className="relative">Begin {variant.durationSeconds}s cycle</span>
          </motion.button>

          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              to="/clinical-token"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-[#B6502E]"
            >
              I have a token
            </Link>
            <p className="text-center font-sans text-[10px] tracking-[0.08em] text-white/25">
              Tap 30, 60, or 90 above — preview updates instantly
            </p>
          </div>

          <nav
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            aria-label="Legal and support"
          >
            {[
              { href: '/how-it-works', label: 'Science' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/support', label: 'Support' },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="font-sans text-[10px] uppercase tracking-[0.18em] text-white/25 transition-colors hover:text-[#B6502E]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </motion.div>
    </div>
  );
}
