import { Link } from 'react-router-dom';
import SurgeLockup from '../brand/SurgeLockup';
import { BRAND } from '../../brand/tokens';
import { PRIMARY_NAV, SECONDARY_NAV, FOOTER_LEGAL } from '../../data/siteNav';

const FOOTER_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] px-5 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <SurgeLockup size="sm" theme="dark" href="/" />
            <p className="mt-4 max-w-xs font-sans text-[11px] leading-relaxed" style={{ color: BRAND.boneDim }}>
              Evidence-informed somatic regulation for the acute window. Secular. Private. No account required.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Site">
              {FOOTER_NAV.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="font-sans text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
                  style={{ color: BRAND.boneDim }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Legal">
              {FOOTER_LEGAL.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="font-sans text-[10px] uppercase tracking-[0.16em] transition-colors hover:text-[#B6502E]"
                  style={{ color: BRAND.boneDim }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-[10px] leading-relaxed tracking-[0.04em]" style={{ color: BRAND.boneDim }}>
            For acute nervous system regulation. Not a substitute for emergency medical care.
            Contains slow visual pulses and audio.
          </p>
          <p className="font-sans text-[10px] tracking-[0.04em]" style={{ color: BRAND.boneDim }}>
            © {new Date().getFullYear()} Martori Studio
          </p>
        </div>
      </div>
    </footer>
  );
}
