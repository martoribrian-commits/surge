import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { getVariant } from '../../sequences';

const SLIDE_EASE = [0.25, 0.1, 0.25, 1];

/**
 * Visual research carousel. Big metrics, minimal copy.
 * @param {{ studies: import('../../data/evidenceStudies').EVIDENCE_STUDIES }} props
 */
export default function CaseStudyCarousel({ studies, autoAdvanceMs = 6000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const study = studies[index];
  const variant = getVariant(study.variantId);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % studies.length);
  }, [studies.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + studies.length) % studies.length);
  }, [studies.length]);

  useEffect(() => {
    if (paused || studies.length <= 1) return undefined;
    const timer = window.setInterval(next, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [paused, next, autoAdvanceMs, studies.length]);

  return (
    <div
      className="relative overflow-hidden rounded-sm border border-white/[0.08]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Protocol color wash */}
      <AnimatePresence mode="wait">
        <motion.div
          key={study.id}
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background: `radial-gradient(ellipse 70% 60% at 20% 50%, ${variant.palette.accent}18 0%, transparent 60%)`,
          }}
        />
      </AnimatePresence>

      <div className="relative grid min-h-[280px] items-center gap-6 p-6 sm:grid-cols-[1fr_1.2fr] sm:p-8">
        {/* Metric block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`metric-${study.id}`}
            initial={{ opacity: 0, x: -20, filter: 'blur(4px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 20, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: SLIDE_EASE }}
            className="text-center sm:text-left"
          >
            <p
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: variant.palette.accent }}
            >
              {study.protocol}
            </p>
            <p className="mt-2 font-sans text-[clamp(3rem,8vw,4.5rem)] font-extrabold leading-none tabular-nums tracking-tight">
              {study.metricPrefix ?? ''}
              {study.metric}
              {study.metricSuffix ?? ''}
            </p>
            <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
              {study.metricLabel}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Copy block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`copy-${study.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45, ease: SLIDE_EASE, delay: 0.05 }}
          >
            <p className="font-sans text-lg font-bold leading-snug sm:text-xl">{study.headline}</p>
            <p className="mt-2 font-sans text-xs uppercase tracking-[0.12em]" style={{ color: BRAND.boneDim }}>
              {study.detail}
            </p>
            <a
              href={study.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block font-sans text-[10px] italic tracking-[0.04em] underline decoration-white/20 underline-offset-2 transition-colors hover:text-[#B6502E] hover:decoration-[#B6502E]/40"
              style={{ color: BRAND.boneMuted }}
            >
              {study.cite}
            </a>
            <Link
              to={`/start?variant=${study.variantId}`}
              className="mt-5 inline-block font-sans text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
              style={{ color: BRAND.clay }}
            >
              Try {study.protocol} →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="relative flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
        <div className="flex gap-1.5">
          {studies.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Study ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 24 : 6,
                background: i === index ? BRAND.clay : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prev}
            aria-label="Previous study"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/[0.1] font-sans text-sm transition-colors hover:border-[#B6502E]/40"
            style={{ color: BRAND.boneDim }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next study"
            className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/[0.1] font-sans text-sm transition-colors hover:border-[#B6502E]/40"
            style={{ color: BRAND.boneDim }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
