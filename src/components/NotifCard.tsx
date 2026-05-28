import { MIcon, relativeTime, type IconName, type Tone } from './primitives';
import type { AppNotification, NotificationKind } from '../types';

const KIND_MAP: Record<NotificationKind, { icon: IconName; tone: Tone }> = {
  handoff: { icon: 'handoff', tone: 'danger' },
  booking: { icon: 'calendar', tone: 'accent' },
  draft: { icon: 'edit', tone: 'warning' },
  reply: { icon: 'inbox', tone: 'info' },
  objection: { icon: 'alert', tone: 'warning' },
  won: { icon: 'check', tone: 'success' },
  lost: { icon: 'x', tone: 'muted' },
  score: { icon: 'target', tone: 'accent' },
  risk: { icon: 'alert', tone: 'warning' },
  summary: { icon: 'sparkles', tone: 'info' },
};

export function NotifCard({
  n,
  onOpen,
}: {
  n: AppNotification;
  onOpen?: (n: AppNotification) => void;
}) {
  const k = KIND_MAP[n.kind] ?? { icon: 'bell' as IconName, tone: 'muted' as Tone };
  const unread = !n.readAt;
  return (
    <div className="m-notif tap" data-priority={n.priority} onClick={() => onOpen?.(n)}>
      <span
        className="icon"
        style={{ background: `var(--m-${k.tone}-soft)`, color: `var(--m-${k.tone})` }}
      >
        <MIcon name={k.icon} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="title">{n.title}</div>
        {n.body && <div className="body">{n.body}</div>}
        <div className="meta">
          {unread && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--m-accent)' }} />}
          <span>{n.meta || relativeTime(n.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
