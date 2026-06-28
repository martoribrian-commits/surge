import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE = [0.22, 1, 0.36, 1];

const BUCKETS = [
  {
    id: 'technical',
    title: 'Technical support',
    summary: 'Load issues, audio, haptics, tokens',
    items: [
      'If the sequence will not start, refresh once and try again on a current browser.',
      'Audio requires a first touch to unlock on iOS and Safari. Tap the screen once before holding.',
      'Clinical tokens are six characters, case-sensitive. Contact your provider if validation fails.',
      'Provider portal access is separate from patient tokens. Use the email your clinic registered.',
    ],
  },
  {
    id: 'usage',
    title: 'App usage and sequences',
    summary: '30s, 60s, and 90s somatic flows',
    items: [
      '30s Instant Reset runs automatically once you begin. Breathe with the visual shift at ten seconds.',
      '60s Orienting Anchor requires alternating left and right taps in rhythm with the pulse.',
      '90s Coherence Ripple uses press-and-hold. Release to pause. Your progress is preserved.',
      'After any sequence, aftermath offers quiet next steps. Crane is optional.',
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback',
    summary: 'Product notes and accessibility',
    items: [
      'We read every message. We do not use feedback to train ad models or sell insights.',
      'Tell us if copy, motion, or contrast is hard to use under stress. That is useful data.',
      'Provider partnerships and clinical inquiries belong in the message field below.',
    ],
  },
];

export default function SupportAccordion() {
  const [openId, setOpenId] = useState('technical');

  return (
    <div className="space-y-0 border border-white/[0.06]">
      {BUCKETS.map((bucket) => {
        const open = openId === bucket.id;
        return (
          <div key={bucket.id} className="border-b border-white/[0.06] last:border-b-0">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : bucket.id)}
              className="flex w-full items-start justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.02]"
              aria-expanded={open}
            >
              <div>
                <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
                  {bucket.summary}
                </p>
                <p className="mt-1 font-sans text-base font-semibold tracking-[0.02em] text-[#F4F0EB]">
                  {bucket.title}
                </p>
              </div>
              <motion.span
                className="mt-1 shrink-0 font-sans text-lg text-white/25"
                animate={{ rotate: open ? 45 : 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                aria-hidden
              >
                +
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden"
                >
                  <ul className="space-y-3 px-5 pb-6">
                    {bucket.items.map((item) => (
                      <li
                        key={item}
                        className="font-sans text-[14px] leading-[1.7] text-white/45"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
