import { motion } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

const ACTIONS = [
  {
    id: 'environment',
    label: '01',
    title: 'Come back to the room',
    body: 'Your body just did real work. Give it something concrete to land on.',
    items: [
      'Splash cold water on your face and wrists',
      'Step outside, even for sixty seconds',
      'Name three objects you can see without moving',
    ],
  },
  {
    id: 'rituals',
    label: '03',
    title: 'Slow your hands down',
    body: 'Tactile tasks while your nervous system catches up.',
    items: [
      'Brew tea and wait for it to cool before the first sip',
      'Straighten one surface in a single room',
      'Fold laundry with attention to texture and weight',
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.85, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export default function RecoveryGrid({ brainDumpSlot }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-8">
      {ACTIONS.map((action, i) => (
        <motion.article
          key={action.id}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="flex flex-col rounded-sm border border-white/[0.07] bg-white/[0.02] p-8 md:p-10"
        >
          <p
            className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: BRAND.clay }}
          >
            {action.label}
          </p>
          <h3 className="font-sans text-xl font-semibold tracking-tight md:text-2xl">{action.title}</h3>
          <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            {action.body}
          </p>
          <ul className="mt-5 space-y-2 font-sans text-sm" style={{ color: BRAND.boneMuted }}>
            {action.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.article>
      ))}

      <motion.article
        custom={2}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="flex flex-col rounded-sm border border-white/[0.07] bg-white/[0.02] p-8 md:p-10 md:col-span-2 lg:col-span-1"
      >
        <p
          className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: BRAND.clay }}
        >
          02
        </p>
        <h3 className="font-sans text-xl font-semibold tracking-tight md:text-2xl">
          Write what surfaced
        </h3>
        <p className="mt-4 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
          Offload anything that came up during the cycle. Nothing is saved to a profile.
        </p>
        <div className="mt-6">{brainDumpSlot}</div>
      </motion.article>
    </div>
  );
}
