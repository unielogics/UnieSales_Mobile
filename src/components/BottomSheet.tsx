import { useRef, useState, type ReactNode } from 'react';
import { haptics } from '../lib/gestures';

// iOS-style bottom sheet. Two dismiss gestures, both the touch equivalent of
// Esc / back:
//   • drag the top handle down (or flick) to dismiss
//   • swipe right from the left edge (the system "back" gesture) to dismiss
// The left-edge swipe uses direction detection so it never fights the body's
// vertical scrolling.
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
  const [dragX, setDragX] = useState(0);
  const startY = useRef<number | null>(null);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const dragging = useRef(false);

  // ── Top-handle drag-down dismiss ──
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

  // ── Left-edge swipe-right (back) dismiss ──
  const edgeActive = useRef(false);
  const edgeStartX = useRef(0);
  const edgeStartY = useRef(0);
  const edgeAxis = useRef<'unknown' | 'horizontal' | 'vertical'>('unknown');

  const onEdgeDown = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Only arm when the gesture begins in the left ~28px edge strip.
    if (e.clientX - rect.left > 28) return;
    edgeActive.current = true;
    edgeStartX.current = e.clientX;
    edgeStartY.current = e.clientY;
    edgeAxis.current = 'unknown';
  };
  const onEdgeMove = (e: React.PointerEvent) => {
    if (!edgeActive.current) return;
    const dx = e.clientX - edgeStartX.current;
    const dy = e.clientY - edgeStartY.current;
    if (edgeAxis.current === 'unknown' && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      edgeAxis.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
    }
    if (edgeAxis.current === 'horizontal' && dx > 0) setDragX(dx);
  };
  const onEdgeUp = (e: React.PointerEvent) => {
    if (!edgeActive.current) return;
    edgeActive.current = false;
    const dx = e.clientX - edgeStartX.current;
    if (edgeAxis.current === 'horizontal' && dx > 90) {
      haptics.light();
      onClose();
    } else {
      setDragX(0);
    }
    edgeAxis.current = 'unknown';
  };
  const onEdgeCancel = () => {
    edgeActive.current = false;
    edgeAxis.current = 'unknown';
    setDragX(0);
  };

  const transform =
    dragX || dragY ? `translate(${dragX}px, ${dragY}px)` : undefined;

  return (
    <>
      <div className="m-sheet-backdrop" onClick={onClose} />
      <div
        className="m-sheet"
        onPointerDown={onEdgeDown}
        onPointerMove={onEdgeMove}
        onPointerUp={onEdgeUp}
        onPointerCancel={onEdgeCancel}
        style={{
          height,
          transform,
          transition: dragging.current || edgeActive.current ? 'none' : 'transform 0.25s cubic-bezier(0.32,0.72,0,1)',
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
