import { BottomSheet } from '../components/BottomSheet';
import { MIcon, MAvatar } from '../components/primitives';
import { useAuth } from '../lib/auth';
import { useMode } from '../lib/mode';
import { useActiveWorkspace } from '../lib/hooks';

export function Settings({ onClose }: { onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const mode = useMode((s) => s.mode);
  const { workspace } = useActiveWorkspace(mode);

  return (
    <BottomSheet onClose={onClose} height="auto">
      <div className="m-sheet-header">
        <MAvatar name={user?.name || user?.email || '?'} color="#8b5cf6" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || 'Account'}</div>
          <div style={{ fontSize: 12, color: 'var(--m-text-2)' }}>{user?.email}</div>
        </div>
        <button className="tap" onClick={onClose} style={{ color: 'var(--m-text-2)', padding: 4 }}>
          <MIcon name="x" size={20} />
        </button>
      </div>
      <div className="m-sheet-body">
        <div className="m-card">
          <div className="m-card-row">
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--m-accent-soft)', color: 'var(--m-accent)', display: 'grid', placeItems: 'center' }}>
              <MIcon name={mode === 'sales' ? 'target' : 'zap'} size={16} />
            </span>
            <div className="body">
              <div className="title">Mode</div>
              <div className="sub" style={{ textTransform: 'capitalize' }}>{mode}</div>
            </div>
          </div>
          <div className="m-card-row">
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--m-info-soft)', color: 'var(--m-info)', display: 'grid', placeItems: 'center' }}>
              <MIcon name="home" size={16} />
            </span>
            <div className="body">
              <div className="title">Workspace</div>
              <div className="sub">{workspace?.name ?? '—'}</div>
            </div>
          </div>
        </div>

        <button
          className="m-btn"
          data-variant="danger"
          style={{ width: '100%', marginTop: 16 }}
          onClick={() => {
            void logout();
            onClose();
          }}
        >
          <MIcon name="logout" size={15} /> Sign out
        </button>

        <div style={{ textAlign: 'center', color: 'var(--m-text-dim)', fontSize: 11, marginTop: 16 }}>
          UnieSales Mobile · v1.0
        </div>
      </div>
    </BottomSheet>
  );
}
