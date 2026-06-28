import { motion } from 'framer-motion';
import { getVariant } from '../../sequences';
import VariantTabBar from './VariantTabBar';

const INTERACTION_LABELS = {
  auto: 'Starts on its own once you begin',
  bilateral: 'Tap left, then right, in rhythm',
  hold: 'Hold anywhere. Release to pause.',
};

/**
 * Entry picker — tab bar + detail card. Switching is one tap on 30 / 60 / 90.
 */
export default function SequencePicker({ activeId, onSelect }) {
  const variant = getVariant(activeId);
  const interactionKey = variant.interactionMode;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <p className="mb-3 text-center font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-white/35">
          Select duration
        </p>
        <VariantTabBar activeId={activeId} onSelect={onSelect} />
      </div>

      <motion.article
        key={activeId}
        className="border border-white/[0.08] bg-white/[0.02] px-6 py-5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-sans text-2xl font-extrabold tracking-tight text-[#F4F0EB]">
              {variant.name}
            </h2>
            <p className="mt-1 font-sans text-sm font-medium text-white/50">
              {variant.tagline}
            </p>
          </div>
          <span
            className="shrink-0 rounded-sm px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em]"
            style={{
              color: variant.palette.accent,
              background: `${variant.palette.accent}18`,
              border: `1px solid ${variant.palette.accent}44`,
            }}
          >
            {variant.durationSeconds}s
          </span>
        </div>

        <p className="mt-4 font-sans text-sm leading-relaxed text-white/45">
          {variant.science}
        </p>

        <div
          className="mt-5 flex items-center gap-3 border-t border-white/[0.06] pt-4"
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: `${variant.palette.accentCalm ?? variant.palette.accent}22`,
              color: variant.palette.accentCalm ?? variant.palette.accent,
            }}
          >
            {interactionKey === 'bilateral' ? '↔' : interactionKey === 'hold' ? '●' : '◦'}
          </span>
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
            {INTERACTION_LABELS[interactionKey]}
          </p>
        </div>
      </motion.article>
    </div>
  );
}
