import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { stagger } from './marketingMotion';

const INTERACTION_LABELS = {
  auto: 'Auto · starts on its own',
  bilateral: 'Bilateral · tap left · right',
  hold: 'Hold · press and release to pause',
};

/**
 * @param {{ variant: import('../../sequences').SequenceVariant, index: number }} props
 */
export default function ProtocolCard({ variant, index }) {
  return (
    <motion.article
      {...stagger(index, 0.05)}
      className="flex h-full flex-col overflow-hidden rounded-sm border border-white/[0.08] bg-white/[0.02] transition-colors hover:border-white/[0.14]"
    >
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${variant.palette.accent}, ${variant.palette.accentCalm ?? variant.palette.accent})`,
        }}
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-sans text-base font-bold">{variant.name}</p>
            <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.12em]" style={{ color: BRAND.clay }}>
              {variant.modality}
            </p>
          </div>
          <p className="shrink-0 font-sans text-xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
            {variant.durationSeconds}s
          </p>
        </div>

        <p className="mt-3 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
          {variant.feelsLike}
        </p>

        <p className="mt-3 flex-1 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneDim }}>
          {variant.science}
        </p>

        <p className="mt-4 font-sans text-[9px] uppercase tracking-[0.12em]" style={{ color: BRAND.boneDim }}>
          {INTERACTION_LABELS[variant.interactionMode]}
        </p>

        <Link
          to={`/start?variant=${variant.id}`}
          className="mt-4 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
          style={{ color: BRAND.boneMuted }}
        >
          Try this sequence →
        </Link>
      </div>
    </motion.article>
  );
}
