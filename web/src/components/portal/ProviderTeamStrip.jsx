import { BRAND } from '../../brand/tokens';

export default function ProviderTeamStrip({ members, teamSize }) {
  if (!members?.length || teamSize <= 1) {
    return null;
  }

  return (
    <section className="mb-8 rounded-sm border border-white/[0.08] bg-white/[0.02] p-5 sm:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-sans text-[10px] font-semibold uppercase tracking-[0.32em]" style={{ color: BRAND.clay }}>
          Clinical team
        </h2>
        <span className="font-sans text-[9px] uppercase tracking-[0.16em]" style={{ color: BRAND.boneDim }}>
          {teamSize} clinicians
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {members.map((member) => (
          <li
            key={member.id}
            className="rounded-sm border px-3 py-1.5 font-sans text-xs"
            style={{
              borderColor: member.isSelf ? 'rgba(182,80,46,0.35)' : 'rgba(255,255,255,0.08)',
              background: member.isSelf ? 'rgba(182,80,46,0.08)' : 'rgba(255,255,255,0.02)',
              color: member.isSelf ? BRAND.bone : BRAND.boneMuted,
            }}
          >
            {member.name}
            {member.isSelf ? (
              <span className="ml-1.5 font-sans text-[9px] uppercase tracking-[0.12em]" style={{ color: BRAND.clay }}>
                You
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 font-sans text-[11px] leading-relaxed" style={{ color: BRAND.boneDim }}>
        Stats, tokens, and sessions aggregate across your organization. Each clinician signs in with their own account.
      </p>
    </section>
  );
}
