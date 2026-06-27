import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.9,
      delay: i * 0.12,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

function ActionCard({ index, label, title, children, className = '' }) {
  return (
    <motion.article
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      className={
        'flex flex-col rounded-sm border border-white/[0.07] bg-white/[0.02] p-8 md:p-10 ' +
        className
      }
    >
      <p className="mb-3 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#7fa892]">
        {label}
      </p>
      <h3 className="font-sans text-xl font-semibold tracking-tight text-[#eef4f0] md:text-2xl">
        {title}
      </h3>
      <div className="mt-5 flex flex-1 flex-col font-sans text-sm leading-relaxed text-[#9eb5a8]">
        {children}
      </div>
    </motion.article>
  );
}

/**
 * Post-surge action modules — sparse, calm, sovereignty-first.
 */
export default function PostSurgeActions() {
  return (
    <section
      className="bg-[#070b09] px-6 py-28 md:px-12 md:py-36"
      aria-label="Post-surge actions"
    >
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-16 max-w-2xl md:mb-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className="mb-4 font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-[#7fa892]">
            The aftermath
          </p>
          <h2 className="font-sans text-3xl font-semibold tracking-tight text-[#eef4f0] md:text-4xl">
            What comes after the reset.
          </h2>
          <p className="mt-5 font-sans text-base leading-relaxed text-[#9eb5a8]">
            Surge does not trap you in the app. These are quiet next steps when you
            are ready to re-enter the world on your own terms.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <ActionCard index={0} label="01" title="Environmental re-engagement">
            <p>
              Return to the physical world with intention. Small analog actions
              signal safety to a body that has been on high alert.
            </p>
            <ul className="mt-5 space-y-2 text-[#b8cfc4]/90">
              <li>Splash cold water on your face and wrists</li>
              <li>Step outside, even for sixty seconds</li>
              <li>Name three objects you can see without moving</li>
            </ul>
          </ActionCard>

          <ActionCard index={1} label="02" title="Ephemeral brain dump">
            <p className="mb-4">
              Write what surfaced during the cycle. Nothing is saved to a profile.
              Nothing is mined for insights.
            </p>
            <div className="relative mt-auto">
              <span className="mb-2 block font-sans text-[10px] font-medium uppercase tracking-[0.18em] text-[#f5a623]">
                Auto-deletes in 24 hours for absolute privacy
              </span>
              <div
                className="min-h-[120px] rounded-sm border border-white/[0.08] bg-black/40 px-4 py-3 font-sans text-sm text-[#6d8578]"
                aria-hidden
              >
                <span className="text-[#4a5f54]">What is still here...</span>
              </div>
            </div>
          </ActionCard>

          <ActionCard index={2} label="03" title="Manual rituals">
            <p>
              Slow, tactile tasks give your hands something honest to do while your
              mind catches up.
            </p>
            <ul className="mt-5 space-y-2 text-[#b8cfc4]/90">
              <li>Brew tea and wait for it to cool before the first sip</li>
              <li>Straighten one surface in a single room</li>
              <li>Fold laundry with attention to texture and weight</li>
            </ul>
          </ActionCard>

          <ActionCard index={3} label="04" title="The clinical pivot">
            <p>
              If you need a professional guide after the cycle, Crane is available
              through your provider. No public feed. No social layer. Just a direct
              line when you opt in.
            </p>
            <Link
              to="/portal"
              className="group mt-8 inline-flex items-center self-start border border-white/10 px-6 py-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[#b8cfc4] transition-colors duration-500 hover:border-[#f5a623]/30 hover:text-[#eef4f0]"
            >
              <span>Connect through your provider</span>
              <span
                className="ml-3 inline-block transition-transform duration-500 group-hover:translate-x-0.5"
                aria-hidden
              >
                →
              </span>
            </Link>
          </ActionCard>
        </div>
      </div>
    </section>
  );
}
