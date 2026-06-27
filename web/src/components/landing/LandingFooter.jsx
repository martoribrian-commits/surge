import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-black px-6 py-20 md:px-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="mb-6 font-sans text-sm text-[#6d8578]">
            Ready when you are. No account required to begin.
          </p>
          <Link
            to="/surge"
            className="group relative inline-flex overflow-hidden rounded-full px-12 py-4 font-sans text-[11px] uppercase tracking-[0.28em] text-[#d4e4dc]"
          >
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03] transition-colors duration-700 group-hover:border-[#f5a623]/25 group-hover:bg-white/[0.06]"
            />
            <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
              Enter the engine
            </span>
          </Link>
        </motion.div>

        <p className="max-w-lg font-sans text-[10px] leading-relaxed tracking-[0.04em] text-[#4a5f54]">
          For acute nervous system regulation. Not a substitute for emergency
          medical care. Contains slow visual pulses and audio.
        </p>
      </div>
    </footer>
  );
}
