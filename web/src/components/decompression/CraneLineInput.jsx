import { motion } from 'framer-motion';

/**
 * Ultra-minimal single-line input with blinking caret over a horizontal rule.
 */
export default function CraneLineInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Offload a thought…',
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="relative w-full max-w-xl"
    >
      <div className="relative flex items-center justify-center pb-1">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(244,240,235,0.25) 20%, rgba(244,240,235,0.25) 80%, transparent)',
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="Message to Crane"
          className="w-full border-0 bg-transparent py-3 text-center font-sans text-sm font-normal tracking-[0.12em] text-[#F4F0EB] placeholder:text-white/20 focus:outline-none focus:ring-0 disabled:opacity-30"
        />

        {!value && !disabled && (
          <motion.span
            className="pointer-events-none absolute left-1/2 top-1/2 h-[1.1em] w-px -translate-y-1/2 bg-[#B6502E]"
            style={{ marginLeft: '0.15em' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.05, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
        )}
      </div>
    </form>
  );
}
