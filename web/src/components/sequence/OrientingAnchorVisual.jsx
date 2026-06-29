import { motion, AnimatePresence } from 'framer-motion';
import AnimatedGround from './shared/AnimatedGround';
import { orientingSkyGradient } from './shared/groundStyles';

/**
 * 60s Orienting Anchor — landscape horizon, bilateral hemispheres, touch ripples.
 */
export default function OrientingAnchorVisual({
  elapsedSeconds,
  palette,
  activeSide,
  tapFlash,
  bpm = 60,
}) {
  const beatPeriod = 60 / bpm;
  const beatPhase = (elapsedSeconds % beatPeriod) / beatPeriod;
  const leftLit = activeSide === 'left' || (activeSide == null && beatPhase < 0.5);
  const rightLit = activeSide === 'right' || (activeSide == null && beatPhase >= 0.5);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatedGround
        backgrounds={[
          orientingSkyGradient(palette, 0),
          orientingSkyGradient(palette, 1),
          orientingSkyGradient(palette, 0),
        ]}
        duration={24}
      />

      {/* Horizon glow */}
      <div
        className="absolute left-0 right-0 top-[52%] h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${palette.accentCalm}88, transparent)`,
          boxShadow: `0 0 40px ${palette.accentCalm}44`,
        }}
      />

      {/* Left field */}
      <motion.div
        className="absolute inset-y-0 left-0 w-[52%]"
        animate={{
          opacity: leftLit ? 0.55 : 0.1,
          x: leftLit ? 0 : -16,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(105deg, ${palette.accent}77 0%, transparent 85%)`,
          }}
        />
        <motion.div
          className="absolute bottom-[18%] left-[12%] h-32 w-32 rounded-full blur-3xl"
          style={{ background: palette.accent }}
          animate={{ opacity: leftLit ? [0.2, 0.45, 0.2] : 0.08, scale: leftLit ? [1, 1.15, 1] : 0.9 }}
          transition={{ duration: beatPeriod, repeat: Infinity }}
        />
      </motion.div>

      {/* Right field */}
      <motion.div
        className="absolute inset-y-0 right-0 w-[52%]"
        animate={{
          opacity: rightLit ? 0.55 : 0.1,
          x: rightLit ? 0 : 16,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(-105deg, ${palette.accentCalm}77 0%, transparent 85%)`,
          }}
        />
        <motion.div
          className="absolute bottom-[22%] right-[10%] h-36 w-36 rounded-full blur-3xl"
          style={{ background: palette.accentCalm }}
          animate={{ opacity: rightLit ? [0.2, 0.45, 0.2] : 0.08, scale: rightLit ? [1, 1.15, 1] : 0.9 }}
          transition={{ duration: beatPeriod, repeat: Infinity, delay: beatPeriod / 2 }}
        />
      </motion.div>

      {/* Traveling pulse orb */}
      <motion.div
        className="absolute top-[48%] h-3 w-3 -translate-y-1/2 rounded-full"
        style={{
          background: palette.copy,
          boxShadow: `0 0 24px ${palette.accentCalm}`,
        }}
        animate={{ left: leftLit ? ['18%', '42%'] : ['58%', '82%'] }}
        transition={{ duration: beatPeriod, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center meridian */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/[0.06]" />

      {/* Touch zone labels (visible affordance) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[22%] flex justify-between px-8">
        <motion.span
          className="font-sans text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: leftLit ? palette.accent : 'rgba(244,240,235,0.25)' }}
          animate={{ opacity: leftLit ? 1 : 0.4 }}
        >
          Left
        </motion.span>
        <motion.span
          className="font-sans text-[10px] font-bold uppercase tracking-[0.28em]"
          style={{ color: rightLit ? palette.accentCalm : 'rgba(244,240,235,0.25)' }}
          animate={{ opacity: rightLit ? 1 : 0.4 }}
        >
          Right
        </motion.span>
      </div>

      {/* Tap ripple */}
      <AnimatePresence>
        {tapFlash && (
          <motion.div
            key={tapFlash}
            className="pointer-events-none absolute inset-y-0 z-[3] w-1/2"
            style={{ [tapFlash === 'left' ? 'left' : 'right']: 0 }}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{ borderColor: tapFlash === 'left' ? palette.accent : palette.accentCalm }}
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ duration: 0.65 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
