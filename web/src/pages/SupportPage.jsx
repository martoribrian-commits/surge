import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import { SupportAccordion, SupportContactForm } from '../components/support';
import { MarketingShell, MarketingCtaBand, SiteFooter, fadeUp } from '../components/marketing';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

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
            Direct answers. No chatbot. Check{' '}
            <Link to="/faq" className="underline decoration-[#B6502E]/40 underline-offset-2 hover:text-[#B6502E]">
              FAQ
            </Link>{' '}
            first, then reach out below.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
          <SupportAccordion />
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
