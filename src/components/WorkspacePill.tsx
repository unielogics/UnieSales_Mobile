import { useEffect, useRef, useState } from 'react';
import { MIcon } from './primitives';
import { useWorkspaces, campaignWorkspaces } from '../lib/hooks';
import { useWorkspaceStore } from '../lib/workspace';

// Campaign-mode workspace switcher (top-left), mirroring the desktop TopBar
// switcher. Lists every campaign workspace (Inbound excluded) and lets the
// operator switch; selecting one re-keys every screen's queries to that
// workspace, so all data is isolated per workspace.
export function WorkspacePill({ wid }: { wid: string | null }) {
  const { data: workspaces = [] } = useWorkspaces();
  const setCampaignWid = useWorkspaceStore((s) => s.setCampaignWid);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const campaigns = campaignWorkspaces(workspaces);
  const current = campaigns.find((w) => w.id === wid) ?? campaigns[0] ?? null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!current) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(12px + env(safe-area-inset-top))',
        left: 14,
        zIndex: 20,
      }}
    >
      <button
        className="tap"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          maxWidth: '52vw',
          background: 'rgba(28,28,30,0.78)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 999,
          padding: '6px 10px 6px 13px',
          border: '0.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {current.name}
        </span>
        <MIcon name="chev" size={14} />
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            minWidth: 210,
            maxWidth: '74vw',
            background: 'rgba(40,40,42,0.96)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '0.5px solid var(--m-border-strong)',
            borderRadius: 14,
            overflow: 'hidden',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--m-text-muted)',
              padding: '11px 14px 7px',
            }}
          >
            Workspaces
          </div>
          {campaigns.map((w) => (
            <button
              key={w.id}
              className="tap"
              onClick={() => {
                setCampaignWid(w.id);
                setOpen(false);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                borderTop: '0.5px solid var(--m-border)',
                color: 'var(--m-text)',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {w.name}
              </span>
              {w.id === current.id && (
                <span style={{ color: 'var(--m-accent)', display: 'flex' }}>
                  <MIcon name="check" size={16} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
