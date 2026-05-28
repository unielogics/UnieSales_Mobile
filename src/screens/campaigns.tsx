import { useMemo, useState } from 'react';
import { useCampaigns } from '../lib/hooks';
import { MIcon, MPill, type Tone } from '../components/primitives';
import { PullToRefresh } from '../components/PullToRefresh';
import type { Campaign, CampaignStatus } from '../types';

const STATUS: Record<CampaignStatus, { tone: Tone; label: string }> = {
  draft: { tone: 'muted', label: 'Draft' },
  needs_training: { tone: 'warning', label: 'Needs training' },
  training_in_progress: { tone: 'accent', label: 'Training' },
  needs_review: { tone: 'warning', label: 'Needs review' },
  ready_to_activate: { tone: 'info', label: 'Ready' },
  active: { tone: 'success', label: 'Active' },
  paused: { tone: 'muted', label: 'Paused' },
  archived: { tone: 'muted', label: 'Archived' },
};

type FilterId = 'all' | 'active' | 'needs' | 'paused';

export function Campaigns({ wid }: { wid: string | null }) {
  const campsQ = useCampaigns(wid);
  const [filter, setFilter] = useState<FilterId>('all');
  const all = campsQ.data ?? [];

  const matchers: Record<FilterId, (c: Campaign) => boolean> = {
    all: () => true,
    active: (c) => c.status === 'active',
    needs: (c) => c.status === 'needs_review' || c.status === 'training_in_progress' || c.status === 'needs_training',
    paused: (c) => c.status === 'paused' || c.status === 'draft' || c.status === 'archived',
  };
  const rows = useMemo(() => all.filter(matchers[filter]), [all, filter]);

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'needs', label: 'Needs review' },
    { id: 'paused', label: 'Paused' },
  ];

  return (
    <div className="m-screen">
      <PullToRefresh onRefresh={() => campsQ.refetch()}>
        <div className="m-header">
          <h1>Campaigns</h1>
          <div className="sub">
            {all.filter((c) => c.status === 'active').length} active · {all.length} total
          </div>
          <div
            className="phone-scroll"
            style={{ marginTop: 14, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20 }}
          >
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="tap"
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  background: filter === f.id ? 'var(--m-accent)' : 'rgba(255,255,255,0.06)',
                  color: filter === f.id ? 'white' : 'var(--m-text-2)',
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label} <span style={{ marginLeft: 4, opacity: 0.7 }}>{all.filter(matchers[f.id]).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="m-section">
          {campsQ.isLoading && <div style={{ color: 'var(--m-text-muted)', fontSize: 13 }}>Loading…</div>}
          {!campsQ.isLoading && rows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)', fontSize: 13 }}>
              <MIcon name="target" size={24} />
              <div style={{ marginTop: 8 }}>No campaigns in this view.</div>
            </div>
          )}
          {rows.map((c) => {
            const s = STATUS[c.status] ?? { tone: 'muted' as Tone, label: c.status };
            return (
              <div key={c.id} className="m-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ width: 6, height: 22, borderRadius: 3, background: `var(--m-${s.tone === 'muted' ? 'accent' : s.tone})` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    {c.goalSummary && (
                      <div style={{ fontSize: 12, color: 'var(--m-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.goalSummary}
                      </div>
                    )}
                  </div>
                  <MPill tone={s.tone} dot={s.tone !== 'muted'}>{s.label}</MPill>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--m-text-muted)' }}>
                  <span><b style={{ color: 'var(--m-text)' }}>{c.sentToday}</b> sent today</span>
                </div>
              </div>
            );
          })}
        </div>
      </PullToRefresh>
    </div>
  );
}
