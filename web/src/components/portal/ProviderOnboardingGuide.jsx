import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

const STEPS = [
  { n: '01', title: 'Issue a token', body: 'Set expiry and uses. Copy the code once — it hides in ten seconds.' },
  { n: '02', title: 'Give it to your patient', body: 'They enter the six-character code at /clinical-token. No account required.' },
  { n: '03', title: 'Watch signals arrive', body: 'Activation and completed sessions appear here. No session content — only counts.' },
];

export default function ProviderOnboardingGuide({ onDismiss }) {
  return (
    <motion.section
      className="mb-10 overflow-hidden rounded-sm border border-[#B6502E]/30 bg-gradient-to-br from-[#B6502E]/12 to-transparent p-5 sm:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: BRAND.clay }}>
            Getting started
          </p>
          <h2 className="mt-1 font-sans text-lg font-bold tracking-tight">Your portal is ready</h2>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 font-sans text-[9px] uppercase tracking-[0.16em] transition-colors hover:text-white/70"
            style={{ color: BRAND.boneDim }}
          >
            Dismiss
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.n} className="rounded-sm border border-white/[0.06] bg-black/20 px-4 py-4">
            <p className="font-sans text-[10px] font-bold tracking-[0.2em]" style={{ color: BRAND.clay }}>
              {step.n}
            </p>
            <p className="mt-2 font-sans text-sm font-semibold">{step.title}</p>
            <p className="mt-1.5 font-sans text-[11px] leading-relaxed" style={{ color: BRAND.boneMuted }}>
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
