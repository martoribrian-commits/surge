import { BRAND } from '../../brand/tokens';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'caseload', label: 'Caseload' },
  { id: 'settings', label: 'Settings' },
];

export default function ProviderPortalNav({ activeTab, onChange }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/[0.08] pb-4">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="rounded-sm border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors"
            style={{
              borderColor: active ? `${BRAND.clay}55` : 'rgba(255,255,255,0.08)',
              background: active ? `${BRAND.clay}14` : 'transparent',
              color: active ? BRAND.bone : BRAND.boneDim,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
