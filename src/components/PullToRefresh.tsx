import type { ReactNode } from 'react';
import { usePullToRefresh } from '../lib/gestures';
import { Spinner } from './primitives';

// Wraps a scroll container and adds iOS-style pull-to-refresh. Place the screen
// content as children; the whole thing is the `.phone-scroll` element.
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
}) {
  const { pull, refreshing, bind } = usePullToRefresh(onRefresh);
  return (
    <div
      className="phone-scroll"
      style={{ overflow: 'auto', height: '100%', WebkitOverflowScrolling: 'touch' }}
      {...bind}
    >
      <div className="m-ptr" style={{ height: pull }}>
        {pull > 10 && (refreshing ? <Spinner /> : <span style={{ fontSize: 12 }}>Pull to refresh</span>)}
      </div>
      {children}
    </div>
  );
}
