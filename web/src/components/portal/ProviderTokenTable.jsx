import { BRAND } from '../../brand/tokens';
import { formatPortalDate, statusLabel } from '../../lib/portalClient';

const STATUS_COLOR = {
  active: BRAND.boneMuted,
  activated: '#8FB596',
  expired: BRAND.boneDim,
  revoked: '#B6502E',
};

export default function ProviderTokenTable({ tokens, revoking, onRevoke, showIssuer = false }) {
  if (!tokens.length) {
    return (
      <p className="py-8 text-center font-sans text-sm" style={{ color: BRAND.boneDim }}>
        No tokens issued yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] font-sans text-[9px] uppercase tracking-[0.18em]" style={{ color: BRAND.boneDim }}>
            <th className="px-3 py-3 font-normal">Token</th>
            <th className="px-3 py-3 font-normal">Alias</th>
            {showIssuer ? <th className="px-3 py-3 font-normal">Issued by</th> : null}
            <th className="px-3 py-3 font-normal">Issued</th>
            <th className="px-3 py-3 font-normal">Expires</th>
            <th className="px-3 py-3 font-normal">Uses</th>
            <th className="px-3 py-3 font-normal">Status</th>
            <th className="px-3 py-3 font-normal" />
          </tr>
        </thead>
        <tbody>
          {tokens.map((row) => (
            <tr key={row.token} className="border-b border-white/[0.05] last:border-0">
              <td className="px-3 py-3 font-mono text-[13px] tracking-[0.2em]">{row.token}</td>
              <td className="px-3 py-3 text-white/45">{row.patient_alias ?? '—'}</td>
              {showIssuer ? (
                <td className="px-3 py-3 text-white/45">
                  {row.issuerName ?? '—'}
                  {row.isOwn ? (
                    <span className="ml-1 text-[9px] uppercase tracking-[0.12em]" style={{ color: BRAND.clay }}>
                      you
                    </span>
                  ) : null}
                </td>
              ) : null}
              <td className="px-3 py-3 text-white/45">{formatPortalDate(row.issued_at)}</td>
              <td className="px-3 py-3 text-white/45">{formatPortalDate(row.expires_at)}</td>
              <td className="px-3 py-3 tabular-nums text-white/45">{row.uses_remaining}</td>
              <td className="px-3 py-3" style={{ color: STATUS_COLOR[row.status] ?? BRAND.boneMuted }}>
                {statusLabel(row.status)}
              </td>
              <td className="px-3 py-3 text-right">
                {row.status !== 'revoked' && row.uses_remaining > 0 ? (
                  <button
                    type="button"
                    disabled={revoking === row.token}
                    onClick={() => onRevoke(row.token)}
                    className="font-sans text-[9px] uppercase tracking-[0.16em] text-white/30 transition-colors hover:text-[#B6502E] disabled:opacity-40"
                  >
                    Revoke
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
