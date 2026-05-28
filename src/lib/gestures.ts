import { useCallback, useMemo, useRef, useState } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// ─── Haptics ───────────────────────────────────────────────────────────────
// Thin wrapper that no-ops on web (the plugin throws if called in a browser).
const isNative = Capacitor.isNativePlatform();

export const haptics = {
  light: () => {
    if (isNative) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  },
  medium: () => {
    if (isNative) void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
  },
  success: () => {
    if (isNative) void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
  },
  warning: () => {
    if (isNative) void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
  },
};

// ─── useLongPress — the right-click replacement ──────────────────────────────
// pointerdown starts a timer; a move beyond tolerance or an early pointerup
// cancels it. Fires a haptic tick on trigger. Returns pointer handlers to
// spread onto any element.
export function useLongPress(
  onLongPress: () => void,
  opts: { ms?: number; moveTolerance?: number } = {},
) {
  const { ms = 450, moveTolerance = 10 } = opts;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        haptics.light();
        onLongPress();
      }, ms);
    },
    [clear, ms, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = Math.abs(e.clientX - start.current.x);
      const dy = Math.abs(e.clientY - start.current.y);
      if (dx > moveTolerance || dy > moveTolerance) clear();
    },
    [clear, moveTolerance],
  );

  const onPointerUp = useCallback(() => clear(), [clear]);

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    },
    /** True if the most recent interaction triggered a long-press (suppress the click). */
    didFire: () => fired.current,
  };
}

// ─── useSelection — multi-select (Ctrl-click replacement) ────────────────────
export type SelectionMode = 'browse' | 'select';

export function useSelection() {
  const [mode, setMode] = useState<SelectionMode>('browse');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const enter = useCallback((id: string) => {
    setMode('select');
    setSelected(new Set([id]));
    haptics.light();
  }, []);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
    setMode('browse');
  }, []);

  return useMemo(
    () => ({
      mode,
      selected,
      count: selected.size,
      has: (id: string) => selected.has(id),
      enter,
      toggle,
      clear,
      isSelecting: mode === 'select',
    }),
    [mode, selected, enter, toggle, clear],
  );
}

// ─── usePullToRefresh — attach to a scroll container ─────────────────────────
export function usePullToRefresh(onRefresh: () => Promise<unknown> | void) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);
  const THRESHOLD = 70;

  const onScrollPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop <= 0) {
      startY.current = e.clientY;
      active.current = true;
    }
  }, []);

  const onScrollPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!active.current || startY.current == null || refreshing) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) {
      // Rubber-band resistance.
      setPull(Math.min(dy * 0.5, 90));
    }
  }, [refreshing]);

  const finish = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    startY.current = null;
    if (pull >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(48);
      haptics.light();
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, refreshing, onRefresh]);

  return {
    pull,
    refreshing,
    bind: {
      onPointerDown: onScrollPointerDown,
      onPointerMove: onScrollPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
    },
  };
}
