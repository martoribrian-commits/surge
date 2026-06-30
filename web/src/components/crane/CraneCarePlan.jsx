import { Link } from 'react-router-dom';
import { VARIANT_LABELS } from '../../lib/craneCarePlanUtils';

const CATEGORY_LABELS = {
  rest: 'Rest',
  grounding: 'Grounding',
  sequence: 'Sequence',
  hydration: 'Hydration',
  environment: 'Environment',
};

/**
 * Structured post-session or regulation care plan from Crane.
 */
export default function CraneCarePlan({ carePlan, compact = false, onStepClick }) {
  if (!carePlan?.steps?.length) return null;

  const completedName = carePlan.completedVariantId
    ? (VARIANT_LABELS[carePlan.completedVariantId] ?? carePlan.completedVariantId)
    : null;

  return (
    <div
      className={`rounded-sm border border-white/[0.08] bg-white/[0.02] ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
      role="region"
      aria-label="Care plan"
    >
      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#B6502E]/90">
        {carePlan.planType === 'post-session' ? 'Recovery plan' : 'Regulation plan'}
      </p>
      {completedName ? (
        <p className="mt-1 font-sans text-[10px] text-white/35">After {completedName}</p>
      ) : null}
      {carePlan.clinicalNote ? (
        <p
          className={`mt-2 font-sans leading-relaxed text-white/55 ${
            compact ? 'text-[11px]' : 'text-[12px]'
          }`}
        >
          {carePlan.clinicalNote}
        </p>
      ) : null}
      <ol className={`mt-3 space-y-2 ${compact ? '' : 'mt-4 space-y-3'}`}>
        {carePlan.steps.map((step) => {
          const categoryLabel = CATEGORY_LABELS[step.category] ?? null;
          const sequenceName = step.variantId
            ? (VARIANT_LABELS[step.variantId] ?? step.variantId)
            : null;

          return (
            <li
              key={step.order}
              className="flex gap-3 font-sans text-[12px] leading-relaxed text-white/70"
            >
              <span className="shrink-0 font-semibold tabular-nums text-[#B6502E]/80">
                {step.order}.
              </span>
              <div className="min-w-0 flex-1">
                {categoryLabel ? (
                  <span className="mb-0.5 block text-[9px] uppercase tracking-[0.14em] text-white/30">
                    {categoryLabel}
                  </span>
                ) : null}
                <span>{step.action}</span>
                {step.variantId ? (
                  <Link
                    to={`/engine/${step.variantId}`}
                    onClick={() => onStepClick?.(step)}
                    className="mt-1.5 inline-block text-[10px] uppercase tracking-[0.12em] text-[#B6502E] hover:text-[#F4F0EB]"
                  >
                    Start {sequenceName}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
