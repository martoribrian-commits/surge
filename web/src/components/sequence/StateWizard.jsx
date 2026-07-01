import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import {
  WIZARD_ACTIVATION,
  WIZARD_DURATION,
  recommendVariant,
  variantMeta,
} from '../../data/stateWizard';

const EASE = [0.25, 0.1, 0.25, 1];

/**
 * Three-step wizard: body state → duration → recommendation.
 */
export default function StateWizard({ onSelectVariant, activeId }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [activation, setActivation] = useState(null);
  const [duration, setDuration] = useState(null);
  const [resultId, setResultId] = useState(null);

  const reset = () => {
    setStep(0);
    setActivation(null);
    setDuration(null);
    setResultId(null);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const handlePickActivation = (id) => {
    setActivation(id);
    setStep(1);
  };

  const handlePickDuration = (seconds) => {
    setDuration(seconds);
    const id = recommendVariant(activation, seconds);
    setResultId(id);
    setStep(2);
  };

  const result = resultId ? variantMeta(resultId) : null;

  return (
    <div className="mb-5">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-sm border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:border-[#B6502E]/40 hover:bg-[#B6502E]/08"
          style={{ color: BRAND.boneMuted }}
        >
          Not sure which sequence? Start here
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border border-white/[0.1] bg-white/[0.03] p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: BRAND.clay }}>
              Find your sequence
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="font-sans text-[9px] uppercase tracking-[0.16em]"
              style={{ color: BRAND.boneDim }}
            >
              Close
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="mb-3 font-sans text-sm" style={{ color: BRAND.boneMuted }}>
                  What does your body feel like right now?
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {WIZARD_ACTIVATION.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePickActivation(item.id)}
                      className="rounded-sm border border-white/[0.08] px-3 py-3 text-left transition-colors hover:border-[#B6502E]/35 hover:bg-white/[0.03]"
                    >
                      <span className="block font-sans text-xs font-medium" style={{ color: BRAND.bone }}>
                        {item.label}
                      </span>
                      <span className="mt-0.5 block font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
                        {item.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : null}

            {step === 1 ? (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="mb-3 font-sans text-sm" style={{ color: BRAND.boneMuted }}>
                  How much time do you have?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {WIZARD_DURATION.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handlePickDuration(item.id)}
                      className="rounded-sm border border-white/[0.08] px-3 py-3 text-left transition-colors hover:border-[#B6502E]/35"
                    >
                      <span className="block font-sans text-xs font-medium" style={{ color: BRAND.bone }}>
                        {item.label}
                      </span>
                      <span className="mt-0.5 block font-sans text-[10px]" style={{ color: BRAND.boneDim }}>
                        {item.hint}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="mt-3 font-sans text-[10px] uppercase tracking-[0.14em] underline"
                  style={{ color: BRAND.boneDim }}
                >
                  Back
                </button>
              </motion.div>
            ) : null}

            {step === 2 && result ? (
              <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="font-sans text-[10px] uppercase tracking-[0.18em]" style={{ color: BRAND.clay }}>
                  Recommended
                </p>
                <p className="mt-2 font-sans text-lg font-bold" style={{ color: BRAND.bone }}>
                  {result.name}
                </p>
                <p className="mt-2 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
                  {result.feelsLike}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectVariant(result.id);
                      handleClose();
                    }}
                    className="border px-4 py-2.5 font-sans text-[10px] font-semibold uppercase tracking-[0.2em]"
                    style={{
                      borderColor: `${BRAND.clay}55`,
                      background: `${BRAND.clay}14`,
                      color: BRAND.bone,
                    }}
                  >
                    Use {result.name}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-sans text-[10px] uppercase tracking-[0.14em] underline"
                    style={{ color: BRAND.boneDim }}
                  >
                    Start over
                  </button>
                </div>
                {activeId === result.id ? (
                  <p className="mt-2 font-sans text-[10px]" style={{ color: '#8FB596' }}>
                    Already selected
                  </p>
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
