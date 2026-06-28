import { motion, AnimatePresence } from 'framer-motion';
import { getVariant } from '../../sequences';
import { previewGradient } from './shared/groundStyles';
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
          background: previewGradient(variant.palette),
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
          {variantId === 'vagal-downshift' && (
            <VagalDownshiftPreview palette={variant.palette} />
          )}
          {variantId === 'static-field' && (
            <StaticFieldPreview palette={variant.palette} />
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

function VagalDownshiftPreview({ palette }) {
  return (
    <>
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.35, 0.75, 0.4],
          background: [
            `radial-gradient(circle at 50% 45%, ${palette.accent}55 0%, transparent 55%)`,
            `radial-gradient(circle at 50% 50%, ${palette.accentCalm}44 0%, transparent 60%)`,
            `radial-gradient(circle at 50% 45%, ${palette.accent}55 0%, transparent 55%)`,
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border"
          style={{
            borderColor: palette.accent,
            width: `${28 + i * 14}%`,
            height: `${28 + i * 14}%`,
            marginLeft: `-${14 + i * 7}%`,
            marginTop: `-${14 + i * 7}%`,
          }}
          animate={{ scale: [0.85, 1.35 + i * 0.1, 0.9], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.8 + i * 0.3, repeat: Infinity, delay: i * 0.35 }}
        />
      ))}
    </>
  );
}

function StaticFieldPreview({ palette }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage:
            'repeating-radial-gradient(circle at 20% 30%, transparent 0, rgba(255,255,255,0.08) 1px, transparent 2px)',
          backgroundSize: '3px 3px',
        }}
        animate={{ opacity: [0.25, 0.55, 0.3] }}
        transition={{ duration: 0.25, repeat: Infinity }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            `radial-gradient(circle at 50% 50%, ${palette.accentCalm}66 0%, transparent 50%)`,
            `radial-gradient(circle at 50% 50%, rgba(244,240,235,0.2) 0%, transparent 55%)`,
            `radial-gradient(circle at 50% 50%, ${palette.accentCalm}66 0%, transparent 50%)`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30"
        animate={{ scale: [0.9, 1.15, 0.92], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
    </>
  );
}
