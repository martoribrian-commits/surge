import { motion } from 'framer-motion';

const RING_DELAYS = [0, 0.8, 1.6];

/**
 * Demonstrates Surge's continuous-touch anchor with a pulsing focal point
 * and copy on haptic + binaural grounding.
 */
export default function TactileAnchorSection() {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#0a120e] px-6 py-24 md:px-12"
      aria-label="Tactile anchoring"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#7fa892]">
            Tactile anchoring
          </p>
          <h2 className="font-sans text-3xl font-semibold leading-snug tracking-tight text-[#eef4f0] md:text-4xl">
            One point of contact.
            <br />
            The whole field responds.
          </h2>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed text-[#9eb5a8]">
            Press and hold anywhere on the screen. Release, and the cycle pauses.
            That is the dead-man&apos;s switch: your body stays in control.
          </p>
          <p className="mt-5 max-w-md font-sans text-base leading-relaxed text-[#9eb5a8]">
            Syncopated haptic pulses start sharp and chaotic, then resolve into a
            slow sixty-beat-per-minute thud as your system downshifts. Cinematic
            binaural audio carries the same arc: dense noise at the peak, carved
            down to a warm sub-bass heartbeat by the end.
          </p>
          <p className="mt-5 max-w-md font-sans text-sm leading-relaxed text-[#6d8578]">
            Visual, audio, and touch channels stay phase-locked for the full ninety
            seconds. No toggles. No settings. Just hold.
          </p>
        </motion.div>

        <motion.div
          className="relative mx-auto flex aspect-square w-full max-w-md items-center justify-center"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.2, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="absolute inset-0 rounded-full border border-white/[0.06]" aria-hidden />

          {RING_DELAYS.map((delay) => (
            <motion.span
              key={delay}
              className="absolute rounded-full border border-[#f5a623]/25"
              style={{ width: '72%', height: '72%' }}
              animate={{
                scale: [0.85, 1.35],
                opacity: [0.35, 0],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: 'easeOut',
                delay,
              }}
              aria-hidden
            />
          ))}

          <motion.div
            className="relative flex h-28 w-28 items-center justify-center rounded-full md:h-36 md:w-36"
            animate={{
              scale: [1, 1.06, 1],
              boxShadow: [
                '0 0 0 0 rgba(245, 166, 35, 0.15)',
                '0 0 48px 12px rgba(245, 166, 35, 0.12)',
                '0 0 0 0 rgba(245, 166, 35, 0.15)',
              ],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span
              className="absolute inset-0 rounded-full bg-gradient-to-br from-[#fff8eb]/20 via-[#f5a623]/30 to-[#8b6914]/10"
              aria-hidden
            />
            <span className="relative h-2 w-2 rounded-full bg-white/90" aria-hidden />
          </motion.div>

          <p className="absolute -bottom-2 left-0 right-0 text-center font-sans text-[10px] uppercase tracking-[0.22em] text-[#6d8578]">
            Press and hold
          </p>
        </motion.div>
      </div>
    </section>
  );
}
