import { motion } from 'framer-motion';
import CraneActions from '../crane/CraneActions';
import CraneBodyInsight from '../crane/CraneBodyInsight';
import CraneCarePlan from '../crane/CraneCarePlan';

/**
 * Crane conversation thread — renders rich inference payloads inline.
 */
export default function CraneThread({ messages, onToggleStep, carePlanProgress }) {
  if (!messages.length) {
    return (
      <p className="max-w-md text-center font-sans text-[11px] uppercase tracking-[0.22em] text-white/25">
        Nothing written yet
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      {messages.map((message, index) => {
        const isLatest = index === messages.length - 1;
        const isCrane = message.role === 'crane';
        const showInlineCarePlan =
          isCrane &&
          message.carePlan?.steps?.length &&
          (!carePlanProgress || message.id === messages[messages.length - 1]?.id);

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: isLatest ? 0.92 : 0.28,
              y: 0,
              filter: isLatest ? 'blur(0px)' : 'blur(0.5px)',
            }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className={`w-full ${message.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            {message.content ? (
              <p
                className={`font-sans text-[15px] leading-[1.85] tracking-[0.04em] ${
                  message.role === 'user' ? 'text-[#F4F0EB]/85' : 'text-[#F4F0EB]/70'
                }`}
              >
                {message.content}
              </p>
            ) : null}

            {isCrane && message.bodyInsight ? (
              <div className={`${message.content ? 'mt-3' : ''}`}>
                <CraneBodyInsight insight={message.bodyInsight} compact />
              </div>
            ) : null}

            {showInlineCarePlan ? (
              <div className="mt-3">
                <CraneCarePlan
                  carePlan={carePlanProgress ?? message.carePlan}
                  compact
                  onToggleStep={onToggleStep}
                />
              </div>
            ) : null}

            {isCrane && message.actions?.length ? (
              <CraneActions actions={message.actions} compact />
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
