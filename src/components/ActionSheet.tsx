import type { IconName } from './primitives';
import { MIcon } from './primitives';

export interface ActionItem {
  label: string;
  icon?: IconName;
  tone?: 'default' | 'danger';
  onSelect: () => void;
}

// iOS action sheet — the touch equivalent of the desktop right-click context
// menu. Long-press a row to open it; it lists the same verbs.
export function ActionSheet({
  title,
  items,
  onClose,
}: {
  title?: string;
  items: ActionItem[];
  onClose: () => void;
}) {
  return (
    <>
      <div className="m-sheet-backdrop" onClick={onClose} style={{ zIndex: 40 }} />
      <div className="m-action-sheet">
        <div className="m-action-group">
          {title && <div className="m-action-title">{title}</div>}
          {items.map((it, i) => (
            <button
              key={i}
              className="m-action-item"
              data-tone={it.tone ?? 'default'}
              onClick={() => {
                it.onSelect();
                onClose();
              }}
            >
              {it.icon && <MIcon name={it.icon} size={18} />}
              {it.label}
            </button>
          ))}
        </div>
        <button className="m-action-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}
