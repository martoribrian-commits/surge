import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { unlockAudioContext } from '../../lib/proceduralAudio/shared';
import {
  buildFallbackCustomSequence,
  phaseAtElapsed,
} from '../../sequences/customSequence';
import { requestCustomSequenceGeneration } from '../../lib/craneClient';
import { InteractionMode } from '../../sequences';

const INTERACTION_LABELS = {
  auto: 'Starts on its own once you tap Begin',
  bilateral: 'Tap left, then right, in rhythm',
  hold: 'Press and hold anywhere below the header. Release to pause.',
};

const PROMPT_CHIPS = [
  'Nothing here matches how I feel',
  'I feel numb and shut down',
  'Grief is sitting heavy in my chest',
  'My thoughts are looping and I cannot stop',
];

/**
 * AI-powered custom sequence creator — Crane generates a procedural sequence
 * attuned to the user's reported body state when presets do not fit.
 */
export default function CustomSequenceCreator({
  customVariant,
  onApply,
  onClear,
  onBegin,
}) {
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(Boolean(customVariant));

  const handleGenerate = useCallback(async () => {
    const trimmed = description.trim();
    if (!trimmed) {
      setError('Describe what your body feels like right now.');
      return;
    }

    setError(null);
    setStatus('loading');
    unlockAudioContext();

    try {
      const result = await requestCustomSequenceGeneration({ userMessage: trimmed });
      const action = result.actions?.find((a) => a.type === 'custom_sequence');
      const spec = action?.customSpec ?? result.customSequence;

      if (spec) {
        onApply?.(spec);
        setExpanded(true);
        setStatus('ready');
        return;
      }

      const fallback = buildFallbackCustomSequence(trimmed);
      onApply?.(fallback.customSpec);
      setExpanded(true);
      setStatus('fallback');
    } catch {
      const fallback = buildFallbackCustomSequence(trimmed);
      onApply?.(fallback.customSpec);
      setExpanded(true);
      setStatus('fallback');
    }
  }, [description, onApply]);

  const active = customVariant;
  const phase = active ? phaseAtElapsed(active, 0) : null;

  return (
    <div className="mx-auto w-full max-w-xl">
      {!active ? (
        <div className="border border-dashed border-white/[0.12] bg-white/[0.02] px-5 py-5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <p
                className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: BRAND.clay }}
              >
                Nothing here fits?
              </p>
              <p className="mt-1 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                Crane can generate a sequence attuned to you right now.
              </p>
            </div>
            <span className="font-sans text-lg" style={{ color: BRAND.boneDim }}>
              {expanded ? '−' : '+'}
            </span>
          </button>

          {expanded ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-4"
            >
              <div className="flex flex-wrap gap-2">
                {PROMPT_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDescription(chip)}
                    className="rounded-sm border border-white/10 px-2.5 py-1.5 font-sans text-[10px] text-white/50 transition-colors hover:border-[#B6502E]/40 hover:text-white/75"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what your body feels like — no need to be clinical."
                className="w-full resize-none border border-white/10 bg-black/20 px-4 py-3 font-sans text-sm leading-relaxed text-[#F4F0EB] placeholder:text-white/25 focus:border-[#B6502E]/50 focus:outline-none"
              />

              {error ? (
                <p className="font-sans text-xs text-[#B6502E]">{error}</p>
              ) : null}

              <button
                type="button"
                disabled={status === 'loading'}
                onClick={handleGenerate}
                className="w-full border px-4 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-opacity disabled:opacity-50"
                style={{
                  color: BRAND.bone,
                  borderColor: `${BRAND.clay}66`,
                  background: `${BRAND.clay}18`,
                }}
              >
                {status === 'loading' ? 'Crane is building your sequence…' : 'Generate my sequence'}
              </button>

              <p className="font-sans text-[9px] leading-relaxed" style={{ color: BRAND.boneDim }}>
                Procedural sound and visuals · Headphones recommended · Not emergency care
              </p>
            </motion.div>
          ) : null}
        </div>
      ) : (
        <motion.article
          key={active.id}
          className="border px-6 py-5"
          style={{
            borderColor: `${active.palette.accent}44`,
            background: `linear-gradient(135deg, ${active.palette.accent}12, transparent)`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: BRAND.clay }}
              >
                Your sequence · Crane attuned
              </p>
              <h2 className="mt-1 font-sans text-2xl font-extrabold tracking-tight" style={{ color: BRAND.bone }}>
                {active.name}
              </h2>
              <p className="mt-1 font-sans text-sm font-medium" style={{ color: `${active.palette.accent}cc` }}>
                {active.tagline}
              </p>
            </div>
            <span
              className="shrink-0 rounded-sm px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{
                color: active.palette.accent,
                background: `${active.palette.accent}18`,
                border: `1px solid ${active.palette.accent}44`,
              }}
            >
              {active.durationSeconds}s
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <p className="font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
              {active.feelsLike}
            </p>
            {active.rationale ? (
              <p className="font-sans text-xs leading-relaxed italic" style={{ color: BRAND.boneDim }}>
                {active.rationale}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-white/[0.06] pt-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{
                background: `${active.palette.accentCalm ?? active.palette.accent}22`,
                color: active.palette.accentCalm ?? active.palette.accent,
              }}
            >
              {active.interactionMode === InteractionMode.BILATERAL
                ? '↔'
                : active.interactionMode === InteractionMode.HOLD
                  ? '●'
                  : '◦'}
            </span>
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: BRAND.boneMuted }}>
              {INTERACTION_LABELS[active.interactionMode]} · {phase?.label ?? 'Arrive'}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                unlockAudioContext();
                onBegin?.();
              }}
              className="flex-1 border px-4 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.24em]"
              style={{
                color: BRAND.bone,
                borderColor: `${active.palette.accent}66`,
                background: `linear-gradient(135deg, ${active.palette.accent}28, ${active.palette.accentCalm ?? active.palette.accent}12)`,
              }}
            >
              Begin {active.durationSeconds}s · {active.name}
            </button>
            <button
              type="button"
              onClick={() => {
                onClear?.();
                setDescription('');
                setStatus('idle');
                setExpanded(false);
              }}
              className="border border-white/10 px-4 py-3.5 font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white/70"
            >
              Start over
            </button>
          </div>

          {status === 'fallback' ? (
            <p className="mt-3 font-sans text-[9px]" style={{ color: BRAND.boneDim }}>
              Generated offline from your description. Crane will refine when connected.
            </p>
          ) : null}
        </motion.article>
      )}
    </div>
  );
}
