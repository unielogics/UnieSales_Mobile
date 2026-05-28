import { MIcon } from './primitives';

// Floating multi-select action bar — mirrors the desktop BulkActionBar that
// appears after Ctrl-click selection. Slides up above the tab bar.
export function BulkBar({
  count,
  noun,
  actionVerb,
  actionTone = 'danger',
  pending,
  onAction,
  onClear,
}: {
  count: number;
  noun: string;
  actionVerb: string;
  actionTone?: 'danger' | 'primary' | 'success';
  pending?: boolean;
  onAction: () => void;
  onClear: () => void;
}) {
  return (
    <div className="m-bulk-bar">
      <button className="m-btn" data-size="sm" onClick={onClear} style={{ background: 'transparent', color: 'var(--m-text-2)' }}>
        <MIcon name="x" size={15} />
      </button>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
        {count} {count === 1 ? noun : `${noun}s`} selected
      </div>
      <button
        className="m-btn"
        data-size="sm"
        data-variant={actionTone === 'danger' ? 'danger' : actionTone === 'success' ? 'success' : 'primary'}
        disabled={pending}
        onClick={onAction}
      >
        {pending ? <span className="m-spin" /> : actionVerb}
      </button>
    </div>
  );
}
