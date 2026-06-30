import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import {
  MarketingShell,
  MarketingSectionHeader,
  SiteFooter,
  MarketingFaq,
  ComparisonTable,
  ProtocolCard,
  MarketingCtaBand,
  fadeUp,
} from '../components/marketing';
import { useCraneOptional } from '../context/CraneProvider';
import { VARIANT_LIST } from '../sequences';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

const SECTIONS = [
  {
    id: 'problem',
    label: 'The problem',
    summary: 'When stress peaks, thinking stops working.',
    body: [
      'At full activation your body is in alarm mode. Heart rate up, breathing shallow, muscles tight. In that state, "just calm down" or "think rationally" does not land. Your prefrontal cortex literally does not have the bandwidth.',
      'Most apps make it worse: log in, track your mood, read a paragraph, choose from twelve options. Surge does the opposite. One sequence. One interaction. Thirty to ninety seconds.',
    ],
  },
  {
    id: 'window',
    label: 'The window',
    summary: 'Your body can still come down if you give it a path.',
    body: [
      'Somatic regulation research identifies a narrow window after peak activation when the nervous system can still be guided back toward baseline without pharmacological intervention. That window is measured in seconds, not minutes.',
      'Ten sequences, each tuned to a different body state: racing heart, hot anger, stuck thoughts, scattered disorientation, shutdown numbness, wired exhaustion, grief heaviness, full overwhelm, restless agitation, or shame loops that will not quit.',
    ],
  },
  {
    id: 'mechanism',
    label: 'What actually happens',
    summary: 'Sound, visuals, and touch follow one downshift curve.',
    body: [
      'Each sequence uses breath, bilateral tapping, or press-and-hold contact, paired with sound and visuals that start where you are and fade toward calm on a fixed timeline.',
      'Nothing to score. Nothing to optimize. You hold on (or tap, or breathe) and the system walks your arousal down. Exit anytime from the header.',
    ],
  },
  {
    id: 'crane',
    label: 'Crane',
    summary: 'Plain-language help, anywhere on the site.',
    body: [
      'Crane explains what each sequence does for your body, without clinical jargon. Not sure which one fits? Ask before you begin. Finished a cycle and something came up? Crane is there after, too.',
      'Guide mode works without an account. Deeper post-session support is available with a clinical token from your provider. Everything stays on your device unless you choose otherwise.',
    ],
  },
];

const BODY_STATE_GUIDE = [
  { state: 'Heart racing, shallow breath', sequence: 'Instant Reset', duration: '30s' },
  { state: 'Hot anger, adrenaline spike', sequence: 'Flash Freeze', duration: '30s' },
  { state: 'Stuck thoughts, rumination', sequence: 'Orienting Anchor', duration: '60s' },
  { state: 'Scattered, disoriented', sequence: 'Nova Gate', duration: '60s' },
  { state: 'Wired but exhausted', sequence: 'Coherence Ripple', duration: '90s' },
  { state: 'Flooded, overwhelmed', sequence: 'Vagal Downshift', duration: '90s' },
  { state: 'Restless, agitated', sequence: 'Static Field', duration: '90s' },
];

const SCIENCE_FAQ = [
  {
    q: 'Is Surge a medical device or FDA-cleared?',
    a: 'No. Surge is evidence-informed somatic software, not a diagnostic or treatment device. We use language from established physiological protocols without claiming clinical trial outcomes we have not measured.',
  },
  {
    q: 'Why fixed durations instead of open-ended sessions?',
    a: 'Under acute stress, open-ended tools add decision load. A fixed curve removes the question "Am I done yet?" and gives your nervous system a predictable path from peak activation to rest.',
  },
  {
    q: 'Do I need headphones?',
    a: 'Recommended for sequences with audio entrainment (especially Static Field and Coherence Ripple). Visual-only downshift still works without them, but the multi-channel effect is strongest with sound.',
  },
  {
    q: 'What if I release mid-sequence?',
    a: 'The dead-man switch pauses progress. Hold again to resume from where you left off. No penalty, no streak broken, no data lost on-device.',
  },
  {
    q: 'How is this different from a breathing app?',
    a: 'Breathing apps typically offer one paced-breath pattern. Surge maps ten distinct protocols across four durations: sigh intercept, thermal freeze, bilateral orienting, hyperspace entrainment, somatic thaw, resonant HRV breathing, pendular grief release, visual decay, sonic entrainment, and extended bilateral integration. Each matched to a specific body state.',
  },
];

const INTERACTION_COPY = {
  auto: 'Starts on its own',
  bilateral: 'Tap left · right',
  hold: 'Press and hold',
};

export default function SciencePage() {
  usePageMeta(PAGE_META.science);
  const [activeSection, setActiveSection] = useState('problem');
  const [hoverVariant, setHoverVariant] = useState(null);
  const crane = useCraneOptional();
  const section = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <MarketingShell glow="split">
      <div className="mx-auto max-w-5xl px-5 py-[max(1.5rem,env(safe-area-inset-top))]">
        <SiteHeader />

        {/* Hero + interactive explainer */}
        <div className="grid gap-12 pb-20 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div className="flex flex-col items-center lg:sticky lg:top-8 lg:self-start">
            <p className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
              How it works
            </p>
            <DecayHero className="mb-8 py-4" />

            <div className="w-full space-y-3">
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.boneDim }}>
                Ten sequences. Pick by body state
              </p>
              {VARIANT_LIST.map((variant) => {
                const active = hoverVariant === variant.id;
                return (
                  <Link
                    key={variant.id}
                    to={`/start?variant=${variant.id}`}
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
                          <p className="mt-0.5 font-sans text-sm" style={{ color: `${BRAND.clay}d9` }}>
                            {variant.tagline}
                          </p>
                        </div>
                        <p className="shrink-0 font-sans text-2xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
                          {variant.durationSeconds}s
                        </p>
                      </div>
                      <p className="mt-3 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                        {variant.feelsLike}
                      </p>
                      <p className="mt-2 font-sans text-[10px] uppercase tracking-[0.12em]" style={{ color: BRAND.boneDim }}>
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
            <p className="mt-4 max-w-lg font-sans text-base leading-relaxed" style={{ color: BRAND.boneMuted }}>
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
                      ? 'border-[#B6502E]/60 bg-[#B6502E]/10'
                      : 'border-white/[0.08] bg-white/[0.02] hover:text-white/70'
                  }`}
                  style={{ color: activeSection === s.id ? BRAND.bone : BRAND.boneDim }}
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
                <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
                  {section.label}
                </p>
                <p className="mt-3 font-sans text-xl font-semibold leading-snug">{section.summary}</p>
                <div className="mt-5 space-y-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="font-sans text-base leading-relaxed" style={{ color: BRAND.boneMuted }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/start"
                className="inline-flex border px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-[#B6502E]/20"
                style={{ borderColor: `${BRAND.clay}80`, background: `${BRAND.clay}18`, color: BRAND.bone }}
              >
                Choose your sequence
              </Link>
              {crane ? (
                <button
                  type="button"
                  onClick={crane.openCrane}
                  className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
                  style={{ color: BRAND.boneDim }}
                >
                  Ask Crane →
                </button>
              ) : (
                <Link
                  to="/crane"
                  className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
                  style={{ color: BRAND.boneDim }}
                >
                  Ask Crane →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Autonomic explainer */}
        <section className="border-t border-white/[0.06] py-20">
          <MarketingSectionHeader
            kicker="The autonomic ladder"
            title="Your nervous system has three gears. Surge targets the downshift."
            description="Under threat, sympathetic activation ramps up: heart rate, breath rate, muscle tension. The goal is not to think your way out. It is to give the body a somatic path back toward ventral safety."
          />
          <motion.div {...fadeUp} className="grid gap-4 md:grid-cols-3">
            {[
              {
                gear: 'Sympathetic',
                signal: 'Fight · flight · freeze',
                role: 'Alarm mode. Where most acute dysregulation lives',
                color: BRAND.clay,
              },
              {
                gear: 'Dorsal vagal',
                signal: 'Shutdown · collapse',
                role: 'When overwhelm tips into numbness or dissociation',
                color: '#6B9AAA',
              },
              {
                gear: 'Ventral vagal',
                signal: 'Safety · connection',
                role: 'The baseline Surge walks you toward. Not through talk, through body',
                color: '#8FB596',
              },
            ].map((item) => (
              <article
                key={item.gear}
                className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: item.color }}>
                  {item.gear}
                </p>
                <p className="mt-2 font-sans text-sm font-bold">{item.signal}</p>
                <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
                  {item.role}
                </p>
              </article>
            ))}
          </motion.div>
        </section>

        {/* Body state guide */}
        <section className="border-t border-white/[0.06] py-20">
          <MarketingSectionHeader
            kicker="Which sequence?"
            title="Match what you feel. Not what you think you should pick."
          />
          <motion.div {...fadeUp} className="overflow-hidden rounded-sm border border-white/[0.08]">
            {BODY_STATE_GUIDE.map((row, i) => (
              <div
                key={row.state}
                className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 ${i > 0 ? 'border-t border-white/[0.05]' : ''}`}
              >
                <p className="font-sans text-sm" style={{ color: BRAND.boneMuted }}>{row.state}</p>
                <p className="font-sans text-sm font-semibold">{row.sequence}</p>
                <p className="font-sans text-sm tabular-nums" style={{ color: BRAND.clay }}>{row.duration}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Full protocol library */}
        <section className="border-t border-white/[0.06] py-20">
          <MarketingSectionHeader
            kicker="Protocol library"
            title="Every sequence names its mechanism."
            description="These are the physiological protocols behind each experience, written for clinicians and readable by anyone."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {VARIANT_LIST.map((variant, i) => (
              <ProtocolCard key={variant.id} variant={variant} index={i} />
            ))}
          </div>
        </section>

        {/* Comparison */}
        <section className="border-t border-white/[0.06] py-20">
          <MarketingSectionHeader
            kicker="Why not another app?"
            title="Built for the parking lot, not the meditation cushion."
          />
          <ComparisonTable />
        </section>

        {/* FAQ teaser */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader kicker="Questions" title="Science and usage FAQ" />
          <MarketingFaq items={SCIENCE_FAQ.slice(0, 3)} />
          <p className="mt-6 text-center font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
            <Link to="/faq" className="underline underline-offset-2 transition-colors hover:text-[#B6502E]">
              Full FAQ + all published studies
            </Link>
          </p>
        </section>
      </div>

      <MarketingCtaBand />
      <SiteFooter />
    </MarketingShell>
  );
}
