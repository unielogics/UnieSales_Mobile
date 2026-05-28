import { useMemo } from 'react';
import type { AppMode } from '../lib/mode';
import {
  useCalendar,
  useDashboard,
  useNotifications,
  usePlan,
  useCampaigns,
} from '../lib/hooks';
import { MIcon, clockTime, dayBucket, relativeTime } from '../components/primitives';
import { NotifCard } from '../components/NotifCard';
import { PullToRefresh } from '../components/PullToRefresh';
import type { AppNotification } from '../types';

export function Today({
  wid,
  mode,
  onOpenLead,
  onGo,
  onOpenNotif,
}: {
  wid: string | null;
  mode: AppMode;
  onOpenLead: (id: string) => void;
  onGo: (tab: string) => void;
  onOpenNotif: (n: AppNotification) => void;
}) {
  const isSales = mode === 'sales';
  const cal = useCalendar(wid);
  const dash = useDashboard(wid);
  const plan = usePlan(wid, mode);
  const notifs = useNotifications(wid);
  const camps = useCampaigns(wid);

  const events = cal.data ?? [];
  const todayEvents = useMemo(
    () => events.filter((e) => e.status !== 'cancelled' && dayBucket(e.startAt) === 'today'),
    [events],
  );
  const tomorrowCount = useMemo(
    () => events.filter((e) => e.status !== 'cancelled' && dayBucket(e.startAt) === 'tomorrow').length,
    [events],
  );
  const nextCall = todayEvents[0];

  const counts = dash.data?.counts;
  const handoffs = counts?.handoff_queue ?? 0;
  const queue = plan.data?.length ?? 0;
  const activeCamps = (camps.data ?? []).filter((c) => c.status === 'active').length;
  const sentToday = counts?.send_volume_today ?? 0;
  const replied7d = counts?.replied_7d ?? 0;

  const all = notifs.data ?? [];
  const urgentCount = all.filter((n) => !n.readAt && (n.priority === 'urgent' || n.priority === 'high')).length;
  const feed = isSales
    ? all.filter((n) => ['handoff', 'booking', 'reply', 'won', 'lost', 'draft'].includes(n.kind)).slice(0, 5)
    : all.filter((n) => ['draft', 'objection', 'score', 'risk', 'reply', 'booking'].includes(n.kind)).slice(0, 5);

  const refresh = async () => {
    await Promise.all([cal.refetch(), dash.refetch(), plan.refetch(), notifs.refetch(), camps.refetch()]);
  };

  const dayName = new Date().toLocaleDateString([], { weekday: 'long' });

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={refresh}>
        <div className="m-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="m-live-dot" />
            <span style={{ fontSize: 13, color: 'var(--m-text-2)' }}>
              {isSales ? 'AI working · inbound sales' : `AI working · ${activeCamps} active campaigns`}
            </span>
          </div>
          <h1>Today</h1>
          <div className="sub">
            {dayName} ·{' '}
            {isSales
              ? `${todayEvents.length} meeting${todayEvents.length !== 1 ? 's' : ''}`
              : `${queue} draft${queue !== 1 ? 's' : ''}`}{' '}
            · {urgentCount} need you
          </div>
        </div>

        {/* Hero — next meeting */}
        {nextCall && (
          <div className="m-section">
            <div className="m-section-title">
              <MIcon name="calendar" size={11} stroke={2} />
              <span>Next up</span>
              <span className="spacer" />
              <span className="link tap" onClick={() => onGo('calls')}>all meetings →</span>
            </div>
            <div
              onClick={() => nextCall.leadId && onOpenLead(nextCall.leadId)}
              className="tap"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(167,139,250,0.18) 100%)',
                border: '1px solid rgba(167,139,250,0.35)',
                borderRadius: 18,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--m-text-2)', marginBottom: 8 }}>
                <MIcon name="calendar" size={12} />
                <span>{clockTime(nextCall.startAt)}</span>
                <span style={{ flex: 1 }} />
                <span style={{ color: 'var(--m-text-muted)' }}>{relativeTime(nextCall.startAt)}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 2 }}>
                {nextCall.title}
              </div>
              <div style={{ fontSize: 13, color: 'var(--m-text-2)', marginBottom: 14 }}>
                {nextCall.attendees?.map((a) => a.name || a.email).join(', ') || 'No attendees listed'}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {nextCall.meetLink ? (
                  <a
                    className="m-btn"
                    data-variant="primary"
                    href={nextCall.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{ flex: 1, textDecoration: 'none' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MIcon name="play" size={14} /> Join meeting
                  </a>
                ) : (
                  <div className="m-btn" data-variant="primary" style={{ flex: 1, opacity: 0.6 }}>
                    No link yet
                  </div>
                )}
                <button
                  className="m-btn"
                  data-size="sm"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    nextCall.leadId && onOpenLead(nextCall.leadId);
                  }}
                >
                  <MIcon name="book" size={13} /> Brief
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="m-section">
          <div className="m-stat-row">
            {isSales ? (
              <>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('alerts')}>
                  <div className="label">Need you</div>
                  <div className="value" style={{ color: urgentCount > 0 ? 'var(--m-danger)' : 'inherit' }}>{urgentCount}</div>
                  <div className="delta" data-tone={handoffs > 0 ? 'danger' : ''}>{handoffs} handoffs</div>
                </button>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('alerts')}>
                  <div className="label">AI queue</div>
                  <div className="value">{queue}</div>
                  <div className="delta">drafts ready</div>
                </button>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('calls')}>
                  <div className="label">Today</div>
                  <div className="value">{todayEvents.length}</div>
                  <div className="delta">{tomorrowCount} tomorrow</div>
                </button>
              </>
            ) : (
              <>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('campaigns')}>
                  <div className="label">Active</div>
                  <div className="value">{activeCamps}</div>
                  <div className="delta">campaigns</div>
                </button>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('alerts')}>
                  <div className="label">Drafts</div>
                  <div className="value" style={{ color: queue > 0 ? 'var(--m-warning)' : 'inherit' }}>{queue}</div>
                  <div className="delta">need review</div>
                </button>
                <button className="m-stat tap" style={{ textAlign: 'left' }} onClick={() => onGo('campaigns')}>
                  <div className="label">Sent today</div>
                  <div className="value">{sentToday}</div>
                  <div className="delta">{replied7d} replies 7d</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications feed */}
        <div className="m-section">
          <div className="m-section-title">
            <MIcon name="bell" size={11} stroke={2} />
            <span>What's happening</span>
            <span className="spacer" />
            <span className="link tap" onClick={() => onGo('alerts')}>view all →</span>
          </div>
          {feed.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13, background: 'var(--m-surface)', borderRadius: 14 }}>
              Nothing new right now. The AI will surface handoffs, bookings, and drafts here.
            </div>
          ) : (
            feed.map((n) => <NotifCard key={n.id} n={n} onOpen={onOpenNotif} />)
          )}
        </div>

        {/* AI summary */}
        <div className="m-section">
          <div className="m-section-title">
            <MIcon name="sparkles" size={11} stroke={2} />
            <span>Your AI today</span>
          </div>
          <div className="m-card">
            <SummaryRow icon="mail" tone="info" count={sentToday} label="Emails sent" sub="across your workspace" />
            <SummaryRow icon="inbox" tone="accent" count={replied7d} label="Replies (7d)" sub="classified by AI" />
            <SummaryRow icon="calendar" tone="success" count={todayEvents.length} label="Meetings today" sub={`${tomorrowCount} tomorrow`} />
            <SummaryRow icon="handoff" tone="warning" count={handoffs} label="Escalated to you" sub="awaiting your call" />
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

function SummaryRow({
  icon,
  tone,
  count,
  label,
  sub,
}: {
  icon: 'mail' | 'inbox' | 'calendar' | 'handoff';
  tone: string;
  count: number;
  label: string;
  sub: string;
}) {
  return (
    <div className="m-card-row">
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `var(--m-${tone}-soft)`,
          color: `var(--m-${tone})`,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <MIcon name={icon} size={16} />
      </span>
      <div className="body">
        <div className="title">{label}</div>
        <div className="sub">{sub}</div>
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}>{count}</div>
    </div>
  );
}
