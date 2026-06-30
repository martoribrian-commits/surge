import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

/**
 * Visual six-slot token input. One hidden field for form semantics.
 */
export default function TokenSlotInput({ value, onChange, disabled, id = 'clinical-token' }) {
  const chars = value.padEnd(6, ' ').slice(0, 6).split('');
  const focusIndex = Math.min(value.length, 5);

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Clinical token
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 6))}
        maxLength={6}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={disabled}
        className="absolute inset-0 z-10 cursor-text opacity-0"
        aria-describedby="token-slot-hint"
      />
      <div
        className="grid grid-cols-6 gap-2"
        aria-hidden
        id="token-slot-hint"
      >
        {chars.map((char, i) => {
          const filled = char.trim().length > 0;
          const active = i === focusIndex && value.length < 6;
          return (
            <motion.div
              key={i}
              animate={{
                scale: active ? 1.04 : 1,
                borderColor: active
                  ? `${BRAND.clay}88`
                  : filled
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(255,255,255,0.1)',
              }}
              transition={{ duration: 0.2 }}
              className="flex aspect-square items-center justify-center rounded-sm border bg-white/[0.03] font-mono text-xl tracking-widest"
              style={{
                color: filled ? BRAND.bone : BRAND.boneDim,
                boxShadow: active ? `0 0 20px ${BRAND.clay}22` : 'none',
              }}
            >
              {filled ? char : '·'}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
