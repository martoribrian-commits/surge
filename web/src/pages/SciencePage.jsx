import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import { VARIANT_LIST } from '../sequences';

const SECTIONS = [
  {
    id: 'problem',
    label: 'The problem',
    summary: 'Peak activation shuts down the prefrontal cortex.',
    body: [
      'Acute nervous system dysregulation does not wait for a scheduled session. At peak activation, the prefrontal cortex goes offline. Verbal reasoning fails. Standard coping tools arrive too late, or require cognitive capacity the patient no longer has.',
      'Most digital interventions add friction at the worst moment: accounts, mood check-ins, gamified streaks, or open-ended prompts that demand self-reflection under stress.',
    ],
  },
  {
    id: 'window',
    label: 'The window',
    summary: 'Regulation is measured in seconds, not minutes.',
    body: [
      'Somatic regulation research identifies a narrow window after peak activation when the nervous system can still be guided back to baseline without pharmacological intervention.',
      'Surge is built for that window — five calibrated sequences at 30, 60, and three ninety-second protocols. One interaction each. No identity required.',
    ],
  },
  {
    id: 'mechanism',
    label: 'The mechanism',
    summary: 'Visual, haptic, and audio channels phase-lock to one curve.',
    body: [
      'Each sequence uses a deterministic somatic protocol: physiological sigh, bilateral grounding, or resonant breath with tactile anchor. Visual intensity, haptic pulse, and timing derive from a single decay curve.',
      'There is no scoring, no feedback loop, no variable reward. The system does one thing: bring the body down on a schedule the user controls.',
    ],
  },
  {
    id: 'handoff',
    label: 'The handoff',
    summary: 'Quiet next steps when the cycle completes.',
    body: [
      'When the cycle completes, the system holds at its softest state, then offers optional transition to Crane — a recovery guide for patients with a Clinical Token from their provider. Crane is presence, not intervention.',
      'Session data stays local unless a token is present. Providers receive de-identified usage signals, never patient narrative unless the patient chooses to share it in session.',
    ],
  },
];

const INTERACTION_COPY = {
  auto: 'Runs automatically once started',
  bilateral: 'Alternate left / right taps',
  hold: 'Press and hold to advance',
};

export default function SciencePage() {
  const [activeSection, setActiveSection] = useState('problem');
  const [hoverVariant, setHoverVariant] = useState(null);
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
          {/* Visual column */}
          <div className="flex flex-col items-center lg:sticky lg:top-8 lg:self-start">
            <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
              How it works
            </p>
            <DecayHero className="mb-8 py-4" />

            <div className="w-full space-y-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                Choose a sequence
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
                    <div className="flex items-center justify-between gap-4 px-4 py-4">
                      <div>
                        <p className="font-sans text-lg font-bold tracking-tight">{variant.name}</p>
                        <p className="mt-0.5 font-sans text-sm text-white/45">{variant.tagline}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-sans text-2xl font-extrabold tabular-nums text-[#B6502E]">
                          {variant.durationSeconds}s
                        </p>
                        <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-white/30">
                          {INTERACTION_COPY[variant.interactionMode]}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Copy column — interactive sections */}
          <div>
            <h1 className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Science behind the somatic circuit breaker
            </h1>
            <p className="mt-4 max-w-lg font-sans text-base leading-relaxed text-white/50">
              Secular, evidence-informed protocols designed for the moment cognition fails and the
              body still needs a way back.
            </p>

            <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Science sections">
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
              <Link
                to="/for-providers"
                className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-[#B6502E]"
              >
                For providers →
              </Link>
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
