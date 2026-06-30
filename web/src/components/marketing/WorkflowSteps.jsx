import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';
import { stagger } from './marketingMotion';

/**
 * @param {{ steps: Array<{ title: string, body: string }> }} props
 */
export default function WorkflowSteps({ steps }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, i) => (
        <motion.article
          key={step.title}
          {...stagger(i, 0.08)}
          className="relative rounded-sm border border-white/[0.08] bg-white/[0.02] p-5"
        >
          <span
            className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full font-sans text-[11px] font-bold"
            style={{ background: `${BRAND.clay}22`, color: BRAND.clay }}
          >
            {i + 1}
          </span>
          <p className="font-sans text-sm font-bold">{step.title}</p>
          <p className="mt-2 font-sans text-xs leading-relaxed" style={{ color: BRAND.boneMuted }}>
            {step.body}
          </p>
        </motion.article>
      ))}
    </div>
  );
}
