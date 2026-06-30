import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import SiteHeader from '../components/layout/SiteHeader';
import { MarketingShell, MarketingSectionHeader, SiteFooter, MarketingFaq, MarketingCtaBand } from '../components/marketing';
import CaseStudyCarousel from '../components/marketing/CaseStudyCarousel';
import { FAQ_CATEGORIES, FAQ_BY_CATEGORY, FAQ_QUICK } from '../data/faqContent';
import { EVIDENCE_STUDIES } from '../data/evidenceStudies';
import { usePageMeta } from '../hooks/usePageMeta';
import { PAGE_META } from '../data/pageMeta';
import { BRAND } from '../brand/tokens';

export default function FaqPage() {
  usePageMeta(PAGE_META.faq);
  const [category, setCategory] = useState('general');
  const items = FAQ_BY_CATEGORY[category] ?? [];

  return (
    <MarketingShell glow="cool">
      <div className="mx-auto max-w-5xl px-5 py-[max(1.25rem,env(safe-area-inset-top))]">
        <SiteHeader />

        <div className="pb-8 pt-4">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            FAQ
          </p>
          <h1 className="mt-3 font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold tracking-[-0.03em]">
            Quick answers
          </h1>
        </div>

        {/* Quick stat strip */}
        <div className="mb-12 grid grid-cols-3 gap-3">
          {FAQ_QUICK.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-sm border border-white/[0.08] bg-white/[0.02] px-3 py-4 text-center"
            >
              <p className="font-sans text-2xl font-extrabold tabular-nums" style={{ color: BRAND.clay }}>
                {item.value}
              </p>
              <p className="mt-1 font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-10 pb-20 lg:grid-cols-[220px_1fr]">
          {/* Category tabs */}
          <LayoutGroup>
            <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1" aria-label="FAQ categories">
              {FAQ_CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className="relative rounded-sm px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors"
                    style={{ color: active ? BRAND.bone : BRAND.boneDim }}
                  >
                    {active ? (
                      <motion.span
                        layoutId="faq-tab-bg"
                        className="absolute inset-0 rounded-sm border border-[#B6502E]/40 bg-[#B6502E]/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <span className="relative z-10 flex items-center gap-2">
                      <span aria-hidden style={{ color: active ? BRAND.clay : BRAND.boneDim }}>
                        {cat.icon}
                      </span>
                      {cat.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </LayoutGroup>

          {/* FAQ panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={category}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.35 }}
            >
              <MarketingFaq items={items} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Evidence carousel */}
        <section className="border-t border-white/[0.06] py-16">
          <MarketingSectionHeader
            kicker="Published research"
            title="Real studies. Named protocols."
            description="Not testimonials. Peer-reviewed outcomes mapped to Surge sequences."
          />
          <CaseStudyCarousel studies={EVIDENCE_STUDIES} />
        </section>
      </div>

      <MarketingCtaBand />
      <SiteFooter />
    </MarketingShell>
  );
}
