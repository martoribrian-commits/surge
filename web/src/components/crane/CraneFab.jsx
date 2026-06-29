import { motion } from 'framer-motion';
import { useCrane } from '../../context/CraneProvider';

/**
 * Floating access to Crane — visible across the site unless hidden by context.
 */
export default function CraneFab() {
  const { isOpen, hideFab, openCrane } = useCrane();

  if (hideFab || isOpen) return null;

  return (
    <motion.button
      type="button"
      onClick={openCrane}
      aria-label="Ask Crane — get help choosing a sequence"
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-5 z-[60] flex items-center gap-2.5 border border-[#B6502E]/45 bg-[#0A0A0A]/90 px-4 py-3 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F4F0EB] shadow-lg backdrop-blur-md transition-colors hover:border-[#B6502E] hover:bg-[#B6502E]/15 sm:left-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      whileTap={{ scale: 0.97 }}
    >
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ background: '#B6502E22', color: '#B6502E' }}
        aria-hidden
      >
        C
      </span>
      Ask Crane
    </motion.button>
  );
}
