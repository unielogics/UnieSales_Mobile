import { MIcon, type IconName } from './primitives';

export interface TabDef {
  id: string;
  label: string;
  icon: IconName;
  badge?: number;
}

export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="m-tabbar">
      {tabs.map((t) => (
        <button key={t.id} className="m-tab" data-active={active === t.id} onClick={() => onChange(t.id)}>
          <MIcon name={t.icon} size={22} stroke={active === t.id ? 2.2 : 1.8} />
          <span className="m-tab-label">{t.label}</span>
          {t.badge != null && t.badge > 0 && <span className="badge">{t.badge > 99 ? '99' : t.badge}</span>}
        </button>
      ))}
    </div>
  );
}
