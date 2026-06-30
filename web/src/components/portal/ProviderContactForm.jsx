import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND } from '../../brand/tokens';

const VOLUMES = [
  { value: 'Under 25', label: 'Under 25 patients' },
  { value: '25 to 150', label: '25 – 150 patients' },
  { value: '150 plus', label: '150+ patients' },
];

const INPUT_CLASS =
  'w-full border border-white/[0.1] bg-black/30 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/25 focus:border-[#B6502E]/50 focus:outline-none';

/**
 * Provider access inquiry — Netlify Forms (provider-contact).
 */
export default function ProviderContactForm() {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [volume, setVolume] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !organization.trim() || !role.trim() || !volume) return;

    setStatus('sending');

    const payload = new URLSearchParams({
      'form-name': 'provider-contact',
      name: name.trim(),
      organization: organization.trim(),
      role: role.trim(),
      volume,
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
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence mode="wait">
      {status === 'sent' ? (
        <motion.div
          key="sent"
          className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Received
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed" style={{ color: BRAND.boneMuted }}>
            We will follow up with portal provisioning details. Typical turnaround is a few business days.
          </p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          name="provider-contact"
          method="POST"
          data-netlify="true"
          netlify-honeypot="bot-field"
          onSubmit={handleSubmit}
          className="space-y-4 rounded-sm border border-white/[0.08] bg-white/[0.02] p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <input type="hidden" name="form-name" value="provider-contact" />
          <p className="hidden">
            <label>
              Do not fill: <input name="bot-field" />
            </label>
          </p>

          <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: BRAND.clay }}>
            Request access
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input type="text" name="name" required value={name} onChange={(e) => setName(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Organization">
              <input type="text" name="organization" required value={organization} onChange={(e) => setOrganization(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Role">
              <input type="text" name="role" required value={role} onChange={(e) => setRole(e.target.value)} className={INPUT_CLASS} />
            </Field>
            <Field label="Patient volume">
              <select name="volume" required value={volume} onChange={(e) => setVolume(e.target.value)} className={INPUT_CLASS}>
                <option value="">Select</option>
                {VOLUMES.map((v) => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Message (optional)">
            <textarea name="message" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className={`${INPUT_CLASS} resize-none`} />
          </Field>

          {status === 'error' ? (
            <p className="font-sans text-sm" style={{ color: BRAND.clay }} role="alert">
              Could not submit. Check your connection and try again.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="border px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:opacity-40 hover:brightness-110"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}10` }}
          >
            {status === 'sending' ? 'Submitting…' : 'Submit inquiry'}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
        {label}
      </span>
      {children}
    </label>
  );
}
