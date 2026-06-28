import { motion } from 'framer-motion';
import { VARIANT_LIST } from '../../sequences';

/**
 * Segmented duration control — 30 · 60 · 90 breath · 90 decay.
 */
export default function VariantTabBar({ activeId, onSelect }) {
  return (
    <div
      className="relative mx-auto flex w-full max-w-lg rounded-sm border border-white/[0.08] bg-white/[0.03] p-1"
      role="tablist"
      aria-label="Sequence duration"
    >
      {VARIANT_LIST.map((variant) => {
        const active = variant.id === activeId;
        const label = variant.tabLabel ?? `${variant.durationSeconds}s`;
        return (
          <button
            key={variant.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${variant.name}, ${variant.durationSeconds} seconds`}
            onClick={() => onSelect(variant.id)}
            className="relative z-10 flex-1 px-1.5 py-2.5 text-center transition-colors sm:px-2 sm:py-3"
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
              className="relative block font-sans text-[9px] font-bold leading-tight tracking-[0.04em] sm:text-[10px] sm:tracking-[0.06em]"
              style={{ color: active ? '#F4F0EB' : 'rgba(244,240,235,0.4)' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
