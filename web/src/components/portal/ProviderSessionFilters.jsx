import { BRAND } from '../../brand/tokens';
import { COMPLETION_FILTERS, VARIANT_FILTER_OPTIONS } from '../../lib/portalClient';

const EMPTY = {
  variant: '',
  completion: '',
  from: '',
  to: '',
  token: '',
};

export default function ProviderSessionFilters({ filters, onChange, onExport, exporting }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
          Filter sessions
        </p>
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="rounded-sm border border-white/[0.12] px-3 py-1.5 font-sans text-[9px] uppercase tracking-[0.16em] transition-colors hover:border-[#B6502E]/40 hover:text-[#B6502E] disabled:opacity-40"
          style={{ color: BRAND.boneMuted }}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="block">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
            Sequence
          </span>
          <select
            value={filters.variant ?? ''}
            onChange={(e) => set('variant', e.target.value)}
            className="w-full rounded-sm border border-white/[0.1] bg-white/[0.03] px-2 py-2 font-sans text-xs text-white/70"
          >
            {VARIANT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
            Outcome
          </span>
          <select
            value={filters.completion ?? ''}
            onChange={(e) => set('completion', e.target.value)}
            className="w-full rounded-sm border border-white/[0.1] bg-white/[0.03] px-2 py-2 font-sans text-xs text-white/70"
          >
            {COMPLETION_FILTERS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
            From
          </span>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => set('from', e.target.value)}
            className="w-full rounded-sm border border-white/[0.1] bg-white/[0.03] px-2 py-2 font-sans text-xs text-white/70"
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
            To
          </span>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => set('to', e.target.value)}
            className="w-full rounded-sm border border-white/[0.1] bg-white/[0.03] px-2 py-2 font-sans text-xs text-white/70"
          />
        </label>

        <label className="block">
          <span className="mb-1 block font-sans text-[9px] uppercase tracking-[0.14em]" style={{ color: BRAND.boneDim }}>
            Token
          </span>
          <input
            type="text"
            value={filters.token ?? ''}
            onChange={(e) => set('token', e.target.value.toUpperCase())}
            placeholder="6-char code"
            maxLength={6}
            className="w-full rounded-sm border border-white/[0.1] bg-white/[0.03] px-2 py-2 font-mono text-xs tracking-[0.2em] text-white/70 placeholder:text-white/20"
          />
        </label>
      </div>

      {(filters.variant || filters.completion || filters.from || filters.to || filters.token) ? (
        <button
          type="button"
          onClick={() => onChange({ ...EMPTY })}
          className="font-sans text-[9px] uppercase tracking-[0.14em] underline underline-offset-2 transition-colors hover:text-[#B6502E]"
          style={{ color: BRAND.boneDim }}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export { EMPTY as EMPTY_SESSION_FILTERS };
