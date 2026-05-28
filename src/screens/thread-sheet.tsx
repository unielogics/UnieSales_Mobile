import { useState } from 'react';
import {
  useThread,
  useDraftReply,
  useSendThreadReply,
  useStopSequence,
} from '../lib/hooks';
import { BottomSheet } from '../components/BottomSheet';
import { MIcon, MAvatar, MPill, Spinner, relativeTime } from '../components/primitives';
import { haptics } from '../lib/gestures';
import type { DraftReply, EmailMessage } from '../types';

export function ThreadSheet({
  wid,
  threadId,
  onClose,
  onOpenLead,
}: {
  wid: string | null;
  threadId: string;
  onClose: () => void;
  onOpenLead: (id: string) => void;
}) {
  const threadQ = useThread(wid, threadId);
  const draftReply = useDraftReply(wid);
  const sendReply = useSendThreadReply(wid);
  const stopSeq = useStopSequence(wid);

  const [draft, setDraft] = useState<DraftReply['ai'] | null>(null);
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState('');
  const [paused, setPaused] = useState(false);

  const thread = threadQ.data;
  if (!thread) {
    return (
      <BottomSheet onClose={onClose}>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spinner />
        </div>
      </BottomSheet>
    );
  }

  const lead = thread.lead;
  const name = lead?.contactName || lead?.companyName || thread.subject || 'Conversation';
  const aiOwner = thread.aiOwner && !paused;

  const generate = () => {
    draftReply.mutate(threadId, { onSuccess: (d) => setDraft(d.ai) });
  };
  const approveDraft = () => {
    if (!draft?.reply_body) return;
    sendReply.mutate(
      { threadId, body: { subject: draft.reply_subject ?? undefined, body: draft.reply_body } },
      {
        onSuccess: () => {
          haptics.success();
          setDraft(null);
        },
      },
    );
  };
  const sendManual = () => {
    if (!reply.trim()) return;
    sendReply.mutate(
      { threadId, body: { body: reply } },
      {
        onSuccess: () => {
          stopSeq.mutate({ threadId, reason: 'Operator took over from mobile' });
          setPaused(true);
          setReply('');
          setComposing(false);
          haptics.success();
        },
      },
    );
  };

  return (
    <BottomSheet onClose={onClose}>
      <div className="m-sheet-header">
        <MAvatar name={name} color="#a78bfa" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 500, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
          {lead?.companyName && <div style={{ fontSize: 12, color: 'var(--m-text-2)' }}>{lead.companyName}</div>}
        </div>
        {aiOwner ? <MPill tone="accent" dot>AI handling</MPill> : <MPill tone="warning" dot>AI paused</MPill>}
        <button className="tap" onClick={onClose} style={{ color: 'var(--m-text-2)', padding: 4 }}>
          <MIcon name="x" size={20} />
        </button>
      </div>

      <div className="m-sheet-body">
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>{thread.subject || '(no subject)'}</div>

        {/* Conversation */}
        {(thread.messages ?? [])
          .filter((m) => m.direction !== 'draft')
          .map((m) => <Bubble key={m.id} m={m} />)}

        {/* AI draft generation + approval */}
        {aiOwner && !composing && (
          <div style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 16, padding: 14, marginTop: 14 }}>
            {!draft ? (
              <button className="m-btn" data-variant="primary" data-size="sm" style={{ width: '100%' }} disabled={draftReply.isPending} onClick={generate}>
                {draftReply.isPending ? <Spinner /> : <><MIcon name="sparkles" size={13} /> Generate AI reply</>}
              </button>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MPill tone="accent" dot><MIcon name="sparkles" size={10} /> AI draft</MPill>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--m-text-muted)' }}>{Math.round((draft.confidence ?? 0) * 100)}% conf</span>
                </div>
                {draft.reply_subject && (
                  <div style={{ fontSize: 12, color: 'var(--m-text-muted)', marginBottom: 6 }}>Re: {draft.reply_subject}</div>
                )}
                <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--m-text)', marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                  {draft.reply_body}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="m-btn" data-variant="primary" data-size="sm" style={{ flex: 1 }} disabled={sendReply.isPending} onClick={approveDraft}>
                    {sendReply.isPending ? <Spinner /> : <><MIcon name="check" size={13} /> Approve &amp; send</>}
                  </button>
                  <button className="m-btn" data-size="sm" onClick={generate} disabled={draftReply.isPending}>
                    <MIcon name="refresh" size={13} />
                  </button>
                </div>
              </>
            )}
            <button className="m-btn" data-variant="ghost" data-size="sm" onClick={() => setComposing(true)} style={{ width: '100%', marginTop: 8 }}>
              Take over reply →
            </button>
          </div>
        )}

        {/* Manual compose */}
        {(composing || paused) && (
          <div style={{ background: 'var(--m-surface)', border: '1px solid var(--m-warning-soft)', borderRadius: 16, padding: 14, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MPill tone="warning" dot>You · pauses AI on send</MPill>
            </div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply in your own voice…"
              style={{ width: '100%', color: 'var(--m-text)', fontSize: 15, lineHeight: 1.45, minHeight: 100, resize: 'none' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="m-btn" data-variant="primary" data-size="sm" style={{ flex: 1 }} disabled={!reply.trim() || sendReply.isPending} onClick={sendManual}>
                {sendReply.isPending ? <Spinner /> : <><MIcon name="arrowR" size={13} /> Send reply</>}
              </button>
              {paused && (
                <button className="m-btn" data-size="sm" onClick={() => { setPaused(false); setComposing(false); }}>
                  <MIcon name="play" size={13} /> Hand to AI
                </button>
              )}
            </div>
          </div>
        )}

        {lead && (
          <button className="m-btn" data-variant="ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => { onClose(); onOpenLead(lead.id); }}>
            Open lead detail →
          </button>
        )}
      </div>
    </BottomSheet>
  );
}

function Bubble({ m }: { m: EmailMessage }) {
  const outbound = m.direction === 'outbound';
  return (
    <div
      style={{
        background: outbound ? 'rgba(167,139,250,0.10)' : 'var(--m-surface)',
        border: '1px solid ' + (outbound ? 'rgba(167,139,250,0.18)' : 'var(--m-border)'),
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--m-text-muted)', marginBottom: 5 }}>
        <span style={{ color: 'var(--m-text-2)', fontWeight: 500 }}>{outbound ? 'You / AI' : m.fromEmail || 'Lead'}</span>
        <span>{relativeTime(m.createdAt)}</span>
      </div>
      {m.subject && outbound && <div style={{ fontSize: 12, color: 'var(--m-text-muted)', marginBottom: 4 }}>{m.subject}</div>}
      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--m-text-2)', whiteSpace: 'pre-wrap' }}>{m.body || m.aiSummary || ''}</div>
    </div>
  );
}
