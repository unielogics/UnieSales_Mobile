import { useMemo, useState } from 'react';
import { useCalendar, useBulkCancelEvents } from '../lib/hooks';
import { MIcon, MPill, MAvatar, clockTime, dayBucket, type Tone } from '../components/primitives';
import { SwipeRow } from '../components/SwipeRow';
import { ActionSheet } from '../components/ActionSheet';
import { BottomSheet } from '../components/BottomSheet';
import { PullToRefresh } from '../components/PullToRefresh';
import { useLongPress } from '../lib/gestures';
import type { CalendarEvent } from '../types';

const STATUS: Record<string, { tone: Tone; label: string }> = {
  confirmed: { tone: 'success', label: 'Confirmed' },
  tentative: { tone: 'warning', label: 'Tentative' },
  cancelled: { tone: 'muted', label: 'Cancelled' },
};

// Only bookings that originate from this platform (booked in-app or by the AI)
// are work for the operator. Events synced from the user's own Google Calendar
// (source 'google' — e.g. "Break", personal blocks) are noise and excluded.
function isPlatformBooking(e: CalendarEvent) {
  return e.source === 'app' || e.source === 'ai_booked';
}

export function Meetings({ wid, onOpenLead }: { wid: string | null; onOpenLead: (id: string) => void }) {
  const calQ = useCalendar(wid);
  const cancel = useBulkCancelEvents(wid);
  const [menu, setMenu] = useState<CalendarEvent | null>(null);
  const [detail, setDetail] = useState<CalendarEvent | null>(null);

  const events = (calQ.data ?? []).filter((e) => e.status !== 'cancelled' && isPlatformBooking(e));
  const groups = useMemo(() => {
    const today: CalendarEvent[] = [];
    const tomorrow: CalendarEvent[] = [];
    const upcoming: CalendarEvent[] = [];
    for (const e of events) {
      const b = dayBucket(e.startAt);
      if (b === 'today') today.push(e);
      else if (b === 'tomorrow') tomorrow.push(e);
      else if (b === 'upcoming') upcoming.push(e);
    }
    const sort = (a: CalendarEvent, b: CalendarEvent) => +new Date(a.startAt) - +new Date(b.startAt);
    today.sort(sort); tomorrow.sort(sort); upcoming.sort(sort);
    return [
      { label: 'Today', list: today, accent: true },
      { label: 'Tomorrow', list: tomorrow, accent: false },
      { label: 'Upcoming', list: upcoming, accent: false },
    ];
  }, [events]);

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={() => calQ.refetch()}>
        <div className="m-header">
          <h1>Meetings</h1>
          <div className="sub">{events.length} booking{events.length !== 1 ? 's' : ''} · {groups[0].list.length} today</div>
        </div>

        {!calQ.isLoading && events.length === 0 && (
          <div className="m-section">
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13 }}>
              <MIcon name="calendar" size={24} />
              <div style={{ marginTop: 8 }}>No bookings yet.</div>
            </div>
          </div>
        )}

        {groups.map(
          (g) =>
            g.list.length > 0 && (
              <div key={g.label} className="m-section">
                <div className="m-section-title">
                  {g.accent && <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--m-accent)' }} />}
                  <span style={{ color: g.accent ? 'var(--m-accent)' : 'var(--m-text-muted)' }}>{g.label}</span>
                  <span className="spacer" />
                  <span style={{ color: 'var(--m-text-muted)', fontSize: 11 }}>{g.list.length}</span>
                </div>
                {g.list.map((e) => (
                  <EventRow
                    key={e.id}
                    e={e}
                    hero={g.accent}
                    onOpen={() => setDetail(e)}
                    onOpenLead={onOpenLead}
                    onLongPress={() => setMenu(e)}
                    onCancel={() => cancel.mutate([e.id])}
                  />
                ))}
              </div>
            ),
        )}
      </PullToRefresh>

      {menu && (
        <ActionSheet
          title={menu.title}
          onClose={() => setMenu(null)}
          items={[
            ...(menu.meetLink
              ? [{ label: 'Join meeting', icon: 'play' as const, onSelect: () => window.open(menu.meetLink!, '_blank') }]
              : []),
            ...(menu.leadId ? [{ label: 'Open lead', icon: 'book' as const, onSelect: () => onOpenLead(menu.leadId!) }] : []),
            { label: 'Cancel meeting', icon: 'x', tone: 'danger', onSelect: () => cancel.mutate([menu.id]) },
          ]}
        />
      )}

      {detail && (
        <MeetingSheet
          e={detail}
          onClose={() => setDetail(null)}
          onOpenLead={(id) => {
            setDetail(null);
            onOpenLead(id);
          }}
          onCancel={() => {
            cancel.mutate([detail.id]);
            setDetail(null);
          }}
        />
      )}
    </div>
  );
}

function EventRow({
  e,
  hero,
  onOpen,
  onOpenLead,
  onLongPress,
  onCancel,
}: {
  e: CalendarEvent;
  hero: boolean;
  onOpen: () => void;
  onOpenLead: (id: string) => void;
  onLongPress: () => void;
  onCancel: () => void;
}) {
  const lp = useLongPress(onLongPress);
  const status = STATUS[e.status] ?? { tone: 'muted' as Tone, label: e.status };
  const attendee = e.attendees?.[0];

  return (
    <SwipeRow right={{ label: 'Cancel', icon: 'x', tone: 'danger', onCommit: onCancel }}>
      <div
        {...lp.handlers}
        onClick={() => {
          if (lp.didFire()) return;
          onOpen();
        }}
        style={{
          padding: 14,
          background: hero
            ? 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, var(--m-surface) 60%)'
            : 'var(--m-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flexShrink: 0, textAlign: 'center', paddingRight: 12, borderRight: '1px solid var(--m-border)', minWidth: 62 }}>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>{clockTime(e.startAt)}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 14.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {e.title}
              </div>
              <MPill tone={status.tone} dot={status.tone !== 'muted'}>{status.label}</MPill>
            </div>
            {attendee && (
              <div style={{ fontSize: 12.5, color: 'var(--m-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                {attendee.name || attendee.email}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {e.meetLink ? (
                <a
                  className="m-btn"
                  data-variant="primary"
                  data-size="sm"
                  href={e.meetLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ flex: 1, textDecoration: 'none' }}
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <MIcon name="play" size={12} /> Join
                </a>
              ) : (
                <div className="m-btn" data-size="sm" style={{ flex: 1, opacity: 0.6 }}>No link</div>
              )}
              {e.leadId && (
                <button
                  className="m-btn"
                  data-size="sm"
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onOpenLead(e.leadId!);
                  }}
                >
                  <MIcon name="book" size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SwipeRow>
  );
}

function MeetingSheet({
  e,
  onClose,
  onOpenLead,
  onCancel,
}: {
  e: CalendarEvent;
  onClose: () => void;
  onOpenLead: (id: string) => void;
  onCancel: () => void;
}) {
  const status = STATUS[e.status] ?? { tone: 'muted' as Tone, label: e.status };
  const attendees = e.attendees ?? [];
  const dateLabel = new Date(e.startAt).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  const timeLabel = `${clockTime(e.startAt)} – ${clockTime(e.endAt)}`;
  const respTone = (s?: string): Tone =>
    s === 'accepted' ? 'success' : s === 'declined' ? 'danger' : s === 'tentative' ? 'warning' : 'muted';

  return (
    <BottomSheet onClose={onClose} height="auto">
      <div className="m-sheet-header">
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--m-accent-soft)',
            color: 'var(--m-accent)',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <MIcon name="calendar" size={18} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {e.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--m-text-2)' }}>{dateLabel} · {timeLabel}</div>
        </div>
        <MPill tone={status.tone} dot={status.tone !== 'muted'}>{status.label}</MPill>
        <button className="tap" onClick={onClose} style={{ color: 'var(--m-text-2)', padding: 4 }}>
          <MIcon name="x" size={20} />
        </button>
      </div>

      <div className="m-sheet-body">
        {e.meetLink && (
          <a
            className="m-btn"
            data-variant="primary"
            href={e.meetLink}
            target="_blank"
            rel="noreferrer"
            style={{ width: '100%', textDecoration: 'none', marginBottom: 14, height: 46 }}
          >
            <MIcon name="play" size={14} /> Join meeting
          </a>
        )}

        {e.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--m-text-2)', marginBottom: 14 }}>
            <MIcon name="link" size={14} />
            <span>{e.location}</span>
          </div>
        )}

        <div className="m-section-title" style={{ padding: 0, marginTop: 2 }}>
          <MIcon name="user" size={11} stroke={2} />
          <span>Who&apos;s in ({attendees.length})</span>
        </div>
        <div className="m-card">
          {attendees.length === 0 ? (
            <div className="m-card-row" style={{ color: 'var(--m-text-muted)', fontSize: 13 }}>
              No attendees listed
            </div>
          ) : (
            attendees.map((a, i) => (
              <div key={a.email || i} className="m-card-row">
                <MAvatar name={a.name || a.email} size={32} />
                <div className="body">
                  <div className="title">{a.name || a.email}</div>
                  {a.name && <div className="sub">{a.email}</div>}
                </div>
                {a.responseStatus && <MPill tone={respTone(a.responseStatus)}>{a.responseStatus}</MPill>}
              </div>
            ))
          )}
        </div>

        <div className="m-section-title" style={{ padding: 0, marginTop: 18 }}>
          <MIcon name="edit" size={11} stroke={2} />
          <span>Notes</span>
        </div>
        <div
          className="m-card"
          style={{
            padding: 14,
            fontSize: 13.5,
            color: e.description?.trim() ? 'var(--m-text)' : 'var(--m-text-muted)',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {e.description?.trim() || 'No notes for this booking.'}
        </div>

        {e.leadId && (
          <button
            className="m-btn"
            onClick={() => onOpenLead(e.leadId!)}
            style={{ width: '100%', marginTop: 16, justifyContent: 'space-between', height: 46 }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MIcon name="book" size={15} /> Open lead — activity &amp; notes
            </span>
            <MIcon name="chevR" size={16} />
          </button>
        )}

        <button
          className="m-btn"
          data-variant="danger"
          onClick={onCancel}
          style={{ width: '100%', marginTop: 10, height: 46 }}
        >
          <MIcon name="x" size={15} /> Cancel booking
        </button>
      </div>
    </BottomSheet>
  );
}
