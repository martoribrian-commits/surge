import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import FilmGrainOverlay from '../components/FilmGrainOverlay';

const SECTIONS = [
  {
    label: 'The clinical gap',
    title: 'Recovery should not cost another session.',
    body: 'Patients arrive dysregulated, or dysregulate between visits. Surge gives them a deterministic somatic tool for the parking lot, the bathroom, or 2 a.m. — without another account or relationship to manage.',
  },
  {
    label: 'How it works',
    title: 'Tokens, not logins.',
    body: 'Provision Clinical Tokens through the provider portal. Six-character codes with expiry and use count. Patients enter once. No password. No PHI at the point of access. You see activation and completion signals — not session content unless the patient brings it into your room.',
  },
  {
    label: 'What patients experience',
    title: '30, 60, or 90 seconds. Their choice.',
    body: 'Three calibrated sequences: physiological sigh, bilateral grounding, or resonant breath with tactile anchor. Release to pause. Hold to resume. No streaks. No penalties. Optional Crane handoff when a token is present.',
  },
  {
    label: 'Privacy architecture',
    title: 'Sovereignty by default.',
    body: 'The somatic engine runs in the browser. Session records stay on-device. Token validation returns only valid or invalid — no patient name, no provider name, no transcript unless the patient initiates Crane.',
  },
];

export default function ProvidersPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0A0A0A] text-[#F4F0EB]">
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

        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
          For providers
        </p>
        <h1 className="mt-3 font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
          Extend regulation beyond the session room
        </h1>
        <p className="mt-4 font-sans text-base leading-relaxed text-white/50">
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
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B6502E]">
                {section.label}
              </p>
              <h2 className="mt-2 font-sans text-lg font-bold tracking-tight">{section.title}</h2>
              <p className="mt-3 font-sans text-sm leading-relaxed text-white/55">{section.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            to="/portal"
            className="inline-flex border border-[#B6502E]/50 bg-[#B6502E]/10 px-6 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-[#B6502E]/20"
          >
            Provider portal
          </Link>
          <Link
            to="/clinical-token"
            className="inline-flex px-2 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-[#B6502E]"
          >
            Patient token entry →
          </Link>
        </div>
      </div>
    </div>
  );
}
