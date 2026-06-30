import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { fadeUp } from './marketingMotion';

const ROWS = [
  { label: 'Time to start', surge: 'One tap. No account.', typical: 'Login, mood check, menu' },
  { label: 'Duration', surge: '30 to 90 seconds, fixed curve', typical: 'Open-ended, variable length' },
  { label: 'Interaction', surge: 'Hold, tap, or breathe. One mode.', typical: 'Multiple choices under stress' },
  { label: 'Evidence base', surge: 'Named physiological protocols', typical: 'Generic mindfulness' },
  { label: 'Data model', surge: 'Ephemeral, on-device by default', typical: 'Persistent profiles, analytics' },
  { label: 'Clinical path', surge: 'Token-based provider handoff', typical: 'Separate app or none' },
];

export default function ComparisonTable() {
  return (
    <motion.div {...fadeUp} className="space-y-3">
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-sm border border-white/[0.08] sm:block">
        <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/[0.08] bg-white/[0.03] font-sans text-[9px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
          <div className="px-4 py-3" />
          <div className="border-l border-white/[0.06] px-4 py-3" style={{ color: BRAND.clay }}>
            Surge
          </div>
          <div className="border-l border-white/[0.06] px-4 py-3">
            Typical wellness app
          </div>
        </div>
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/[0.05] last:border-0"
          >
            <div className="px-4 py-3.5 font-sans text-xs font-medium" style={{ color: BRAND.boneMuted }}>
              {row.label}
            </div>
            <div className="border-l border-white/[0.05] px-4 py-3.5 font-sans text-xs leading-relaxed">
              {row.surge}
            </div>
            <div className="border-l border-white/[0.05] px-4 py-3.5 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneDim }}>
              {row.typical}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {ROWS.map((row) => (
          <article
            key={row.label}
            className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: BRAND.clay }}>
              {row.label}
            </p>
            <div className="mt-3 space-y-2">
              <p className="font-sans text-xs leading-relaxed">
                <span className="font-semibold" style={{ color: BRAND.clay }}>Surge: </span>
                {row.surge}
              </p>
              <p className="font-sans text-xs leading-relaxed" style={{ color: BRAND.boneDim }}>
                <span className="font-semibold">Typical: </span>
                {row.typical}
              </p>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}
