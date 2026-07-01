import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import ProviderContactForm from '../components/portal/ProviderContactForm';
import {
  MarketingShell,
  MarketingSectionHeader,
  SiteFooter,
  MarketingFaq,
  WorkflowSteps,
  CaseStudyCarousel,
  MarketingCtaBand,
  fadeUp,
  stagger,
} from '../components/marketing';
import { EVIDENCE_STUDIES } from '../data/evidenceStudies';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

const SECTIONS = [
  {
    label: 'The clinical gap',
    title: 'Recovery should not cost another session.',
    body: 'Patients arrive dysregulated, or dysregulate between visits. Surge gives them a deterministic somatic tool for the parking lot, the bathroom, or 2 a.m., without another account or relationship to manage.',
  },
  {
    label: 'How it works',
    title: 'Tokens, not logins.',
    body: 'Provision Clinical Tokens through the provider portal. Six-character codes with expiry and use count. Patients enter once. No password. No PHI at the point of access. You see activation, completion, and sequence usage. Not session content unless the patient brings it into your room.',
  },
  {
    label: 'What patients experience',
    title: 'Ten sequences. 30, 60, 90, or 120 seconds.',
    body: 'From physiological sigh and thermal freeze to bilateral grounding, hyperspace transit, resonant breath, visual decay, and the original sonic static field. Release to pause. Hold to resume. No streaks. Optional Crane handoff when a token is present.',
  },
  {
    label: 'Privacy architecture',
    title: 'Sovereignty by default.',
    body: 'The somatic engine runs in the browser. Session records stay on-device. Token validation returns only valid or invalid. No patient name, no provider name, no transcript unless the patient initiates Crane.',
  },
];

const WORKFLOW = [
  {
    title: 'Provision',
    body: 'Sign into the portal and generate a six-character token with expiry, use count, and optional patient alias.',
  },
  {
    title: 'Activate',
    body: 'Patient enters the token once. No login. Crane unlocks for post-session support tied to your practice.',
  },
  {
    title: 'Regulate',
    body: 'Patient picks a sequence matched to body state. 30 to 90 seconds. Visual, audio, and touch phase-locked to one downshift curve.',
  },
  {
    title: 'Review',
    body: 'Portal shows activation, completion, sequence variant, and duration, aggregated across your clinical team.',
  },
];

const PORTAL_FEATURES = [
  {
    title: 'Token inventory',
    body: 'Issue, track, and revoke tokens. See activation status and remaining uses at a glance.',
  },
  {
    title: 'Session analytics',
    body: 'Completion vs interrupted outcomes, variant breakdown, and filtered session history.',
  },
  {
    title: 'CSV export',
    body: 'Download de-identified session records filtered by sequence, date range, outcome, or token.',
  },
  {
    title: 'Multi-clinician',
    body: 'Organizations aggregate stats across the clinical team. Each clinician signs in with their own account.',
  },
];

const PRACTICE_TYPES = [
  'Private practice therapists',
  'Trauma-informed clinics',
  'IOP and PHP programs',
  'Primary care behavioral health',
  'Residential treatment',
  'Employee assistance programs',
];

const PROVIDER_FAQ = [
  {
    q: 'What data do I see about my patients?',
    a: 'Token activation, session completion, duration, and which sequence variant was used. You do not receive session transcripts, journal entries, or Crane conversation content unless the patient shares it in your room.',
  },
  {
    q: 'Is this HIPAA-compliant?',
    a: 'Surge is designed with a minimal-data architecture: no patient accounts, no PHI at token validation, on-device session storage by default. Enterprise tier includes compliance documentation for your legal review.',
  },
  {
    q: 'Can multiple clinicians share one portal?',
    a: 'Yes. Clinical and Enterprise tiers support multi-clinician organizations. Stats, tokens, and sessions aggregate across your team while each clinician maintains their own login.',
  },
  {
    q: 'What if a patient interrupts mid-sequence?',
    a: 'Sessions record as "interrupted" with duration logged. The patient can resume on-device. No penalty or streak mechanics that could increase shame after dysregulation.',
  },
  {
    q: 'Can I try it before provisioning for patients?',
    a: 'Yes. Run any sequence from the public picker without a token. Guide-mode Crane works without an account. Clinical Crane requires a token you generate yourself.',
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
    body: 'Multi-clinician practice. Expanded token volume, team analytics, onboarding.',
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
  usePageMeta(PAGE_META.providers);
  return (
    <MarketingShell glow="ember">
      <div className="mx-auto max-w-5xl px-5 py-[max(1.5rem,env(safe-area-inset-top))]">
        <SiteHeader />

        {/* Hero */}
        <div className="pb-16 pt-4">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            For providers
          </p>
          <h1 className="mt-3 max-w-2xl font-sans text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
            Extend regulation beyond the session room
          </h1>
          <p className="mt-4 max-w-xl font-sans text-base leading-relaxed" style={{ color: BRAND.boneMuted }}>
            Surge is a somatic circuit breaker your patients can reach in seconds. Secular,
            privacy-first, and built on named physiological protocols your clinical team will recognize.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/portal"
              className="inline-flex border px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:brightness-110"
              style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}10` }}
            >
              Provider portal
            </Link>
            <a
              href="#contact"
              className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneDim }}
            >
              Request access →
            </a>
          </div>

          {/* Stats strip */}
          <motion.div
            {...fadeUp}
            className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              { num: '10', label: 'Evidence-informed sequences' },
              { num: '30-120s', label: 'Fixed downshift curves' },
              { num: '0', label: 'Patient accounts required' },
              { num: 'CSV', label: 'Session export' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                {...stagger(i, 0.05)}
                className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-4 py-4"
              >
                <p className="font-sans text-2xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
                  {stat.num}
                </p>
                <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Workflow */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Clinical workflow"
            title="From token to outcome in four steps."
          />
          <WorkflowSteps steps={WORKFLOW} />
        </section>

        {/* Core sections */}
        <section className="border-t border-white/[0.06] py-16">
          <div className="grid gap-6 md:grid-cols-2">
            {SECTIONS.map((section, i) => (
              <motion.article
                key={section.label}
                {...stagger(i, 0.06)}
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
        </section>

        {/* Evidence */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Evidence base"
            title="Protocols your patients can feel. Studies you can cite."
          />
          <CaseStudyCarousel studies={EVIDENCE_STUDIES} autoAdvanceMs={7000} />
        </section>

        {/* Portal features */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Provider portal"
            title="Everything you need to provision and monitor. Nothing you should not see."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {PORTAL_FEATURES.map((feature, i) => (
              <motion.article
                key={feature.title}
                {...stagger(i, 0.06)}
                className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5"
              >
                <p className="font-sans text-sm font-bold">{feature.title}</p>
                <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
                  {feature.body}
                </p>
              </motion.article>
            ))}
          </div>
          <motion.div {...fadeUp} className="mt-8 text-center">
            <Link
              to="/portal"
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] underline decoration-[#B6502E]/40 underline-offset-4 transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.boneMuted }}
            >
              Open provider portal
            </Link>
          </motion.div>
        </section>

        {/* Practice types */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Designed for"
            title="Any setting where dysregulation happens between visits."
          />
          <motion.div {...fadeUp} className="flex flex-wrap gap-2">
            {PRACTICE_TYPES.map((type) => (
              <span
                key={type}
                className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-4 py-2 font-sans text-[11px] uppercase tracking-[0.12em]"
                style={{ color: BRAND.boneMuted }}
              >
                {type}
              </span>
            ))}
          </motion.div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader kicker="Pricing" title="Tiers for solo practice to health systems." />
          <div className="grid gap-4 sm:grid-cols-3">
            {TIERS.map((tier, i) => (
              <motion.article
                key={tier.name}
                {...stagger(i, 0.08)}
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
              </motion.article>
            ))}
          </div>
        </section>

        {/* FAQ teaser */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader kicker="Clinical FAQ" title="Common questions from providers." />
          <MarketingFaq items={PROVIDER_FAQ.slice(0, 3)} />
          <p className="mt-6 text-center font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
            <Link to="/faq" className="underline underline-offset-2 transition-colors hover:text-[#B6502E]">
              Full FAQ
            </Link>
          </p>
        </section>

        {/* Contact */}
        <section id="contact" className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Get access"
            title="Request a provider account."
            description="Tell us about your practice. We will follow up with onboarding details and portal credentials."
          />
          <ProviderContactForm />
        </section>

        {/* Bottom CTAs */}
        <div className="flex flex-wrap gap-4 pb-8">
          <Link
            to="/start"
            className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Try a sequence yourself →
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            Read the science →
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

      <MarketingCtaBand primaryHref="/portal" primaryLabel="Provider portal" secondaryHref="/faq" secondaryLabel="FAQ" />
      <SiteFooter />
    </MarketingShell>
  );
}
