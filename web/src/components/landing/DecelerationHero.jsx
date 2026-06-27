import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * Scroll-linked deceleration — acute distress at the top settles into calm
 * as the user moves through the 90-second ritual narrative.
 */
export default function DecelerationHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const distressOpacity = useTransform(scrollYProgress, [0, 0.32], [1, 0]);
  const calmOpacity = useTransform(scrollYProgress, [0.28, 0.62], [0, 1]);
  const forestLayer = useTransform(scrollYProgress, [0.12, 0.55], [0, 1]);
  const oceanLayer = useTransform(scrollYProgress, [0.38, 0.78], [0, 0.75]);
  const dawnLayer = useTransform(scrollYProgress, [0.58, 1], [0, 0.55]);
  const headlineY = useTransform(scrollYProgress, [0, 0.45], [0, -28]);
  const ritualOpacity = useTransform(scrollYProgress, [0.48, 0.82], [0, 1]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  return (
    <section ref={containerRef} className="relative h-[280vh]" aria-label="The 90-second ritual">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 bg-black" aria-hidden />

        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-[#061008] via-[#143328] to-[#0a1812]"
          style={{ opacity: forestLayer }}
          aria-hidden
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#081420] via-[#1a3a52] to-[#0c1a28]"
          style={{ opacity: oceanLayer }}
          aria-hidden
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-[#1a140c]/80 via-[#3d3428]/40 to-transparent"
          style={{ opacity: dawnLayer }}
          aria-hidden
        />

        <div className="relative z-10 flex max-w-3xl flex-col items-center px-8 text-center">
          <motion.div style={{ opacity: distressOpacity, y: headlineY }}>
            <p className="mb-6 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
              Acute physiological state
            </p>
            <h1 className="font-sans text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl md:tracking-[-0.02em]">
              Your body is running
              <br />
              faster than the moment.
            </h1>
            <p className="mx-auto mt-8 max-w-md font-sans text-base leading-relaxed text-white/55 md:text-lg">
              Surge is a somatic circuit breaker. Secular. Private. Built for the
              seconds when your nervous system will not wait for an appointment.
            </p>
          </motion.div>

          <motion.div
            className="absolute inset-x-0 flex flex-col items-center px-8"
            style={{ opacity: calmOpacity }}
          >
            <p className="mb-5 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#a8c4b4]">
              The ninety-second ritual
            </p>
            <h2 className="font-sans text-3xl font-semibold leading-snug tracking-tight text-[#e8f0eb] md:text-5xl">
              Hold. Let the noise
              <br />
              drain out.
            </h2>
            <p className="mx-auto mt-8 max-w-lg font-sans text-base leading-relaxed text-[#b8cfc4]/90 md:text-lg">
              One continuous touch. No streaks, no scores, no feed. Your data stays
              yours. The session ends when your system settles, not when an algorithm
              says so.
            </p>
          </motion.div>

          <motion.div
            className="absolute inset-x-0 bottom-[18vh] flex flex-col items-center px-8 md:bottom-[14vh]"
            style={{ opacity: ritualOpacity }}
          >
            <p className="font-sans text-sm tracking-[0.08em] text-[#c9ddd2]/80">
              Scroll to see how the hold works.
            </p>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity }}
        >
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/30">
            Scroll
          </span>
          <motion.span
            className="block h-8 w-px bg-white/20"
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </section>
  );
}
