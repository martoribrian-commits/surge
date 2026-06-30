import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { fadeUp } from './marketingMotion';

/**
 * Consistent section kicker + headline for marketing pages.
 */
export default function MarketingSectionHeader({
  kicker,
  title,
  description,
  align = 'left',
  className = '',
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'max-w-2xl';

  return (
    <motion.div {...fadeUp} className={`mb-10 ${alignClass} ${className}`}>
      {kicker ? (
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
          {kicker}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-3 font-sans text-[clamp(1.35rem,3vw,2rem)] font-extrabold leading-tight tracking-[-0.02em]">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
