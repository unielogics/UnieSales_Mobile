import { useState } from 'react';
import type { AppMode } from '../lib/mode';
import {
  useLead,
  usePlan,
  useApproveAction,
  useRejectAction,
  useUpdateLead,
  tierOfScore,
} from '../lib/hooks';
import { BottomSheet } from '../components/BottomSheet';
import { MIcon, MAvatar, MPill, MTier, Spinner, relativeTime } from '../components/primitives';
import { haptics } from '../lib/gestures';

export function LeadSheet({
  wid,
  mode,
  leadId,
  onClose,
}: {
  wid: string | null;
  mode: AppMode;
  leadId: string;
  onClose: () => void;
}) {
  const leadQ = useLead(wid, leadId);
  const plan = usePlan(wid, mode);
  const approve = useApproveAction(wid);
  const reject = useRejectAction(wid);
  const updateLead = useUpdateLead(wid);
  const [tab, setTab] = useState<'overview' | 'draft'>('overview');
  const [done, setDone] = useState<string | null>(null);

  const lead = leadQ.data;
  const action = (plan.data ?? []).find((p) => p.leadId === leadId) ?? null;

  if (!lead) {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spinner />
        </div>
      </BottomSheet>
    );
  }

  const tier = tierOfScore(lead.leadScore);
  const name = lead.contactName || lead.companyName || lead.email;

  const doApprove = () => {
    if (!action) return;
    approve.mutate(action.id, {
      onSuccess: () => {
        haptics.success();
        setDone('Approved & sent');
        setTimeout(onClose, 900);
      },
    });
  };
  const doHold = () => {
    if (!action) return;
    reject.mutate({ actionId: action.id, reason: 'Held from mobile' }, { onSuccess: () => setDone('Held') });
  };
  const close = (outcome: 'won' | 'lost') => {
    updateLead.mutate(
      { leadId, patch: { pipelineStage: outcome === 'won' ? 'closed_won' : 'closed_lost', lifecycleStatus: 'closed' } },
      {
        onSuccess: () => {
          haptics.medium();
          setDone(outcome === 'won' ? 'Marked Won' : 'Marked Lost');
          setTimeout(onClose, 900);
        },
      },
    );
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="m-sheet-header">
        <MAvatar name={name} color="#a78bfa" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--m-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {[lead.title, lead.companyName].filter(Boolean).join(' · ') || lead.email}
          </div>
        </div>
        <MTier tier={tier} />
        <button className="tap" onClick={onClose} style={{ color: 'var(--m-text-2)', padding: 4 }}>
          <MIcon name="x" size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', padding: '0 16px', borderBottom: '1px solid var(--m-border)', flexShrink: 0 }}>
        {(['overview', 'draft'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="tap"
            style={{
              padding: '12px 14px',
              borderBottom: '2px solid ' + (tab === t ? 'var(--m-accent)' : 'transparent'),
              marginBottom: -1,
              color: tab === t ? 'var(--m-text)' : 'var(--m-text-muted)',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {t === 'draft' ? 'Next msg' : 'Overview'}
          </button>
        ))}
      </div>

      <div className="m-sheet-body">
        {tab === 'overview' ? (
          <>
            {action && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(124,58,237,0.08) 100%)',
                  border: '1px solid rgba(167,139,250,0.3)',
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MIcon name="sparkles" size={12} stroke={2} />
                  <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--m-accent)', fontWeight: 600 }}>
                    AI next action
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--m-text-2)' }}>
                    {action.triggerAt ? relativeTime(action.triggerAt) : 'awaiting review'}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{action.actionLabel || action.summary}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="m-btn" data-variant="primary" data-size="sm" style={{ flex: 1 }} disabled={approve.isPending} onClick={doApprove}>
                    {approve.isPending ? <Spinner /> : <><MIcon name="check" size={13} /> Approve &amp; send</>}
                  </button>
                  <button className="m-btn" data-size="sm" disabled={reject.isPending} onClick={doHold}>
                    <MIcon name="pause" size={13} />
                  </button>
                </div>
              </div>
            )}

            <div className="m-stat-row" style={{ marginBottom: 14 }}>
              <div className="m-stat">
                <div className="label">Score</div>
                <div className="value">{lead.leadScore}</div>
                <div className="delta">Tier {tier}</div>
              </div>
              <div className="m-stat">
                <div className="label">Stage</div>
                <div className="value" style={{ fontSize: 15, marginTop: 5 }}>{lead.pipelineStage?.replace(/_/g, ' ') || 'new'}</div>
              </div>
              <div className="m-stat">
                <div className="label">Status</div>
                <div className="value" style={{ fontSize: 15, marginTop: 5 }}>{lead.lifecycleStatus}</div>
              </div>
            </div>

            <KV label="Email" value={lead.email} mono />
            {lead.phone && <KV label="Phone" value={lead.phone} />}
            {lead.title && <KV label="Title" value={lead.title} />}
            {lead.segment && <KV label="Segment" value={lead.segment} />}
            <KV label="Last contacted" value={relativeTime(lead.lastContactedAt)} />
            {lead.painAngle && <KV label="Pain angle" value={lead.painAngle} block />}
            {lead.personalization && <KV label="Personalization" value={lead.personalization} block />}
            {lead.leadScoreReason && <KV label="AI scoring" value={lead.leadScoreReason} block />}

            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              <button className="m-btn" data-variant="success" data-size="sm" style={{ flex: 1 }} disabled={updateLead.isPending} onClick={() => close('won')}>
                <MIcon name="check" size={13} /> Mark Won
              </button>
              <button className="m-btn" data-variant="danger" data-size="sm" style={{ flex: 1 }} disabled={updateLead.isPending} onClick={() => close('lost')}>
                <MIcon name="x" size={13} /> Mark Lost
              </button>
            </div>
          </>
        ) : (
          <DraftTab action={action} approving={approve.isPending} onApprove={doApprove} onHold={doHold} />
        )}
      </div>

      {done && (
        <div className="m-toast" style={{ background: 'var(--m-success)' }}>
          <MIcon name="check" size={16} stroke={2.5} /> {done}
        </div>
      )}
    </BottomSheet>
  );
}

function DraftTab({
  action,
  approving,
  onApprove,
  onHold,
}: {
  action: import('../types').PlannedAction | null;
  approving: boolean;
  onApprove: () => void;
  onHold: () => void;
}) {
  if (!action || (!action.body && !action.subject)) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--m-text-muted)' }}>No draft queued for this lead.</div>;
  }
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <MPill tone="accent" dot><MIcon name="sparkles" size={10} /> AI draft</MPill>
        {action.confidence != null && <MPill tone="info">{Math.round(action.confidence * 100)}% conf</MPill>}
      </div>
      {action.subject && (
        <div className="m-field">
          <div className="m-field-label">Subject</div>
          <div className="m-field-value" style={{ fontSize: 14 }}>{action.subject}</div>
        </div>
      )}
      {action.body && (
        <div className="m-field" style={{ padding: 14 }}>
          <div className="m-field-label" style={{ marginBottom: 8 }}>Body</div>
          <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', color: 'var(--m-text-2)' }}>{action.body}</div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="m-btn" data-variant="primary" style={{ flex: 1 }} disabled={approving} onClick={onApprove}>
          {approving ? <Spinner /> : <><MIcon name="check" size={14} /> Approve &amp; send</>}
        </button>
        <button className="m-btn" onClick={onHold}>
          <MIcon name="pause" size={14} />
        </button>
      </div>
    </>
  );
}

function KV({ label, value, mono, block }: { label: string; value: string; mono?: boolean; block?: boolean }) {
  return (
    <div className="m-field">
      <div className="m-field-label">{label}</div>
      <div
        className="m-field-value"
        style={{
          fontFamily: mono ? 'SF Mono, ui-monospace, monospace' : undefined,
          fontSize: mono ? 13 : 15,
          whiteSpace: block ? 'normal' : 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: block ? 1.5 : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
