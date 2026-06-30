import { motion } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';
import { BRAND } from '../../brand/tokens';

/**
 * Shared dark marketing page wrapper — atmosphere + grain.
 */
export default function MarketingShell({ children, glow = 'ember' }) {
  const glowStyle =
    glow === 'cool'
      ? 'radial-gradient(ellipse 70% 45% at 80% 0%, rgba(75,136,184,0.1) 0%, transparent 50%)'
      : glow === 'split'
        ? `radial-gradient(ellipse 80% 50% at 50% -10%, ${BRAND.emberGlow} 0%, transparent 55%)`
        : `radial-gradient(ellipse 90% 55% at 50% -5%, ${BRAND.emberGlow} 0%, transparent 58%)`;

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: BRAND.void, color: BRAND.bone }}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-40" style={{ background: BRAND.warmWash }} />
        <motion.div className="absolute inset-0" animate={{ background: glowStyle }} />
      </div>
      <FilmGrainOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
