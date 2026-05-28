import { useRef, useState, type ReactNode } from 'react';
import { haptics } from '../lib/gestures';

// iOS-style bottom sheet. The drag handle is a pointer-drag target: dragging
// down translates the sheet, and releasing past ~120px (or a fast flick)
// dismisses it. This is the touch equivalent of Esc / click-outside.
export function BottomSheet({
  onClose,
  children,
  height = '92%',
}: {
  onClose: () => void;
  children: ReactNode;
  height?: string;
}) {
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const dragging = useRef(false);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    lastY.current = e.clientY;
    lastT.current = Date.now();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragging.current || startY.current == null) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) setDragY(dy);
    lastY.current = e.clientY;
    lastT.current = Date.now();
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const dt = Date.now() - lastT.current || 1;
    const velocity = (e.clientY - lastY.current) / dt; // px/ms
    if (dragY > 120 || velocity > 0.6) {
      haptics.light();
      onClose();
    } else {
      setDragY(0);
    }
  };

  return (
    <>
      <div className="m-sheet-backdrop" onClick={onClose} />
      <div
        className="m-sheet"
        style={{
          height,
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div
          className="m-sheet-handle-zone"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ paddingBottom: 2 }}
        >
          <div className="m-sheet-handle" />
        </div>
        {children}
      </div>
    </>
  );
}
