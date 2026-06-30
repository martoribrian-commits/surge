import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';
import SiteHeader from '../layout/SiteHeader';
import { SiteFooter } from '../marketing';
import { FOOTER_LEGAL } from '../../data/siteNav';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Shared shell for legal pages — matches marketing chrome.
 */
export default function LegalLayout({ title, eyebrow = 'Martori Studio', children }) {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#F4F0EB]">
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(182,80,46,0.06) 0%, transparent 55%)',
        }}
      />
      <FilmGrainOverlay />

      <div className="relative z-10">
        <div className="mx-auto max-w-2xl px-6 py-[max(1.25rem,env(safe-area-inset-top))] md:px-10">
          <SiteHeader />

          <header className="mb-14 border-b border-white/[0.06] pb-8">
            <nav className="mb-8 flex flex-wrap gap-5" aria-label="Legal">
              {FOOTER_LEGAL.map((link) => {
                const active = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    aria-current={active ? 'page' : undefined}
                    className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors"
                    style={{ color: active ? '#B6502E' : 'rgba(244,240,235,0.35)' }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                to="/support"
                className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-[#B6502E]"
              >
                Support
              </Link>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: EASE }}
            >
              <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-[#B6502E]">
                {eyebrow}
              </p>
              <h1 className="mt-3 font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[0.06em] text-[#F4F0EB]">
                {title}
              </h1>
            </motion.div>
          </header>

          <AnimatePresence mode="wait">
            <motion.main
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.65, ease: EASE }}
              className="pb-16 font-sans"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
