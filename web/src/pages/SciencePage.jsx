import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { useCraneOptional } from '../context/CraneProvider';
import { VARIANT_LIST } from '../sequences';

const SECTIONS = [
  {
    id: 'problem',
    label: 'The problem',
    summary: 'When stress peaks, thinking stops working.',
    body: [
      'At full activation your body is in alarm mode. Heart rate up, breathing shallow, muscles tight. In that state, "just calm down" or "think rationally" does not land — your brain literally does not have the bandwidth.',
      'Most apps make it worse: log in, track your mood, read a paragraph, choose from twelve options. Surge does the opposite. One sequence. One interaction. Thirty to ninety seconds.',
    ],
  },
  {
    id: 'window',
    label: 'The window',
    summary: 'Your body can still come down — if you give it a path.',
    body: [
      'There is a short window after a spike when your nervous system can still be guided back without medication. Surge is built for that window.',
      'Five sequences, each tuned to a different body state: racing heart, stuck thoughts, wired exhaustion, full overwhelm, or restless agitation. Pick the one that matches what you feel.',
    ],
  },
  {
    id: 'mechanism',
    label: 'What actually happens',
    summary: 'Sound, visuals, and touch follow one downshift curve.',
    body: [
      'Each sequence uses breath, bilateral tapping, or press-and-hold contact — paired with sound and visuals that start where you are and fade toward calm on a fixed timeline.',
      'Nothing to score. Nothing to optimize. You hold on (or tap, or breathe) and the system walks your arousal down. Exit anytime from the header.',
    ],
  },
  {
    id: 'crane',
    label: 'Crane',
    summary: 'Plain-language help, anywhere on the site.',
    body: [
      'Crane explains what each sequence does for your body — without clinical jargon. Not sure which one fits? Ask before you begin. Finished a cycle and something came up? Crane is there after, too.',
      'Guide mode works without an account. Deeper post-session support is available with a clinical token from your provider. Everything stays on your device unless you choose otherwise.',
    ],
  },
];

const INTERACTION_COPY = {
  auto: 'Starts on its own',
  bilateral: 'Tap left · right',
  hold: 'Press and hold',
};

export default function SciencePage() {
  const [activeSection, setActiveSection] = useState('problem');
  const [hoverVariant, setHoverVariant] = useState(null);
  const crane = useCraneOptional();
  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] text-[#F4F0EB]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(182,80,46,0.12) 0%, transparent 55%)',
        }}
      />
      <FilmGrainOverlay />

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-[max(1.5rem,env(safe-area-inset-top))] pb-16">
        <SiteHeader />

        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col items-center lg:sticky lg:top-8 lg:self-start">
            <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
              How it works
            </p>
            <DecayHero className="mb-8 py-4" />

            <div className="w-full space-y-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Five sequences — pick by body state
              </p>
              {VARIANT_LIST.map((variant) => {
                const active = hoverVariant === variant.id;
                return (
                  <Link
                    key={variant.id}
                    to={`/engine/${variant.id}`}
                    onMouseEnter={() => setHoverVariant(variant.id)}
                    onMouseLeave={() => setHoverVariant(null)}
                    className="group block overflow-hidden rounded-sm border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.14]"
                  >
                    <div
                      className="h-1.5 w-full transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, ${variant.palette.accent}, ${variant.palette.accentCalm ?? variant.palette.accent})`,
                        opacity: active ? 1 : 0.55,
                      }}
                    />
                    <div className="px-4 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-sans text-lg font-bold tracking-tight">{variant.name}</p>
                          <p className="mt-0.5 font-sans text-sm text-[#B6502E]/85">{variant.tagline}</p>
                        </div>
                        <p className="shrink-0 font-sans text-2xl font-extrabold tabular-nums text-[#B6502E]">
                          {variant.durationSeconds}s
                        </p>
                      </div>
                      <p className="mt-3 font-sans text-sm leading-relaxed text-white/45">
                        {variant.feelsLike}
                      </p>
                      <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.12em] text-white/30">
                        {INTERACTION_COPY[variant.interactionMode]}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h1 className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              What Surge does to your body
            </h1>
            <p className="mt-4 max-w-lg font-sans text-base leading-relaxed text-white/50">
              Evidence-informed regulation for the moment your nervous system will not wait. No
              accounts. No streaks. No therapy-speak.
            </p>

            <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="How it works sections">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSection === s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`rounded-sm border px-3 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    activeSection === s.id
                      ? 'border-[#B6502E]/60 bg-[#B6502E]/10 text-[#F4F0EB]'
                      : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:text-white/70'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                className="mt-8 rounded-sm border border-white/[0.06] bg-white/[0.02] p-6 md:p-8"
              >
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B6502E]">
                  {section.label}
                </p>
                <p className="mt-3 font-sans text-xl font-semibold leading-snug text-[#F4F0EB]">
                  {section.summary}
                </p>
                <div className="mt-5 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="font-sans text-base leading-relaxed text-white/55">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/"
                className="inline-flex border border-[#B6502E]/50 bg-[#B6502E]/10 px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#F4F0EB] transition-colors hover:bg-[#B6502E]/20"
              >
                Choose your sequence
              </Link>
              {crane ? (
                <button
                  type="button"
                  onClick={crane.openCrane}
                  className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-[#B6502E]"
                >
                  Ask Crane →
                </button>
              ) : (
                <Link
                  to="/crane"
                  className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-[#B6502E]"
                >
                  Ask Crane →
                </Link>
              )}
            </div>
          </div>
        </div>

        <p className="mt-16 text-center font-sans text-[10px] leading-relaxed tracking-[0.06em] text-white/25">
          For acute nervous system regulation. Not a substitute for emergency medical care.
        </p>
      </div>
    </div>
  );
}
