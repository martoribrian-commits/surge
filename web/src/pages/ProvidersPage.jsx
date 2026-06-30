import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import ProviderContactForm from '../components/portal/ProviderContactForm';
import { BRAND } from '../brand/tokens';

const SECTIONS = [
  {
    label: 'The clinical gap',
    title: 'Recovery should not cost another session.',
    body: 'Patients arrive dysregulated, or dysregulate between visits. Surge gives them a deterministic somatic tool for the parking lot, the bathroom, or 2 a.m. — without another account or relationship to manage.',
  },
  {
    label: 'How it works',
    title: 'Tokens, not logins.',
    body: 'Provision Clinical Tokens through the provider portal. Six-character codes with expiry and use count. Patients enter once. No password. No PHI at the point of access. You see activation, completion, and sequence usage — not session content unless the patient brings it into your room.',
  },
  {
    label: 'What patients experience',
    title: 'Seven sequences. 30, 60, or 90 seconds.',
    body: 'From physiological sigh and thermal freeze to bilateral grounding, hyperspace transit, resonant breath, visual decay, and the original sonic static field. Release to pause. Hold to resume. No streaks. Optional Crane handoff when a token is present.',
  },
  {
    label: 'Privacy architecture',
    title: 'Sovereignty by default.',
    body: 'The somatic engine runs in the browser. Session records stay on-device. Token validation returns only valid or invalid — no patient name, no provider name, no transcript unless the patient initiates Crane.',
  },
];

const TIERS = [
  {
    name: 'Starter',
    body: 'Single clinician. Token pool, standard support.',
    cta: 'Contact for pricing',
  },
  {
    name: 'Clinical',
    body: 'Multi-clinician practice. Expanded token volume and onboarding.',
    cta: 'Contact for pricing',
    featured: true,
  },
  {
    name: 'Enterprise',
    body: 'Health system or residential program. Custom provisioning, SLA, compliance documentation.',
    cta: 'Contact for pricing',
  },
];

export default function ProvidersPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: BRAND.void, color: BRAND.bone }}>
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          background:
            'radial-gradient(ellipse 70% 45% at 80% 0%, rgba(182,80,46,0.1) 0%, transparent 50%)',
        }}
      />
      <FilmGrainOverlay />

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-[max(1.5rem,env(safe-area-inset-top))] pb-16">
        <SiteHeader />

        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
          For providers
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
          Extend regulation beyond the session room
        </h1>
        <p className="mt-4 font-sans text-base leading-relaxed" style={{ color: BRAND.boneMuted }}>
          Surge is a somatic circuit breaker your patients can reach in seconds — secular,
          privacy-first, and designed for acute dysregulation.
        </p>

        <div className="mt-12 space-y-6">
          {SECTIONS.map((section, i) => (
            <motion.article
              key={section.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="rounded-sm border border-white/[0.06] bg-white/[0.02] p-6"
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: BRAND.clay }}>
                {section.label}
              </p>
              <h2 className="mt-2 font-sans text-lg font-bold tracking-tight">{section.title}</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                {section.body}
              </p>
            </motion.article>
          ))}
        </div>

        <section id="pricing" className="mt-16">
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Pricing
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {TIERS.map((tier) => (
              <article
                key={tier.name}
                className="flex flex-col rounded-sm border p-5"
                style={{
                  borderColor: tier.featured ? `${BRAND.clay}44` : 'rgba(255,255,255,0.08)',
                  background: tier.featured ? `${BRAND.clay}08` : 'rgba(255,255,255,0.02)',
                }}
              >
                <p className="font-sans text-sm font-bold">{tier.name}</p>
                <p className="mt-2 flex-1 font-sans text-[12px] leading-relaxed" style={{ color: BRAND.boneMuted }}>
                  {tier.body}
                </p>
                <a
                  href="#contact"
                  className="mt-5 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
                  style={{ color: BRAND.boneDim }}
                >
                  {tier.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-16">
          <ProviderContactForm />
        </section>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/portal"
            className="inline-flex border px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:brightness-110"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}10` }}
          >
            Provider portal
          </Link>
          <Link
            to="/start"
            className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Try a sequence →
          </Link>
          <Link
            to="/clinical-token"
            className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Patient token entry →
          </Link>
        </div>
      </div>
    </div>
  );
}
