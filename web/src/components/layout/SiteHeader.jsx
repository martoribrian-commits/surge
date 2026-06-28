import { Link, useLocation } from 'react-router-dom';
import SurgeLockup from '../brand/SurgeLockup';

const NAV = [
  { href: '/how-it-works', label: 'Science' },
  { href: '/for-providers', label: 'Providers' },
];

export default function SiteHeader({ theme = 'dark' }) {
  const { pathname } = useLocation();
  const linkClass =
    theme === 'dark'
      ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-[#B6502E]'
      : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B] transition-colors hover:text-[#B6502E]';

  return (
    <header className="mb-8 flex items-center justify-between">
      <SurgeLockup size="sm" theme={theme} href="/" />
      <nav className="flex items-center gap-6" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`${linkClass} ${pathname === item.href ? 'text-[#B6502E]' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
