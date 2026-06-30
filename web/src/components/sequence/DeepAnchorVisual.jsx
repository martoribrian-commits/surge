import { motion, AnimatePresence } from 'framer-motion';
import AnimatedGround from './shared/AnimatedGround';
import { orientingSkyGradient } from './shared/groundStyles';

/**
 * 120s Deep Anchor — extended bilateral integration with deepening center convergence.
 */
export default function DeepAnchorVisual({
  elapsedSeconds,
  progress,
  palette,
  activeSide,
  tapFlash,
  bpm = 48,
}) {
  const beatPeriod = 60 / bpm;
  const beatPhase = (elapsedSeconds % beatPeriod) / beatPeriod;
  const leftLit = activeSide === 'left' || (activeSide == null && beatPhase < 0.5);
  const rightLit = activeSide === 'right' || (activeSide == null && beatPhase >= 0.5);
  const integration = Math.min(1, progress * 1.15);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatedGround
        backgrounds={[
          orientingSkyGradient(palette, 0),
          orientingSkyGradient(palette, 1),
          orientingSkyGradient(palette, 0),
        ]}
        duration={32}
      />

      {/* Deepening horizon */}
      <motion.div
        className="absolute left-0 right-0 top-[50%] h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${palette.accentCalm}aa, transparent)`,
          boxShadow: `0 0 ${40 + integration * 60}px ${palette.accentCalm}55`,
        }}
        animate={{ opacity: [0.4, 0.85, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Left hemisphere field */}
      <motion.div
        className="absolute inset-y-0 left-0"
        style={{ width: `${52 - integration * 8}%` }}
        animate={{
          opacity: leftLit ? 0.35 + integration * 0.35 : 0.08,
          x: leftLit ? 0 : -20,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(105deg, ${palette.accent}88 0%, transparent 88%)`,
          }}
        />
        <motion.div
          className="absolute bottom-[16%] left-[10%] rounded-full blur-3xl"
          style={{
            background: palette.accent,
            width: `${12 + integration * 8}rem`,
            height: `${12 + integration * 8}rem`,
          }}
          animate={{ opacity: leftLit ? [0.15, 0.4, 0.15] : 0.06, scale: leftLit ? [1, 1.12, 1] : 0.88 }}
          transition={{ duration: beatPeriod, repeat: Infinity }}
        />
      </motion.div>

      {/* Right hemisphere field */}
      <motion.div
        className="absolute inset-y-0 right-0"
        style={{ width: `${52 - integration * 8}%` }}
        animate={{
          opacity: rightLit ? 0.35 + integration * 0.35 : 0.08,
          x: rightLit ? 0 : 20,
        }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(-105deg, ${palette.accentCalm}88 0%, transparent 88%)`,
          }}
        />
        <motion.div
          className="absolute bottom-[18%] right-[8%] rounded-full blur-3xl"
          style={{
            background: palette.accentCalm,
            width: `${13 + integration * 8}rem`,
            height: `${13 + integration * 8}rem`,
          }}
          animate={{ opacity: rightLit ? [0.15, 0.4, 0.15] : 0.06, scale: rightLit ? [1, 1.12, 1] : 0.88 }}
          transition={{ duration: beatPeriod, repeat: Infinity, delay: beatPeriod / 2 }}
        />
      </motion.div>

      {/* Integration core — strengthens over 120s */}
      <motion.div
        className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: `${8 + integration * 18}vmin`,
          height: `${8 + integration * 18}vmin`,
          background: `radial-gradient(circle, ${palette.copy}33 0%, transparent 70%)`,
          boxShadow: `0 0 ${30 + integration * 80}px ${palette.accentCalm}44`,
          border: `1px solid ${palette.accentCalm}${Math.round(30 + integration * 50).toString(16).padStart(2, '0')}`,
        }}
        animate={{ scale: [0.92, 1.04, 0.92], opacity: [0.25 + integration * 0.3, 0.55 + integration * 0.35, 0.25 + integration * 0.3] }}
        transition={{ duration: beatPeriod * 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Traveling pulse orb */}
      <motion.div
        className="absolute top-[44%] h-4 w-4 -translate-y-1/2 rounded-full"
        style={{
          background: palette.copy,
          boxShadow: `0 0 20px ${palette.accentCalm}`,
        }}
        animate={{
          left: leftLit ? ['14%', `${42 - integration * 8}%`] : [`${58 + integration * 8}%`, '86%'],
          scale: [1, 1.15, 1],
        }}
        transition={{ duration: beatPeriod, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Convergence rings on late progress */}
      {integration > 0.45 &&
        [0, 1, 2].map((ring) => (
          <motion.div
            key={ring}
            className="pointer-events-none absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              borderColor: `${palette.accentCalm}${Math.round(40 + ring * 20).toString(16).padStart(2, '0')}`,
              width: `${22 + ring * 14 + integration * 12}vmin`,
              height: `${22 + ring * 14 + integration * 12}vmin`,
            }}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.15, 0.35 - ring * 0.08, 0.15] }}
            transition={{ duration: 5 + ring, repeat: Infinity, delay: ring * 0.6 }}
          />
        ))}

      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/[0.05]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-[20%] flex justify-between px-8">
        <motion.span
          className="font-sans text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: leftLit ? palette.accent : 'rgba(244,240,235,0.22)' }}
          animate={{ opacity: leftLit ? 1 : 0.35 }}
        >
          Left
        </motion.span>
        <motion.span
          className="font-sans text-[9px] font-bold uppercase tracking-[0.24em]"
          style={{ color: `${palette.accentCalm}88` }}
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          Integrate
        </motion.span>
        <motion.span
          className="font-sans text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: rightLit ? palette.accentCalm : 'rgba(244,240,235,0.22)' }}
          animate={{ opacity: rightLit ? 1 : 0.35 }}
        >
          Right
        </motion.span>
      </div>

      <AnimatePresence>
        {tapFlash && (
          <motion.div
            key={tapFlash}
            className="pointer-events-none absolute inset-y-0 z-[3] w-1/2"
            style={{ [tapFlash === 'left' ? 'left' : 'right']: 0 }}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ borderColor: tapFlash === 'left' ? palette.accent : palette.accentCalm }}
              initial={{ scale: 0.25, opacity: 0.85 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.75 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
