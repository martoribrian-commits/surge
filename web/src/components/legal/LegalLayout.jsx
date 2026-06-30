import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FilmGrainOverlay from '../FilmGrainOverlay';

const EASE = [0.25, 0.1, 0.25, 1];

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/support', label: 'Support' },
];

/**
 * Shared shell for legal and support pages — dark canvas, slow fade, scannable hierarchy.
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

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-[max(1.5rem,env(safe-area-inset-top))] pb-24 md:px-10">
        <header className="mb-14 border-b border-white/[0.06] pb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em] text-white/30 transition-colors hover:text-[#B6502E]"
            >
              ← Back home
            </Link>
            <nav className="flex gap-5" aria-label="Legal and support">
              {LEGAL_LINKS.map((link) => {
                const active = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors"
                    style={{ color: active ? '#B6502E' : 'rgba(244,240,235,0.35)' }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <motion.div
            className="mt-10"
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
            className="font-sans"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        <footer className="mt-20 border-t border-white/[0.06] pt-8">
          <p className="font-sans text-[10px] leading-relaxed tracking-[0.04em] text-white/25">
            Surge is a secular somatic utility by Martori Studio. Last updated June 2026.
          </p>
        </footer>
      </div>
    </div>
  );
}
