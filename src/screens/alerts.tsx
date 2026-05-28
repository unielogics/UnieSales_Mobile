import { useState } from 'react';
import {
  useNotifications,
  useNotificationSettings,
  useMarkNotifRead,
  useMarkAllNotifRead,
  useUpdateNotificationSettings,
} from '../lib/hooks';
import { MIcon } from '../components/primitives';
import { NotifCard } from '../components/NotifCard';
import { SwipeRow } from '../components/SwipeRow';
import { PullToRefresh } from '../components/PullToRefresh';
import type { AppNotification } from '../types';

type View = 'all' | 'unread' | 'settings';

// The canonical per-kind toggle set + copy (matches the design intent).
const KIND_DEFS: { id: string; label: string; desc: string; urgent?: boolean; digest?: boolean }[] = [
  { id: 'handoff', label: 'Handoffs', desc: 'AI needs your decision (pricing, contracts, escalations)', urgent: true },
  { id: 'booking', label: 'Meetings booked', desc: 'When a lead schedules a meeting via the AI' },
  { id: 'draft', label: 'Drafts ready', desc: 'AI-prepared messages awaiting your approval' },
  { id: 'reply', label: 'Positive replies', desc: 'Leads that just replied with interest' },
  { id: 'won', label: 'Won leads', desc: 'Closed-won deals' },
  { id: 'lost', label: 'Lost leads', desc: 'Closed-lost deals' },
  { id: 'objection', label: 'Objections', desc: 'Replies flagged as objections needing review' },
  { id: 'score', label: 'Tier changes', desc: 'When a lead moves up or down a tier' },
  { id: 'risk', label: 'Risk alerts', desc: 'Domain health, bounce rate, deliverability', urgent: true },
  { id: 'summary', label: 'Daily summary', desc: 'End-of-day digest of everything the AI did', digest: true },
];

export function Alerts({
  wid,
  onOpenNotif,
}: {
  wid: string | null;
  onOpenNotif: (n: AppNotification) => void;
}) {
  const [view, setView] = useState<View>('all');
  const notifsQ = useNotifications(wid, view === 'unread');
  const markRead = useMarkNotifRead(wid);
  const markAll = useMarkAllNotifRead(wid);
  const list = notifsQ.data ?? [];
  const unreadCount = (useNotifications(wid).data ?? []).filter((n) => !n.readAt).length;

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={() => notifsQ.refetch()}>
        <div className="m-header">
          <h1>Alerts</h1>
          <div className="sub">{unreadCount} unread</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            {(['all', 'unread', 'settings'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="tap"
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: 10,
                  background: view === v ? 'var(--m-accent)' : 'rgba(255,255,255,0.06)',
                  color: view === v ? 'white' : 'var(--m-text-2)',
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {view === 'settings' ? (
          <Settings />
        ) : (
          <div className="m-section">
            {list.length > 0 && (
              <button
                className="m-btn"
                data-variant="ghost"
                data-size="sm"
                style={{ marginBottom: 8 }}
                onClick={() => markAll.mutate()}
              >
                <MIcon name="check" size={13} /> Mark all read
              </button>
            )}
            {list.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13 }}>
                <MIcon name="check" size={24} />
                <div style={{ marginTop: 8 }}>You're all caught up.</div>
              </div>
            )}
            {list.map((n) =>
              n.readAt ? (
                <NotifCard key={n.id} n={n} onOpen={onOpenNotif} />
              ) : (
                <SwipeRow
                  key={n.id}
                  right={{ label: 'Read', icon: 'check', tone: 'info', onCommit: () => markRead.mutate(n.id) }}
                >
                  <NotifCard n={n} onOpen={onOpenNotif} />
                </SwipeRow>
              ),
            )}
          </div>
        )}
      </PullToRefresh>
    </div>
  );
}

function Settings() {
  const settingsQ = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const s = settingsQ.data;
  const perKind = s?.perKind ?? {};

  const isOn = (id: string) => perKind[id] !== false; // default on
  const toggle = (id: string) => {
    update.mutate({ perKind: { ...perKind, [id]: !isOn(id) } });
  };

  const groups = [
    { label: 'Urgent (interrupts)', items: KIND_DEFS.filter((k) => k.urgent) },
    { label: 'Normal', items: KIND_DEFS.filter((k) => !k.urgent && !k.digest) },
    { label: 'Digests', items: KIND_DEFS.filter((k) => k.digest) },
  ];

  return (
    <>
      <div className="m-section">
        <div
          style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 14,
            padding: 14,
            fontSize: 13,
            color: 'var(--m-text-2)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, color: 'var(--m-text)' }}>
            <MIcon name="bell" size={14} stroke={2} />
            <b style={{ fontSize: 14 }}>Quiet hours</b>
            <span style={{ flex: 1 }} />
            <span
              className="m-toggle"
              data-on={s?.quietHoursEnabled ?? true}
              onClick={() => update.mutate({ quietHoursEnabled: !(s?.quietHoursEnabled ?? true) })}
            />
          </div>
          Notifications muted between <b style={{ color: 'var(--m-text)' }}>{s?.quietHoursStart ?? '21:00'}</b> and{' '}
          <b style={{ color: 'var(--m-text)' }}>{s?.quietHoursEnd ?? '07:00'}</b>. Urgent alerts still come through.
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.label} className="m-section">
          <div className="m-section-title">{g.label}</div>
          <div className="m-card">
            {g.items.map((k) => (
              <div key={k.id} className="m-card-row" style={{ padding: '12px 14px' }}>
                <div className="body">
                  <div className="title" style={{ fontSize: 14.5 }}>{k.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--m-text-2)', lineHeight: 1.4, marginTop: 2, whiteSpace: 'normal' }}>
                    {k.desc}
                  </div>
                </div>
                <span className="m-toggle" data-on={isOn(k.id)} onClick={() => toggle(k.id)} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
