import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'usage', label: 'Usage' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

/**
 * Borderless contact form — line input aesthetic, Netlify-ready when deployed.
 */
export default function SupportContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('technical');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus('sending');
    setError('');

    const payload = new URLSearchParams({
      'form-name': 'surge-support',
      name: name.trim(),
      email: email.trim(),
      category,
      message: message.trim(),
    });

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });
      if (!res.ok) throw new Error('Submit failed');
      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('idle');
      setError('Could not send. Check your connection and try again.');
    }
  };

  return (
    <div className="mt-16">
      <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.26em] text-[#B6502E]">
        Contact
      </p>
      <h2 className="mb-8 font-sans text-lg font-semibold tracking-[0.04em] text-[#F4F0EB]">
        Reach the team
      </h2>

      <AnimatePresence mode="wait">
        {status === 'sent' ? (
          <motion.p
            key="sent"
            className="font-sans text-sm leading-relaxed text-white/50"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Message received. We read every note. Response times vary.
          </motion.p>
        ) : (
          <motion.form
            key="form"
            name="surge-support"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
            className="space-y-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input type="hidden" name="form-name" value="surge-support" />
            <p className="hidden">
              <label>
                Do not fill: <input name="bot-field" />
              </label>
            </p>

            <div className="grid gap-8 md:grid-cols-2">
              <LineField label="Name" optional>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className={INPUT_CLASS}
                />
              </LineField>
              <LineField label="Email" optional>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className={INPUT_CLASS}
                />
              </LineField>
            </div>

            <LineField label="Topic">
              <select
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${INPUT_CLASS} cursor-pointer appearance-none`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-[#0A0A0A]">
                    {c.label}
                  </option>
                ))}
              </select>
            </LineField>

            <LineField label="Message" showCaret={!message}>
              <textarea
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={3}
                placeholder="What do you need?"
                className={`${INPUT_CLASS} resize-none text-left`}
              />
            </LineField>

            {error ? (
              <p className="font-sans text-[11px] text-[#B6502E]/80">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'sending' || !message.trim()}
              className="border px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-all hover:brightness-110 disabled:opacity-40"
              style={{
                borderColor: 'rgba(182,80,46,0.4)',
                background: 'rgba(182,80,46,0.12)',
                color: '#F4F0EB',
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

const INPUT_CLASS =
  'w-full border-0 border-b border-white/[0.12] bg-transparent py-2.5 font-sans text-sm text-[#F4F0EB] placeholder:text-white/20 focus:border-[#B6502E]/40 focus:outline-none';

function LineField({ label, optional, children, showCaret = false }) {
  return (
    <label className="relative block">
      <span className="mb-2 block font-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
        {label}
        {optional ? ' (optional)' : ''}
      </span>
      <div className="relative">
        {children}
        {showCaret && (
          <motion.span
            className="pointer-events-none absolute left-0 top-3 h-[1.1em] w-px bg-[#B6502E]"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.05, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
        )}
      </div>
    </label>
  );
}
