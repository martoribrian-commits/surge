import { Link } from 'react-router-dom';
import { VARIANT_LABELS } from '../../lib/craneCarePlanUtils';

const CONFIDENCE_LABELS = {
  high: 'Strong match',
  medium: 'Good match',
  low: 'Possible match',
};

/**
 * Clinical somatic insight card — somatic read or post-session debrief.
 */
export default function CraneBodyInsight({ insight, compact = false }) {
  if (!insight) return null;

  const isDebrief = insight.type === 'post-session-debrief';

  return (
    <div
      className={`rounded-sm border border-[#4A88B8]/25 bg-[#4A88B8]/08 ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
      role="region"
      aria-label={isDebrief ? 'Body debrief' : 'Somatic read'}
    >
      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.2em] text-[#6B9AAA]">
        {isDebrief ? 'What happened in your body' : 'Clinical somatic read'}
      </p>

      {isDebrief ? (
        <>
          {insight.completedVariantName ? (
            <p className="mt-1 font-sans text-[10px] text-white/35">
              After {insight.completedVariantName}
            </p>
          ) : null}
          <p
            className={`mt-2 font-sans leading-relaxed text-white/75 ${
              compact ? 'text-[12px]' : 'text-[13px]'
            }`}
          >
            {insight.debriefSummary}
          </p>
          {insight.autonomicShift ? (
            <p className="mt-2 font-sans text-[11px] text-white/45">
              Shift: {insight.autonomicShift}
            </p>
          ) : null}
          {insight.expectedSensations?.length ? (
            <ul className="mt-3 space-y-1 font-sans text-[11px] text-white/40">
              {insight.expectedSensations.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          ) : null}
          {insight.watchFor ? (
            <p className="mt-3 font-sans text-[10px] text-white/35">Watch for: {insight.watchFor}</p>
          ) : null}
        </>
      ) : (
        <>
          <p
            className={`mt-2 font-sans leading-relaxed text-white/75 ${
              compact ? 'text-[12px]' : 'text-[13px]'
            }`}
          >
            {insight.autonomicRead}
          </p>
          {insight.primaryProtocolName ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-sm border border-[#B6502E]/35 bg-[#B6502E]/10 px-2 py-1 font-sans text-[10px] text-[#F4F0EB]">
                {insight.primaryProtocolName}
              </span>
              {insight.matchConfidence ? (
                <span className="font-sans text-[9px] uppercase tracking-[0.14em] text-white/35">
                  {CONFIDENCE_LABELS[insight.matchConfidence] ?? insight.matchConfidence}
                </span>
              ) : null}
            </div>
          ) : null}
          {insight.whyThisProtocol ? (
            <p className="mt-2 font-sans text-[11px] text-white/45">{insight.whyThisProtocol}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
