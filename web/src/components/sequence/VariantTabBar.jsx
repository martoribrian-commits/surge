import { motion } from 'framer-motion';
import { VARIANT_LIST } from '../../sequences';

/**
 * Segmented 30 · 60 · 90 control — primary variant switch affordance.
 */
export default function VariantTabBar({ activeId, onSelect }) {
  return (
    <div
      className="relative mx-auto flex w-full max-w-md rounded-sm border border-white/[0.08] bg-white/[0.03] p-1"
      role="tablist"
      aria-label="Sequence duration"
    >
      {VARIANT_LIST.map((variant) => {
        const active = variant.id === activeId;
        return (
          <button
            key={variant.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(variant.id)}
            className="relative z-10 flex-1 px-2 py-3 text-center transition-colors"
          >
            {active ? (
              <motion.div
                layoutId="variant-tab-indicator"
                className="absolute inset-0 rounded-sm"
                style={{
                  background: `linear-gradient(135deg, ${variant.palette.accent}33, ${variant.palette.accentCalm ?? variant.palette.accent}22)`,
                  border: `1px solid ${variant.palette.accent}55`,
                  boxShadow: `0 0 32px ${variant.palette.accent}22`,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span
              className="relative font-sans text-[11px] font-bold tabular-nums tracking-[0.08em]"
              style={{ color: active ? '#F4F0EB' : 'rgba(244,240,235,0.4)' }}
            >
              {variant.durationSeconds}s
            </span>
          </button>
        );
      })}
    </div>
  );
}
