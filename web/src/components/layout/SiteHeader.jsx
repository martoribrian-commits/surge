import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import SurgeLockup from '../brand/SurgeLockup';
import { useCraneOptional } from '../../context/CraneProvider';
import { ALL_HEADER_NAV, isNavActive } from '../../data/siteNav';

export default function SiteHeader({ theme = 'dark' }) {
  const { pathname } = useLocation();
  const crane = useCraneOptional();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass =
    theme === 'dark'
      ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-[#B6502E]'
      : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B] transition-colors hover:text-[#B6502E]';

  const navLink = (item, onNavigate) => {
    const active = isNavActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={`${linkClass} ${active ? 'text-[#B6502E] underline decoration-[#B6502E]/40 underline-offset-4' : ''}`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="relative mb-8">
      <div className="flex items-center justify-between gap-4">
        <SurgeLockup size="sm" theme={theme} href="/" />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
          {ALL_HEADER_NAV.map((item) => navLink(item))}
          {crane ? (
            <button type="button" onClick={crane.openCrane} className={linkClass}>
              Ask Crane
            </button>
          ) : (
            <Link to="/crane" className={linkClass}>
              Ask Crane
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/10 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="site-mobile-nav"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="font-sans text-lg text-white/60" aria-hidden>
            {menuOpen ? '×' : '≡'}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.nav
            id="site-mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden md:hidden"
            aria-label="Mobile"
          >
            <div className="mt-4 space-y-1 rounded-sm border border-white/[0.08] bg-white/[0.02] p-3">
              {ALL_HEADER_NAV.map((item) => (
                <div key={item.href} className="py-2">
                  {navLink(item, () => setMenuOpen(false))}
                </div>
              ))}
              <div className="border-t border-white/[0.06] pt-3">
                {crane ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      crane.openCrane();
                    }}
                    className={linkClass}
                  >
                    Ask Crane
                  </button>
                ) : (
                  <Link to="/crane" className={linkClass} onClick={() => setMenuOpen(false)}>
                    Ask Crane
                  </Link>
                )}
              </div>
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
