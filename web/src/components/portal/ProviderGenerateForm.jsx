import { useEffect, useState } from 'react';
import { BRAND } from '../../brand/tokens';
import { EXPIRY_PRESETS, USES_PRESETS } from '../../lib/portalClient';

export default function ProviderGenerateForm({
  generating,
  revealedToken,
  onGenerate,
  onCopy,
}) {
  const [expiresIn, setExpiresIn] = useState('30 days');
  const [uses, setUses] = useState('3');
  const [patientAlias, setPatientAlias] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!revealedToken) return undefined;
    setCopied(false);
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [revealedToken]);

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
  };

  return (
    <section className="rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
        Issue token
      </h2>

      {revealedToken ? (
        <div
          className="mt-5 flex flex-col items-start gap-3 border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: `${BRAND.clay}44`, background: `${BRAND.clay}08` }}
        >
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.2em]" style={{ color: BRAND.boneDim }}>
              Copy now — hides in 10s
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-[0.35em]">{revealedToken}</p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors hover:brightness-110"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      ) : null}

      <form
        className="mt-5 grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate({ expiresIn, uses, patientAlias: patientAlias.trim() || undefined });
        }}
      >
        <div>
          <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            Expires
          </label>
          <select
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
            className="w-full border border-white/[0.1] bg-black/40 px-3 py-2.5 font-sans text-sm text-white focus:border-[#B6502E]/50 focus:outline-none"
          >
            {EXPIRY_PRESETS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            Uses
          </label>
          <select
            value={uses}
            onChange={(e) => setUses(e.target.value)}
            className="w-full border border-white/[0.1] bg-black/40 px-3 py-2.5 font-sans text-sm text-white focus:border-[#B6502E]/50 focus:outline-none"
          >
            {USES_PRESETS.map((opt) => (
              <option key={opt} value={opt}>{opt === 'unlimited' ? 'Unlimited' : opt}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            Internal alias (optional)
          </label>
          <input
            type="text"
            value={patientAlias}
            onChange={(e) => setPatientAlias(e.target.value)}
            placeholder="e.g. intake batch A"
            maxLength={64}
            className="w-full border border-white/[0.1] bg-black/40 px-3 py-2.5 font-sans text-sm text-white placeholder:text-white/25 focus:border-[#B6502E]/50 focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={generating}
            className="border px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors disabled:opacity-40 hover:brightness-110"
            style={{ borderColor: `${BRAND.clay}55`, color: BRAND.bone, background: `${BRAND.clay}10` }}
          >
            {generating ? 'Generating…' : 'Generate token'}
          </button>
        </div>
      </form>
    </section>
  );
}
