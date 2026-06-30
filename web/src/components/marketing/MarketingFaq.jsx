import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

const EASE = [0.22, 1, 0.36, 1];

/**
 * @param {{ items: Array<{ q: string, a: string }> }} props
 */
export default function MarketingFaq({ items }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="divide-y divide-white/[0.06] rounded-sm border border-white/[0.08]">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? -1 : index)}
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.02]"
              aria-expanded={open}
            >
              <p className="font-sans text-sm font-semibold leading-snug">{item.q}</p>
              <motion.span
                className="mt-0.5 shrink-0 font-sans text-lg"
                style={{ color: BRAND.boneDim }}
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                aria-hidden
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {open ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                    {item.a}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
