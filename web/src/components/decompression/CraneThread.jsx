import { motion } from 'framer-motion';

export default function CraneThread({ messages }) {
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
            className={`font-sans text-[15px] leading-[1.85] tracking-[0.04em] ${
              message.role === 'user' ? 'text-right text-[#F4F0EB]/85' : 'text-left text-[#F4F0EB]/70'
            }`}
          >
            {message.content}
          </motion.div>
        );
      })}
    </div>
  );
}
