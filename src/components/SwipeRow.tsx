import { useRef, useState, type ReactNode } from 'react';
import { MIcon, type IconName, type Tone } from './primitives';
import { haptics } from '../lib/gestures';

export interface SwipeAction {
  label: string;
  icon: IconName;
  tone: Tone; // success | danger | warning | info | accent
  onCommit: () => void;
}

// Generalized swipe row. Swipe right reveals `left` action (e.g. Won/Approve),
// swipe left reveals `right` action (e.g. Lost/Dismiss/Cancel). Releasing past
// the commit threshold fires onCommit with a medium haptic; otherwise snaps
// back. Tapping with no swipe calls onTap.
export function SwipeRow({
  left,
  right,
  onTap,
  children,
  commitThreshold = 110,
}: {
  left?: SwipeAction;
  right?: SwipeAction;
  onTap?: () => void;
  children: ReactNode;
  commitThreshold?: number;
}) {
  const [offset, setOffset] = useState(0);
  const swiping = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizontal = useRef(false);

  const onDown = (e: React.PointerEvent) => {
    swiping.current = true;
    horizontal.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!swiping.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    if (!horizontal.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
      horizontal.current = true;
    }
    if (!horizontal.current) return;
    // Clamp to the side that actually has an action.
    if (dx > 0 && !left) return;
    if (dx < 0 && !right) return;
    setOffset(dx);
  };
  const onUp = () => {
    if (!swiping.current) return;
    swiping.current = false;
    if (offset > commitThreshold && left) {
      setOffset(380);
      haptics.medium();
      setTimeout(() => {
        left.onCommit();
        setOffset(0);
      }, 180);
    } else if (offset < -commitThreshold && right) {
      setOffset(-380);
      haptics.medium();
      setTimeout(() => {
        right.onCommit();
        setOffset(0);
      }, 180);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="m-swipe-row">
      <div className="m-swipe-actions">
        {left && (
          <div className="m-swipe-action" data-side="left" data-tone={left.tone} style={{ opacity: offset > 30 ? 1 : 0.4 }}>
            <MIcon name={left.icon} size={22} stroke={2.5} />
            <span>{left.label}</span>
          </div>
        )}
        {!left && <div style={{ flex: 1 }} />}
        {right && (
          <div className="m-swipe-action" data-side="right" data-tone={right.tone} style={{ opacity: offset < -30 ? 1 : 0.4 }}>
            <MIcon name={right.icon} size={22} stroke={2.5} />
            <span>{right.label}</span>
          </div>
        )}
        {!right && <div style={{ flex: 1 }} />}
      </div>
      <div
        className="m-swipe-content"
        onClick={() => Math.abs(offset) < 4 && onTap?.()}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          transform: `translateX(${offset}px)`,
          transition: swiping.current ? 'none' : 'transform 0.2s ease',
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
    </div>
  );
}
