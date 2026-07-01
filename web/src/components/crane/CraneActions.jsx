import { Link, useNavigate } from 'react-router-dom';
import { useCraneOptional } from '../../context/CraneProvider';

/**
 * @typedef {Object} CraneAction
 * @property {'navigate'} type
 * @property {string} path
 * @property {string} label
 * @property {string} [variantId]
 * @property {string|null} [rationale]
 * @property {string|null} [prepNote]
 * @property {boolean} [primary]
 */

/**
 * Renders executable actions returned by Crane inference (sequence launch, care plan steps).
 */
export default function CraneActions({ actions, compact = false, onNavigate, onCustomSequence }) {
  const navigate = useNavigate();
  const crane = useCraneOptional();

  if (!Array.isArray(actions) || actions.length === 0) return null;

  const handleClick = (action) => {
    if (action.type === 'custom_sequence' && action.customSpec) {
      crane?.closeCrane?.();
      onCustomSequence?.(action.customSpec);
      onNavigate?.(action);
      navigate('/start');
      return;
    }
    if (action.type === 'navigate' && action.path) {
      crane?.closeCrane?.();
      onNavigate?.(action);
      navigate(action.path);
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? '' : 'mt-3 border-t border-white/[0.06] pt-3'}`}
      role="group"
      aria-label="Crane suggested actions"
    >
      {!compact ? (
        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B6502E]/80">
          Ready for you
        </p>
      ) : null}
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'flex-col sm:flex-row'}`}>
        {actions.map((action, index) => {
          if (action.type !== 'navigate' && action.type !== 'custom_sequence') return null;

          const isPrimary = action.primary ?? index === 0;

          return (
            <button
              key={`${action.type}-${action.path ?? action.label}-${index}`}
              type="button"
              onClick={() => handleClick(action)}
              className={`rounded-sm border px-4 py-2.5 text-left font-sans transition-colors ${
                isPrimary
                  ? 'border-[#B6502E]/50 bg-[#B6502E]/10 text-[#F4F0EB] hover:border-[#B6502E]/70'
                  : 'border-white/10 text-white/55 hover:border-white/25 hover:text-white/80'
              } ${compact ? 'text-[10px]' : 'text-[12px]'}`}
            >
              <span className="block font-medium tracking-[0.04em]">{action.label}</span>
              {action.prepNote && !compact ? (
                <span className="mt-1 block text-[10px] leading-relaxed text-white/40">
                  {action.prepNote}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {actions.some((a) => a.rationale) && !compact ? (
        <p className="font-sans text-[11px] leading-relaxed text-white/35">
          {actions.find((a) => a.rationale)?.rationale}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Inline link variant for sequence strip compatibility.
 */
export function CraneActionLinks({ actions, onNavigate }) {
  const crane = useCraneOptional();

  if (!Array.isArray(actions) || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, index) =>
        action.type === 'navigate' ? (
          <Link
            key={`${action.path}-${index}`}
            to={action.path}
            onClick={() => {
              crane?.closeCrane?.();
              onNavigate?.(action);
            }}
            className="shrink-0 rounded-sm border border-[#B6502E]/40 bg-[#B6502E]/10 px-3 py-2 font-sans text-[10px] text-[#F4F0EB] transition-colors hover:border-[#B6502E]/60"
          >
            {action.label}
          </Link>
        ) : null,
      )}
    </div>
  );
}
