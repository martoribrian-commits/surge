import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import { SupportAccordion, SupportContactForm } from '../components/support';
import { MarketingShell, MarketingCtaBand, SiteFooter, fadeUp } from '../components/marketing';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

const QUICK_LINKS = [
  { to: '/faq', label: 'FAQ' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/clinical-token', label: 'Clinical token' },
  { to: '/start', label: 'Start a sequence' },
];

export default function SupportPage() {
  usePageMeta(PAGE_META.support);

  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-5 py-[max(1.25rem,env(safe-area-inset-top))]">
        <SiteHeader />

        <motion.div {...fadeUp} className="pb-10 pt-4">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Help
          </p>
          <h1 className="mt-3 font-sans text-[clamp(1.75rem,4vw,2.25rem)] font-extrabold tracking-tight">
            Support
          </h1>
          <p className="mt-3 max-w-md font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            Direct answers below. Use the form for human support. Crane is separate from tickets.
          </p>
        </motion.div>

        <motion.section
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.04 }}
          className="mb-8 rounded-sm border border-[#B6502E]/25 bg-[#B6502E]/08 p-5"
        >
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: BRAND.clay }}>
            If you are in crisis
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            Surge is not emergency care. If you might hurt yourself or someone else, call{' '}
            <a href="tel:988" className="underline hover:text-[#B6502E]">
              988
            </a>{' '}
            (US) or your local emergency number now.
          </p>
        </motion.section>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <SupportAccordion />
        </motion.div>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-sm border border-white/[0.08] px-3 py-2 font-sans text-[10px] uppercase tracking-[0.16em] transition-colors hover:border-[#B6502E]/35"
              style={{ color: BRAND.boneDim }}
            >
              {link.label}
            </Link>
          ))}
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="mt-12">
          <SupportContactForm />
        </motion.div>
      </div>

      <MarketingCtaBand />
      <SiteFooter />
    </MarketingShell>
  );
}
