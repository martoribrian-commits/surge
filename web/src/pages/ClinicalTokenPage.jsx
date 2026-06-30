import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DecayHero from '../components/brand/DecayHero';
import FilmGrainOverlay from '../components/FilmGrainOverlay';
import SurgeLockup from '../components/brand/SurgeLockup';
import { useTokenManager } from '../hooks/useTokenManager';

export default function ClinicalTokenPage() {
  const navigate = useNavigate();
  const { validateToken, isLoading, error, isCraneUnlocked } = useTokenManager();
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const result = await validateToken(input);
      if (result.valid) navigate('/start');
    },
    [input, validateToken, navigate],
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-5 text-[#F4F0EB]">
      <FilmGrainOverlay />

      <div className="relative z-10 w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <SurgeLockup size="sm" theme="dark" href="/" />
        </div>

        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B6502E]">
          Clinical access
        </p>
        <p className="mt-3 font-sans text-base text-white/55">Enter your six-character token.</p>

        <DecayHero compact className="my-8 py-2" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 6))}
            maxLength={6}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Clinical token"
            className="w-full border border-white/[0.12] bg-white/[0.03] px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] text-[#F4F0EB] outline-none transition-colors focus:border-[#B6502E]/50"
            placeholder="······"
          />
          {error ? (
            <p className="font-sans text-sm text-[#B6502E]" role="alert">
              {error}
            </p>
          ) : null}
          {isCraneUnlocked ? (
            <p className="font-sans text-sm text-white/45">Crane unlocked on this device.</p>
          ) : null}
          <button
            type="submit"
            disabled={isLoading || input.length !== 6}
            className="w-full border border-[#B6502E]/50 py-4 font-sans text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-[#B6502E]/10 disabled:opacity-40"
          >
            {isLoading ? 'Validating…' : 'Unlock Crane'}
          </button>
        </form>

        <p className="mt-6 font-sans text-[11px] text-white/30">
          Provided by your clinician. No account required.
        </p>
        <Link
          to="/start"
          className="mt-8 inline-block font-sans text-[11px] uppercase tracking-[0.16em] text-white/35 hover:text-[#B6502E]"
        >
          ← Back to sequences
        </Link>
      </div>
    </div>
  );
}
