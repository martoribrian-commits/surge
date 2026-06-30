import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

/**
 * @param {{ stats: { tokensIssued: number, tokensActivated: number, sessionsCompleted: number } }} props
 */
export default function ProviderStatsBar({ stats }) {
  const items = [
    { label: 'Issued', value: stats.tokensIssued, accent: BRAND.clay },
    { label: 'Activated', value: stats.tokensActivated, accent: '#6B9AAA' },
    { label: 'Sessions', value: stats.sessionsCompleted, accent: '#8FB596' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          className="relative overflow-hidden rounded-sm border border-white/[0.08] bg-white/[0.02] px-4 py-5 sm:px-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.06 }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${item.accent}66, transparent)` }}
          />
          <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.boneDim }}>
            {item.label}
          </p>
          <p className="mt-2 font-sans text-3xl font-light tabular-nums tracking-tight">{item.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
