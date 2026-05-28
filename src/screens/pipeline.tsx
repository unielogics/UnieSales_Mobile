import { useMemo, useState } from 'react';
import {
  useInboundLeads,
  useUpdateLead,
  useBulkDeleteLeads,
  tierOfScore,
} from '../lib/hooks';
import { MIcon, MPill, MTier, type Tone } from '../components/primitives';
import { SwipeRow } from '../components/SwipeRow';
import { ActionSheet, type ActionItem } from '../components/ActionSheet';
import { BulkBar } from '../components/BulkBar';
import { PullToRefresh } from '../components/PullToRefresh';
import { useLongPress, useSelection } from '../lib/gestures';
import type { InboundLeadRow } from '../types';

// Stage metadata — slug → label/tone/order. Mirrors the seeded inbound stages.
const STAGE_META: Record<string, { label: string; tone: Tone; order: number }> = {
  new_inbound: { label: 'New Inbound', tone: 'info', order: 0 },
  ai_reviewed: { label: 'AI Reviewed', tone: 'accent', order: 1 },
  ai_contacting: { label: 'AI Contacting', tone: 'accent', order: 2 },
  interested: { label: 'Interested', tone: 'success', order: 3 },
  booking_link_sent: { label: 'Booking Sent', tone: 'warning', order: 4 },
  booked: { label: 'Booked', tone: 'success', order: 5 },
  handoff_required: { label: 'Handoff', tone: 'danger', order: 6 },
  opportunity: { label: 'Opportunity', tone: 'accent', order: 7 },
  nurture_later: { label: 'Nurture', tone: 'muted', order: 8 },
};
function metaFor(stage: string | null) {
  return (stage && STAGE_META[stage]) || STAGE_META.new_inbound;
}

export function Pipeline({ wid, onOpenLead }: { wid: string | null; onOpenLead: (id: string) => void }) {
  const leadsQ = useInboundLeads(wid, { filter: 'all', limit: 300 });
  const updateLead = useUpdateLead(wid);
  const bulkDelete = useBulkDeleteLeads(wid);
  const sel = useSelection();

  const [stageFilter, setStageFilter] = useState('all');
  const [menu, setMenu] = useState<InboundLeadRow | null>(null);
  const [toast, setToast] = useState<{ name: string; outcome: 'won' | 'lost' } | null>(null);

  const active = useMemo(
    () => (leadsQ.data ?? []).filter((l) => l.status !== 'closed' && l.pipelineStage !== 'closed_won' && l.pipelineStage !== 'closed_lost'),
    [leadsQ.data],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, InboundLeadRow[]>();
    for (const l of active) {
      const key = l.pipelineStage && STAGE_META[l.pipelineStage] ? l.pipelineStage : 'new_inbound';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(l);
    }
    for (const list of map.values()) list.sort((a, b) => b.leadScore - a.leadScore);
    return [...map.entries()].sort((a, b) => metaFor(a[0]).order - metaFor(b[0]).order);
  }, [active]);

  const stageChips = useMemo(
    () => [
      { id: 'all', label: 'All', n: active.length },
      ...grouped.map(([slug, list]) => ({ id: slug, label: metaFor(slug).label, n: list.length })),
    ],
    [grouped, active.length],
  );

  const markOutcome = (lead: InboundLeadRow, outcome: 'won' | 'lost') => {
    updateLead.mutate({
      leadId: lead.id,
      patch: { pipelineStage: outcome === 'won' ? 'closed_won' : 'closed_lost', lifecycleStatus: 'closed' },
    });
    setToast({ name: lead.companyName || lead.contactName || 'Lead', outcome });
    setTimeout(() => setToast(null), 2200);
  };

  const visibleStages = stageFilter === 'all' ? grouped : grouped.filter(([s]) => s === stageFilter);

  const doBulkDelete = () => {
    bulkDelete.mutate(Array.from(sel.selected), { onSuccess: () => sel.clear() });
  };

  const refresh = async () => {
    await leadsQ.refetch();
  };

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={refresh}>
        <div className="m-header">
          <h1>Pipeline</h1>
          <div className="sub">{active.length} active leads</div>
          <div
            className="phone-scroll"
            style={{ marginTop: 14, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}
          >
            {stageChips.map((t) => (
              <button
                key={t.id}
                onClick={() => setStageFilter(t.id)}
                className="tap"
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: stageFilter === t.id ? 'var(--m-accent)' : 'rgba(255,255,255,0.06)',
                  color: stageFilter === t.id ? 'white' : 'var(--m-text-2)',
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {t.label} <span style={{ marginLeft: 4, opacity: 0.7 }}>{t.n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="m-section">
          {leadsQ.isLoading && <div style={{ color: 'var(--m-text-muted)', fontSize: 13 }}>Loading…</div>}
          {!leadsQ.isLoading && active.length === 0 && (
            <Empty text="No active leads. New inbound submissions will appear here." />
          )}

          {visibleStages.map(([slug, list]) => (
            <div key={slug} style={{ marginBottom: 16 }}>
              <div className="m-section-title" style={{ paddingTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: `var(--m-${metaFor(slug).tone})` }} />
                <span>{metaFor(slug).label}</span>
                <span className="spacer" />
                <span style={{ fontSize: 11, color: 'var(--m-text-muted)' }}>{list.length}</span>
              </div>
              {list.map((l) => (
                <LeadRow
                  key={l.id}
                  lead={l}
                  selecting={sel.isSelecting}
                  selected={sel.has(l.id)}
                  onTap={() => (sel.isSelecting ? sel.toggle(l.id) : onOpenLead(l.id))}
                  onLongPress={() => (sel.isSelecting ? sel.toggle(l.id) : setMenu(l))}
                  onWon={() => markOutcome(l, 'won')}
                  onLost={() => markOutcome(l, 'lost')}
                />
              ))}
            </div>
          ))}

          {active.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, marginTop: 4, fontSize: 12.5, color: 'var(--m-text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
              <MIcon name="zap" size={13} stroke={2} /> Swipe right for{' '}
              <span style={{ color: 'var(--m-success)' }}>Won</span> · left for{' '}
              <span style={{ color: 'var(--m-danger)' }}>Lost</span> · long-press for more
            </div>
          )}
        </div>
      </PullToRefresh>

      {sel.count > 0 && (
        <BulkBar
          count={sel.count}
          noun="lead"
          actionVerb="Delete"
          pending={bulkDelete.isPending}
          onAction={doBulkDelete}
          onClear={sel.clear}
        />
      )}

      {menu && (
        <ActionSheet
          title={menu.companyName || menu.contactName || 'Lead'}
          onClose={() => setMenu(null)}
          items={leadMenuItems(menu, {
            open: () => onOpenLead(menu.id),
            won: () => markOutcome(menu, 'won'),
            lost: () => markOutcome(menu, 'lost'),
            select: () => sel.enter(menu.id),
            disableAi: () => updateLead.mutate({ leadId: menu.id, patch: { aiOwner: false } }),
            del: () => bulkDelete.mutate([menu.id]),
          })}
        />
      )}

      {toast && (
        <div className="m-toast" style={{ background: toast.outcome === 'won' ? 'var(--m-success)' : 'var(--m-danger)' }}>
          <MIcon name={toast.outcome === 'won' ? 'check' : 'x'} size={16} stroke={2.5} />
          <span>
            <b>{toast.name}</b> moved to {toast.outcome === 'won' ? 'Won' : 'Lost'}
          </span>
        </div>
      )}
    </div>
  );
}

function leadMenuItems(
  _lead: InboundLeadRow,
  h: { open: () => void; won: () => void; lost: () => void; select: () => void; disableAi: () => void; del: () => void },
): ActionItem[] {
  return [
    { label: 'Open lead', icon: 'book', onSelect: h.open },
    { label: 'Mark Won', icon: 'check', onSelect: h.won },
    { label: 'Mark Lost', icon: 'x', onSelect: h.lost },
    { label: 'Select multiple', icon: 'check', onSelect: h.select },
    { label: 'Disable AI on this lead', icon: 'pause', onSelect: h.disableAi },
    { label: 'Delete lead', icon: 'trash', tone: 'danger', onSelect: h.del },
  ];
}

function LeadRow({
  lead,
  selecting,
  selected,
  onTap,
  onLongPress,
  onWon,
  onLost,
}: {
  lead: InboundLeadRow;
  selecting: boolean;
  selected: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onWon: () => void;
  onLost: () => void;
}) {
  const lp = useLongPress(onLongPress);
  const tier = tierOfScore(lead.leadScore);
  const meta = metaFor(lead.pipelineStage);

  const inner = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        background: selected ? 'var(--m-accent-soft)' : undefined,
      }}
      {...(selecting ? {} : lp.handlers)}
      onClick={() => {
        if (!selecting && lp.didFire()) return; // long-press already handled it
        onTap();
      }}
    >
      {selecting && (
        <span className="m-check" data-on={selected}>
          <MIcon name="check" size={13} stroke={3} />
        </span>
      )}
      <MTier tier={tier} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.companyName || lead.contactName || lead.email}
        </div>
        <div style={{ fontSize: 12, color: 'var(--m-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {[lead.contactName, lead.title].filter(Boolean).join(' · ') || lead.email}
        </div>
      </div>
      {lead.hasOpenHandoff && <MPill tone="danger" dot>handoff</MPill>}
      <MPill tone={meta.tone}>{meta.label}</MPill>
    </div>
  );

  // In select mode, disable swipe so taps just toggle.
  if (selecting) {
    return <div className="m-swipe-row">{inner}</div>;
  }
  return (
    <SwipeRow
      left={{ label: 'Won', icon: 'check', tone: 'success', onCommit: onWon }}
      right={{ label: 'Lost', icon: 'x', tone: 'danger', onCommit: onLost }}
    >
      {inner}
    </SwipeRow>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13 }}>
      <MIcon name="branch" size={24} />
      <div style={{ marginTop: 8 }}>{text}</div>
    </div>
  );
}
