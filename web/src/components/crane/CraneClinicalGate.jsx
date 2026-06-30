import { Link } from 'react-router-dom';

/**
 * Upsell when proactive AI features require a clinical token.
 */
export default function CraneClinicalGate({ compact = false }) {
  return (
    <div
      className={`rounded-sm border border-white/[0.08] bg-white/[0.02] ${
        compact ? 'p-3' : 'p-4'
      }`}
    >
      <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.18em] text-[#B6502E]/80">
        Clinical access
      </p>
      <p
        className={`mt-2 font-sans leading-relaxed text-white/45 ${
          compact ? 'text-[11px]' : 'text-[12px]'
        }`}
      >
        Personalized recovery plans and body debriefs use Crane&apos;s clinical AI stack (Sonnet
        executor + Opus advisor). Enter the token from your provider to unlock.
      </p>
      <Link
        to="/clinical-token"
        className="mt-3 inline-block rounded-sm border border-[#B6502E]/40 px-3 py-2 font-sans text-[10px] uppercase tracking-[0.14em] text-[#F4F0EB] transition-colors hover:border-[#B6502E]/60"
      >
        Enter clinical token
      </Link>
    </div>
  );
}
