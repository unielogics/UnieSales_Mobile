import { useMemo, useState } from 'react';
import type { AppMode } from '../lib/mode';
import { useThreads, useBulkDismissThreads } from '../lib/hooks';
import { MIcon, MPill, relativeTime, type Tone } from '../components/primitives';
import { SwipeRow } from '../components/SwipeRow';
import { ActionSheet } from '../components/ActionSheet';
import { BulkBar } from '../components/BulkBar';
import { PullToRefresh } from '../components/PullToRefresh';
import { useLongPress, useSelection } from '../lib/gestures';
import type { EmailThread } from '../types';

type FilterId = 'review' | 'auto' | 'all';

function statusPill(t: EmailThread): { tone: Tone; label: string } {
  if (t.status === 'handoff') return { tone: 'danger', label: 'Needs you' };
  if (t.status === 'paused') return { tone: 'warning', label: 'Paused' };
  if (t.status === 'closed') return { tone: 'muted', label: 'Closed' };
  return t.aiOwner ? { tone: 'success', label: 'AI handling' } : { tone: 'info', label: 'Active' };
}

export function Inbox({
  wid,
  mode,
  onOpenThread,
}: {
  wid: string | null;
  mode: AppMode;
  onOpenThread: (id: string) => void;
}) {
  const threadsQ = useThreads(wid, mode);
  const bulkDismiss = useBulkDismissThreads(wid);
  const sel = useSelection();
  const [filter, setFilter] = useState<FilterId>('review');
  const [menu, setMenu] = useState<EmailThread | null>(null);

  const all = threadsQ.data ?? [];
  const matchers: Record<FilterId, (t: EmailThread) => boolean> = {
    review: (t) => t.status === 'handoff' || t.status === 'paused',
    auto: (t) => t.aiOwner && t.status === 'active',
    all: () => true,
  };
  const threads = useMemo(() => all.filter(matchers[filter]), [all, filter]);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'review', label: 'Needs you' },
    { id: 'auto', label: 'AI handling' },
    { id: 'all', label: 'All' },
  ];

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={() => threadsQ.refetch()}>
        <div className="m-header">
          <h1>Inbox</h1>
          <div className="sub">{all.length} active threads</div>
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            {filters.map((f) => {
              const n = all.filter(matchers[f.id]).length;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="tap"
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: 10,
                    background: filter === f.id ? 'var(--m-accent)' : 'rgba(255,255,255,0.06)',
                    color: filter === f.id ? 'white' : 'var(--m-text-2)',
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {f.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="m-section">
          {threadsQ.isLoading && <div style={{ color: 'var(--m-text-muted)', fontSize: 13 }}>Loading…</div>}
          {!threadsQ.isLoading && threads.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13 }}>
              <MIcon name="inbox" size={24} />
              <div style={{ marginTop: 8 }}>Nothing here.</div>
            </div>
          )}
          {threads.map((t) => (
            <ThreadRow
              key={t.id}
              t={t}
              selecting={sel.isSelecting}
              selected={sel.has(t.id)}
              onTap={() => (sel.isSelecting ? sel.toggle(t.id) : onOpenThread(t.id))}
              onLongPress={() => (sel.isSelecting ? sel.toggle(t.id) : setMenu(t))}
              onDismiss={() => bulkDismiss.mutate([t.id])}
            />
          ))}
        </div>
      </PullToRefresh>

      {sel.count > 0 && (
        <BulkBar
          count={sel.count}
          noun="thread"
          actionVerb="Dismiss"
          pending={bulkDismiss.isPending}
          onAction={() => bulkDismiss.mutate(Array.from(sel.selected), { onSuccess: () => sel.clear() })}
          onClear={sel.clear}
        />
      )}

      {menu && (
        <ActionSheet
          title={menu.subject || 'Thread'}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Open thread', icon: 'mail', onSelect: () => onOpenThread(menu.id) },
            { label: 'Select multiple', icon: 'check', onSelect: () => sel.enter(menu.id) },
            { label: 'Dismiss thread', icon: 'archive', tone: 'danger', onSelect: () => bulkDismiss.mutate([menu.id]) },
          ]}
        />
      )}
    </div>
  );
}

function ThreadRow({
  t,
  selecting,
  selected,
  onTap,
  onLongPress,
  onDismiss,
}: {
  t: EmailThread;
  selecting: boolean;
  selected: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onDismiss: () => void;
}) {
  const lp = useLongPress(onLongPress);
  const pill = statusPill(t);
  const lastAt = t.lastInboundAt || t.lastOutboundAt || t.updatedAt;

  const inner = (
    <div
      style={{ padding: 14, background: selected ? 'var(--m-accent-soft)' : undefined }}
      {...(selecting ? {} : lp.handlers)}
      onClick={() => {
        if (!selecting && lp.didFire()) return;
        onTap();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {selecting && (
          <span className="m-check" data-on={selected}>
            <MIcon name="check" size={13} stroke={3} />
          </span>
        )}
        <span style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {t.subject || '(no subject)'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--m-text-muted)' }}>{relativeTime(lastAt)}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <MPill tone={pill.tone} dot={pill.tone !== 'muted'}>{pill.label}</MPill>
        <MPill tone="muted">{t.channel}</MPill>
      </div>
    </div>
  );

  if (selecting) return <div className="m-swipe-row">{inner}</div>;
  return (
    <SwipeRow right={{ label: 'Dismiss', icon: 'archive', tone: 'warning', onCommit: onDismiss }}>
      {inner}
    </SwipeRow>
  );
}
