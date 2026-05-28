import { useEffect, useRef, useState } from 'react';
import { MIcon } from './primitives';
import type { AppMode } from '../lib/mode';

// Collapsible mode toggle pinned to the top-right. Collapsed = a single mark;
// tap to expand the Sales / Campaigns choice.
export function ModePill({ mode, setMode }: { mode: AppMode; setMode: (m: AppMode) => void }) {
  const [open, setOpen] = useState(false);
  const isSales = mode === 'sales';
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const Mark = ({ name, color }: { name: 'zap' | 'target'; color?: string }) => (
    <span
      style={{
        width: 20,
        height: 20,
        borderRadius: 6,
        background: color || 'var(--m-accent)',
        color: 'white',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      <MIcon name={name} size={11} stroke={2.2} />
    </span>
  );

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 'calc(12px + env(safe-area-inset-top))',
        right: 14,
        zIndex: 20,
        background: 'rgba(28,28,30,0.78)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 999,
        padding: 3,
        display: 'flex',
        border: '0.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      {open ? (
        <>
          <button
            onClick={() => {
              setMode('campaign');
              setOpen(false);
            }}
            className="tap"
            style={{
              padding: '4px 10px 4px 4px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: !isSales ? 'var(--m-accent-soft)' : 'transparent',
              color: !isSales ? 'var(--m-accent)' : 'var(--m-text-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Mark name="zap" color={!isSales ? 'var(--m-accent)' : 'rgba(255,255,255,0.12)'} />
            Campaigns
          </button>
          <button
            onClick={() => {
              setMode('sales');
              setOpen(false);
            }}
            className="tap"
            style={{
              padding: '4px 10px 4px 4px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: isSales ? 'var(--m-accent-soft)' : 'transparent',
              color: isSales ? 'var(--m-accent)' : 'var(--m-text-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Mark name="target" color={isSales ? 'var(--m-accent)' : 'rgba(255,255,255,0.12)'} />
            Sales
          </button>
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="tap"
          style={{ padding: 3, borderRadius: 999, display: 'flex', alignItems: 'center', gap: 6 }}
          title={isSales ? 'Sales mode' : 'Campaign mode'}
        >
          <Mark name={isSales ? 'target' : 'zap'} />
        </button>
      )}
    </div>
  );
}
