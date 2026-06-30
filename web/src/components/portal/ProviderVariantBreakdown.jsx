import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { VARIANT_LABELS } from '../../lib/craneCarePlanUtils';

const VARIANT_COLORS = {
  'instant-reset': '#FF6B1A',
  'flash-freeze': '#67E8F9',
  'orienting-anchor': '#D4845C',
  'nova-gate': '#FFB347',
  'coherence-ripple': '#4A9A6A',
  'vagal-downshift': '#6B9AAA',
  'static-field': '#F4F0EB',
  unknown: BRAND.boneDim,
};

/**
 * Horizontal bar breakdown of completed sessions by sequence variant.
 */
export default function ProviderVariantBreakdown({ breakdown = {} }) {
  const entries = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const total = entries.reduce((sum, [, c]) => sum + c, 0);
  if (!total) return null;

  return (
    <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
        Sequence usage
      </h2>
      <p className="mt-1 font-sans text-[11px]" style={{ color: BRAND.boneDim }}>
        Completed sessions by protocol
      </p>

      <div className="mt-5 space-y-3">
        {entries.map(([variantId, count], i) => {
          const pct = Math.round((count / total) * 100);
          const label = VARIANT_LABELS[variantId] ?? (variantId === 'unknown' ? 'Unrecorded' : variantId);
          const color = VARIANT_COLORS[variantId] ?? BRAND.clay;

          return (
            <motion.div
              key={variantId}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-sans text-[11px] font-medium">{label}</span>
                <span className="font-sans text-[10px] tabular-nums" style={{ color: BRAND.boneDim }}>
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
