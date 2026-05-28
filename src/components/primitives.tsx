import type { ReactNode } from 'react';

export type IconName =
  | 'home' | 'branch' | 'inbox' | 'calendar' | 'bell' | 'sparkles' | 'user'
  | 'check' | 'x' | 'chev' | 'chevR' | 'chevL' | 'arrowR' | 'mail' | 'play'
  | 'pause' | 'edit' | 'refresh' | 'target' | 'handoff' | 'alert' | 'archive'
  | 'settings' | 'more' | 'search' | 'flame' | 'table' | 'book' | 'moon'
  | 'zap' | 'link' | 'trash' | 'logout';

const PATHS: Record<IconName, ReactNode> = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></>,
  branch: <><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M6 8v8M6 18c0-4 12-4 12-10" /></>,
  inbox: <><path d="M3 13h4l1 2h8l1-2h4" /><path d="M5 13V5h14v8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="1.5" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  bell: <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21a2 2 0 0 0 4 0" /></>,
  sparkles: <><path d="M12 3v6M12 15v6M3 12h6M15 12h6" /><path d="m6.5 6.5 2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></>,
  check: <><path d="m5 12 5 5 9-12" /></>,
  x: <><path d="m6 6 12 12M18 6 6 18" /></>,
  chev: <><path d="m6 9 6 6 6-6" /></>,
  chevR: <><path d="m9 6 6 6-6 6" /></>,
  chevL: <><path d="m15 6-6 6 6 6" /></>,
  arrowR: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  play: <><path d="m6 4 14 8-14 8z" /></>,
  pause: <><path d="M7 5v14M17 5v14" /></>,
  edit: <><path d="M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6" /><path d="m18 2 4 4-11 11H7v-4z" /></>,
  refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 4v4h-4M21 12a9 9 0 0 1-15 6.7L3 16M3 20v-4h4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
  handoff: <><path d="M7 11V7a3 3 0 0 1 6 0v4" /><path d="M5 11h14v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" /></>,
  alert: <><path d="m12 3 10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 1v6M12 17v6M4.2 4.2l4.3 4.3M15.5 15.5l4.3 4.3M1 12h6M17 12h6M4.2 19.8l4.3-4.3M15.5 8.5l4.3-4.3" /></>,
  more: <><circle cx="6" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="18" cy="12" r="1.5" fill="currentColor" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  flame: <><path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 0 2-2 3-3 2 0 0-1-2 1-5-4 0-8 4-8 10 0 4 3 7 7 7z" /></>,
  table: <><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M9 5v14" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" /></>,
  moon: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></>,
  zap: <><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>,
  link: <><path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 1 1 6 6l-1.5 1.5" /><path d="M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 1 1-6-6l1.5-1.5" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
};

export function MIcon({ name, size = 17, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] ?? PATHS.bell}
    </svg>
  );
}

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export function MPill({ tone, children, dot }: { tone: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className="m-pill" data-tone={tone}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export type Tier = 'S' | 'A' | 'B' | 'C' | 'D';
export function MTier({ tier }: { tier: Tier }) {
  return <span className="m-tier" data-tier={tier}>{tier}</span>;
}

export function MAvatar({ name, color }: { name: string | null; color?: string }) {
  const initials = (name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="m-avatar" style={color ? { background: color } : undefined}>
      {initials}
    </span>
  );
}

export function Spinner() {
  return <span className="m-spin" />;
}

// ─── Time helpers ────────────────────────────────────────────────────────────
export function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const hrs = Math.round(abs / 3600000);
  const days = Math.round(abs / 86400000);
  const suffix = diff < 0 ? ' ago' : '';
  const prefix = diff >= 0 ? 'in ' : '';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${prefix}${mins}m${suffix}`;
  if (hrs < 24) return `${prefix}${hrs}h${suffix}`;
  return `${prefix}${days}d${suffix}`;
}

export function clockTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function dayBucket(iso: string): 'today' | 'tomorrow' | 'upcoming' | 'past' {
  const d = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startTomorrow = new Date(startToday.getTime() + 86400000);
  const startDayAfter = new Date(startToday.getTime() + 2 * 86400000);
  if (d < startToday) return 'past';
  if (d < startTomorrow) return 'today';
  if (d < startDayAfter) return 'tomorrow';
  return 'upcoming';
}
