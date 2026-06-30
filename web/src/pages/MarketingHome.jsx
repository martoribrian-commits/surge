import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import DecayHero from '../components/brand/DecayHero';
import {
  MarketingShell,
  MarketingSectionHeader,
  SiteFooter,
  ProtocolCard,
  CaseStudyCarousel,
  MarketingCtaBand,
  fadeUp,
} from '../components/marketing';
import { EVIDENCE_STUDIES } from '../data/evidenceStudies';
import { BRAND } from '../brand/tokens';
import { VARIANT_LIST } from '../sequences';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';

const PILLARS = [
  {
    num: '30 to 90',
    unit: 'Seconds',
    text: 'Nine evidence-informed sequences. Each runs one fixed downshift curve. Visual, audio, and touch phase-locked until completion.',
  },
  {
    num: '0',
    unit: 'Accounts',
    text: 'No signup gate. No streaks. No mood tracking. Your body stays in control. Release to pause, exit anytime.',
  },
  {
    num: '24h',
    unit: 'Ephemeral',
    text: 'Optional post-session notes auto-delete locally. Nothing mined. Nothing sold. Privacy by architecture, not policy.',
  },
];

const SCIENCE_PILLARS = [
  {
    label: 'Physiological sigh',
    protocol: 'Instant Reset · 30s',
    body: 'Double inhale plus extended exhale offloads CO₂ and activates the parasympathetic branch. The fastest evidence-backed breath pattern for acute downshift.',
    cite: 'Balban et al., Cell Reports Medicine, 2023',
  },
  {
    label: 'Bilateral stimulation',
    protocol: 'Orienting Anchor · 60s',
    body: 'Rhythmic left-right sensory input interrupts cognitive loops and re-orients attention into the body. Same mechanism as EMDR-adjacent protocols.',
    cite: 'Valiente-Gómez et al., JEMDR Practice, 2021',
  },
  {
    label: 'Resonant breathing',
    protocol: 'Coherence Ripple · 90s',
    body: 'Paced breathing near ~6 breaths per minute with continuous tactile anchor increases heart-rate variability. The biomarker most linked to autonomic flexibility.',
    cite: 'HRV biofeedback · resonant frequency breathing',
  },
  {
    label: 'Polyvagal downshift',
    protocol: 'Vagal Downshift · 90s',
    body: 'Multi-channel decay: visual fog descent, breath diaphragm, warm sub-bass. Phase-locked to one deterministic arousal curve. Structured, visible settling.',
    cite: 'Polyvagal-informed somatic regulation',
  },
];

export default function MarketingHome() {
  usePageMeta(PAGE_META.home);
  const [hoverVariant, setHoverVariant] = useState(null);

  return (
    <MarketingShell>
      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-5 pb-20 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <SiteHeader />

        <div className="mt-6 grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <motion.p
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: BRAND.clay }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              Evidence-informed somatic circuit breaker
            </motion.p>

            <motion.h1
              className="mt-4 font-sans text-[clamp(2rem,5vw,3.25rem)] font-extrabold leading-[1.06] tracking-[-0.03em]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Thirty to ninety seconds
              <br />
              <span style={{ color: BRAND.clay }}>to bring your nervous system back down.</span>
            </motion.h1>

            <motion.p
              className="mt-5 max-w-lg font-sans text-base leading-relaxed"
              style={{ color: BRAND.boneMuted }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              When your body will not wait for an appointment. Secular. Private. No account.
              Nine sequences mapped to physiological protocols. Not wellness trends.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap items-center gap-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link
                to="/start"
                className="inline-block border px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] transition-all hover:scale-[1.02]"
                style={{
                  color: BRAND.bone,
                  borderColor: `${BRAND.clay}66`,
                  background: `linear-gradient(135deg, ${BRAND.clay}28, rgba(75,136,184,0.1))`,
                }}
              >
                Choose your sequence
              </Link>
              <Link
                to="/clinical-token"
                className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[#B6502E]"
                style={{ color: BRAND.boneDim }}
              >
                I have a token
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 font-sans text-[10px] leading-relaxed tracking-[0.06em]"
              style={{ color: BRAND.boneDim }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
            >
              For acute nervous system regulation. Not a substitute for emergency medical care.
              Contains slow visual pulses and audio.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <DecayHero className="py-4" />
          </motion.div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-5 py-5">
          {[
            'Physiological sigh protocol',
            'Bilateral sensory orienting',
            'Resonant HRV breathing',
            'Polyvagal-informed decay',
          ].map((label) => (
            <span
              key={label}
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: BRAND.boneDim }}
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Pillars ── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <MarketingSectionHeader
          kicker="Built for the acute window"
          title=""
          align="center"
          className="mb-10"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, i) => (
            <motion.article
              key={pillar.unit}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-6"
            >
              <p className="font-sans text-4xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
                {pillar.num}
              </p>
              <p className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.boneDim }}>
                {pillar.unit}
              </p>
              <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                {pillar.text}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ── Science foundations ── */}
      <section className="border-t border-white/[0.06] bg-black/30">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <MarketingSectionHeader
            kicker="Science-backed protocols"
            title="Each sequence maps to a named physiological mechanism. Not a generic meditation timer."
            description="Surge is evidence-informed, not FDA-cleared. We use language clinicians recognize and patients can feel, without overclaiming efficacy we have not yet measured in trials."
          />

          <div className="grid gap-5 md:grid-cols-2">
            {SCIENCE_PILLARS.map((item, i) => (
              <motion.article
                key={item.label}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                className="group rounded-sm border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-[#B6502E]/25"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-sans text-lg font-bold">{item.label}</p>
                  <span className="shrink-0 font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.clay }}>
                    {item.protocol}
                  </span>
                </div>
                <p className="mt-3 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                  {item.body}
                </p>
                <p className="mt-4 font-sans text-[10px] italic tracking-[0.04em]" style={{ color: BRAND.boneDim }}>
                  {item.cite}
                </p>
              </motion.article>
            ))}
          </div>

          <motion.div {...fadeUp} className="mt-10 text-center">
            <Link
              to="/how-it-works"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] underline decoration-[#B6502E]/40 underline-offset-4 transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneMuted }}
            >
              Read the full science breakdown
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Mechanism ── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <MarketingSectionHeader
            kicker="The mechanism"
            title="Chaos at the peak. A slow heartbeat at the end."
            description="Sound, visuals, and touch follow one downshift curve, starting where your body is and fading toward calm on a fixed timeline. After the cycle: re-enter the world, write what surfaced, or talk with Crane through your provider if you choose."
            className="mb-0"
          />

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="relative overflow-hidden rounded-sm border border-white/[0.08] p-8"
            style={{ background: 'linear-gradient(160deg, rgba(182,80,46,0.12) 0%, rgba(10,10,10,0.9) 60%)' }}
          >
            <div className="space-y-4">
              {[
                { phase: 'Peak', desc: 'Visual intensity matches current arousal state' },
                { phase: 'Transition', desc: 'Multi-channel curve begins synchronized descent' },
                { phase: 'Settle', desc: 'Breath, audio, and haptics lock to calm baseline' },
                { phase: 'Aftermath', desc: 'Optional decompression with Crane AI guide' },
              ].map((step, i) => (
                <div key={step.phase} className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-sans text-[10px] font-bold"
                    style={{ background: `${BRAND.clay}22`, color: BRAND.clay }}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-sans text-sm font-semibold">{step.phase}</p>
                    <p className="font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Sequence preview ── */}
      <section className="border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <MarketingSectionHeader
            kicker="Nine sequences"
            title="Pick by body state. Not by mood score."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {VARIANT_LIST.map((variant, i) => {
              const active = hoverVariant === variant.id;
              return (
                <motion.div
                  key={variant.id}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: (i % 4) * 0.04 }}
                  onMouseEnter={() => setHoverVariant(variant.id)}
                  onMouseLeave={() => setHoverVariant(null)}
                >
                  <Link
                    to={`/start?variant=${variant.id}`}
                    className="group block overflow-hidden rounded-sm border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.14]"
                  >
                    <div
                      className="h-1 w-full transition-opacity"
                      style={{
                        background: `linear-gradient(90deg, ${variant.palette.accent}, ${variant.palette.accentCalm ?? variant.palette.accent})`,
                        opacity: active ? 1 : 0.5,
                      }}
                    />
                    <div className="px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-sans text-base font-bold">{variant.name}</p>
                          <p className="mt-0.5 font-sans text-[10px] uppercase tracking-[0.12em]" style={{ color: BRAND.clay }}>
                            {variant.modality}
                          </p>
                        </div>
                        <p className="shrink-0 font-sans text-xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
                          {variant.durationSeconds}s
                        </p>
                      </div>
                      <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
                        {variant.tagline}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div {...fadeUp} className="mt-10 text-center">
            <Link
              to="/start"
              className="inline-block border px-8 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.28em] transition-all hover:scale-[1.02]"
              style={{
                color: BRAND.bone,
                borderColor: 'rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              Open sequence picker
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Protocol spotlight (compact) ── */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <MarketingSectionHeader
          kicker="Protocol library"
          title="Named mechanisms, not generic calm."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VARIANT_LIST.slice(0, 3).map((variant, i) => (
            <ProtocolCard key={variant.id} variant={variant} index={i} />
          ))}
        </div>
        <motion.p {...fadeUp} className="mt-6 text-center font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
          All nine protocols on the{' '}
          <Link to="/how-it-works" className="underline underline-offset-2 transition-colors hover:text-[#B6502E]">
            science page
          </Link>
        </motion.p>
      </section>

      {/* ── Published research ── */}
      <section className="border-t border-white/[0.06] bg-black/20">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <MarketingSectionHeader
            kicker="Published research"
            title="Peer-reviewed outcomes, not testimonials."
          />
          <CaseStudyCarousel studies={EVIDENCE_STUDIES.slice(0, 4)} />
          <motion.p {...fadeUp} className="mt-6 text-center">
            <Link
              to="/faq"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] underline decoration-[#B6502E]/40 underline-offset-4 transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneMuted }}
            >
              All studies + FAQ
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ── Clinical path ── */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <motion.div
          {...fadeUp}
          className="overflow-hidden rounded-sm border border-white/[0.08] p-8 sm:p-12"
          style={{
            background: `linear-gradient(135deg, rgba(182,80,46,0.1) 0%, rgba(10,10,10,0.95) 50%, rgba(75,136,184,0.06) 100%)`,
          }}
        >
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            For clinicians
          </p>
          <h2 className="mt-3 max-w-xl font-sans text-2xl font-extrabold tracking-[-0.02em]">
            Extend regulation beyond the session room.
          </h2>
          <p className="mt-4 max-w-xl font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            Issue clinical tokens from the provider portal. Patients run the same evidence-informed
            sequences between visits, with optional Crane post-session support tied to your practice.
            Session outcomes aggregate across your clinical team.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/for-providers"
              className="inline-block border px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:border-[#B6502E]/40"
              style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone }}
            >
              Provider program
            </Link>
            <Link
              to="/portal"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneDim }}
            >
              Portal login
            </Link>
          </div>
        </motion.div>
      </section>

      <MarketingCtaBand />
      <SiteFooter />
    </MarketingShell>
  );
}
