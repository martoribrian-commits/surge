import { motion, AnimatePresence } from 'framer-motion';
import { getVariant } from '../../sequences';
import { EASE_IN_OUT } from './shared/motionPresets';

/**
 * Live cinematic preview for the selected variant on the entry screen.
 */
export default function SequencePreview({ variantId }) {
  const variant = getVariant(variantId);

  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-sm border border-white/[0.08]">
      <motion.div
        key={variantId}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: EASE_IN_OUT }}
        style={{
          background: `linear-gradient(155deg, ${variant.palette.background} 0%, ${variant.palette.backgroundEnd ?? variant.palette.background} 100%)`,
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={variantId}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.55, ease: EASE_IN_OUT }}
        >
          {variantId === 'instant-reset' && (
            <InstantResetPreview palette={variant.palette} />
          )}
          {variantId === 'orienting-anchor' && (
            <OrientingPreview palette={variant.palette} />
          )}
          {variantId === 'coherence-ripple' && (
            <CoherencePreview palette={variant.palette} />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/80 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          Preview
        </p>
        <p className="mt-1 font-sans text-xl font-bold tracking-tight text-[#F4F0EB]">
          {variant.name}
        </p>
        <p className="mt-1 font-sans text-sm text-white/50">{variant.tagline}</p>
      </div>
    </div>
  );
}

function InstantResetPreview({ palette }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 50% 45%, ${palette.accent}66 0%, transparent 50%)`,
            `radial-gradient(circle at 50% 50%, ${palette.accentCalm}55 0%, transparent 55%)`,
            `radial-gradient(circle at 50% 45%, ${palette.accent}66 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            borderColor: i < 2 ? palette.accent : palette.accentCalm,
            width: `${22 + i * 16}%`,
            height: `${22 + i * 16}%`,
            marginLeft: `-${11 + i * 8}%`,
            marginTop: `-${11 + i * 8}%`,
          }}
          animate={{ scale: [0.9, 1.08, 0.9], opacity: [0.3, 0.75, 0.3] }}
          transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </>
  );
}

function OrientingPreview({ palette }) {
  return (
    <>
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ background: `linear-gradient(90deg, ${palette.accent}55, transparent)` }}
        animate={{ opacity: [0.25, 0.7, 0.25] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ background: `linear-gradient(-90deg, ${palette.accentCalm}55, transparent)` }}
        animate={{ opacity: [0.7, 0.25, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: palette.copy }}
        animate={{ x: [-24, 24, -24] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </>
  );
}

function CoherencePreview({ palette }) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 rounded-full border"
      style={{
        width: '38%',
        height: '38%',
        marginLeft: '-19%',
        marginTop: '-19%',
        borderColor: `${palette.accent}88`,
        boxShadow: `0 0 48px ${palette.accentCalm}44`,
      }}
      animate={{ scale: [0.82, 1.12, 0.82] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}
