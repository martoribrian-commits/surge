import { motion } from 'framer-motion';

/**
 * Prominent medical disclaimer block — protective, readable, not buried in prose.
 */
export default function MedicalDisclaimer({ children }) {
  return (
    <motion.blockquote
      className="relative my-8 border-l-2 border-[#B6502E]/70 py-1 pl-6 pr-2 md:pl-8"
      initial={{ opacity: 0, x: -6 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <p className="font-sans text-[15px] font-medium leading-[1.8] tracking-[0.02em] text-[#F4F0EB]/90 md:text-base">
        {children}
      </p>
    </motion.blockquote>
  );
}
