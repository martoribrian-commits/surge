import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { fadeUp } from './marketingMotion';

/**
 * @param {{ primaryHref?: string, primaryLabel?: string, secondaryHref?: string, secondaryLabel?: string }} props
 */
export default function MarketingCtaBand({
  primaryHref = '/start',
  primaryLabel = 'Start a sequence',
  secondaryHref = '/faq',
  secondaryLabel = 'FAQ',
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.section
      {...fadeUp}
      className="relative overflow-hidden border-y border-white/[0.06]"
      style={{
        background: `linear-gradient(90deg, ${BRAND.clay}12 0%, rgba(10,10,10,0.95) 45%, rgba(75,136,184,0.08) 100%)`,
      }}
    >
      {!reducedMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${BRAND.clay}66, transparent)` }}
          animate={{ opacity: [0.3, 0.8, 0.3], scaleX: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-50"
          style={{ background: `linear-gradient(90deg, transparent, ${BRAND.clay}66, transparent)` }}
        />
      )}

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-5 py-12 sm:flex-row sm:justify-between">
        <p className="text-center font-sans text-lg font-bold tracking-tight sm:text-left">
          Ready when your body is not.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to={primaryHref}
            className="inline-block border px-7 py-3.5 font-sans text-[11px] font-semibold uppercase tracking-[0.26em] transition-all hover:scale-[1.02]"
            style={{
              color: BRAND.bone,
              borderColor: `${BRAND.clay}66`,
              background: `${BRAND.clay}20`,
            }}
          >
            {primaryLabel}
          </Link>
          <Link
            to={secondaryHref}
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-[#B6502E]"
            style={{ color: BRAND.boneDim }}
          >
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
