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
 * Structured post-session or regulation care plan with step completion checkboxes.
 */
export default function CraneCarePlan({
  carePlan,
  compact = false,
  onStepClick,
  onToggleStep,
  isStepComplete,
  showCompletion = true,
}) {
  if (!carePlan?.steps?.length) return null;

  const completedName = carePlan.completedVariantId
    ? (VARIANT_LABELS[carePlan.completedVariantId] ?? carePlan.completedVariantId)
    : null;

  const completedSet = new Set(carePlan.completedSteps ?? []);
  const allDone = carePlan.steps.every((s) => completedSet.has(s.order));
  const nextOrder = carePlan.steps.find((s) => !completedSet.has(s.order))?.order;

  return (
    <div
      className={`rounded-sm border border-white/[0.08] bg-white/[0.02] ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
      role="region"
      aria-label="Care plan"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#B6502E]/90">
          {carePlan.planType === 'post-session' ? 'Recovery plan' : 'Regulation plan'}
        </p>
        {showCompletion && onToggleStep ? (
          <span className="font-sans text-[9px] tabular-nums text-white/30">
            {completedSet.size}/{carePlan.steps.length}
          </span>
        ) : null}
      </div>
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
          const done = completedSet.has(step.order);
          const isNext = step.order === nextOrder;

          return (
            <li
              key={step.order}
              className={`flex gap-3 font-sans text-[12px] leading-relaxed transition-opacity ${
                done ? 'opacity-45' : isNext ? 'text-white/85' : 'text-white/70'
              }`}
            >
              {onToggleStep ? (
                <button
                  type="button"
                  onClick={() => onToggleStep(step.order)}
                  aria-label={done ? `Mark step ${step.order} incomplete` : `Complete step ${step.order}`}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                    done
                      ? 'border-[#B6502E]/60 bg-[#B6502E]/25 text-[#F4F0EB]'
                      : isNext
                        ? 'border-[#B6502E]/50 bg-transparent hover:border-[#B6502E]/70'
                        : 'border-white/20 bg-transparent hover:border-white/35'
                  }`}
                >
                  {done ? (
                    <span className="text-[10px] leading-none" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              ) : (
                <span className="shrink-0 font-semibold tabular-nums text-[#B6502E]/80">
                  {step.order}.
                </span>
              )}
              <div className="min-w-0 flex-1">
                {categoryLabel ? (
                  <span className="mb-0.5 block text-[9px] uppercase tracking-[0.14em] text-white/30">
                    {categoryLabel}
                    {isNext && !done ? ' · next' : null}
                  </span>
                ) : null}
                <span className={done ? 'line-through decoration-white/25' : ''}>{step.action}</span>
                {step.variantId && !done ? (
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
      {allDone && onToggleStep ? (
        <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.14em] text-[#6B9AAA]">
          Plan complete
        </p>
      ) : null}
    </div>
  );
}
