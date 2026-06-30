import { Link, useLocation } from 'react-router-dom';
import SurgeLockup from '../brand/SurgeLockup';
import { useCraneOptional } from '../../context/CraneProvider';

const NAV = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/for-providers', label: 'Providers' },
  { href: '/faq', label: 'FAQ' },
  { href: '/start', label: 'Start' },
];

export default function SiteHeader({ theme = 'dark' }) {
  const { pathname } = useLocation();
  const crane = useCraneOptional();
  const linkClass =
    theme === 'dark'
      ? 'text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-[#B6502E]'
      : 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6B6B] transition-colors hover:text-[#B6502E]';

  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <SurgeLockup size="sm" theme={theme} href="/" />
      <nav className="flex items-center gap-4 sm:gap-6" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`${linkClass} ${pathname === item.href || (item.href === '/start' && pathname.startsWith('/engine')) ? 'text-[#B6502E]' : ''}`}
          >
            {item.label}
          </Link>
        ))}
        {crane ? (
          <button
            type="button"
            onClick={crane.openCrane}
            className={`${linkClass} hidden sm:inline`}
          >
            Ask Crane
          </button>
        ) : (
          <Link to="/crane" className={`${linkClass} hidden sm:inline`}>
            Ask Crane
          </Link>
        )}
      </nav>
    </header>
  );
}
