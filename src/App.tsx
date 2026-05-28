import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './lib/auth';
import { useMode } from './lib/mode';
import {
  useActiveWorkspace,
  useThreads,
  useCalendar,
  useNotificationCounts,
} from './lib/hooks';
import { registerPush, type DeepLink } from './lib/push';
import { useWorkspaceStore } from './lib/workspace';
import { dayBucket, MIcon, MAvatar, Spinner } from './components/primitives';
import { ModePill } from './components/ModePill';
import { WorkspacePill } from './components/WorkspacePill';
import { TabBar, type TabDef } from './components/TabBar';
import { Login } from './screens/login';
import { Today } from './screens/today';
import { Pipeline } from './screens/pipeline';
import { Campaigns } from './screens/campaigns';
import { Inbox } from './screens/inbox';
import { Meetings } from './screens/meetings';
import { Alerts } from './screens/alerts';
import { LeadSheet } from './screens/lead-sheet';
import { ThreadSheet } from './screens/thread-sheet';
import { Settings } from './screens/settings';
import type { AppMode } from './lib/mode';
import type { AppNotification } from './types';
import './styles/mobile.css';

export default function App() {
  const hydrated = useAuth((s) => s.hydrated);
  const token = useAuth((s) => s.token);
  const hydrateAuth = useAuth((s) => s.hydrate);
  const user = useAuth((s) => s.user);
  const mode = useMode((s) => s.mode);
  const setMode = useMode((s) => s.setMode);
  const hydrateMode = useMode((s) => s.hydrate);
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrate);

  const [tab, setTab] = useState('today');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void hydrateAuth();
    void hydrateMode();
    void hydrateWorkspace();
  }, [hydrateAuth, hydrateMode, hydrateWorkspace]);

  // Drop on Today whenever the mode flips.
  useEffect(() => setTab('today'), [mode]);

  // Push registration + deep-link handling (Android only; no-op on web).
  useEffect(() => {
    if (!token) return;
    const onDeepLink = (link: DeepLink) => {
      if (link.type === 'lead') setLeadId(link.id);
      else if (link.type === 'thread') setThreadId(link.id);
      else setTab('alerts');
    };
    void registerPush(onDeepLink);
  }, [token]);

  if (!hydrated) {
    return (
      <div className="m-app-root" style={{ display: 'grid', placeItems: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!token) return <Login />;

  return (
    <Shell
      mode={mode}
      setMode={setMode}
      tab={tab}
      setTab={setTab}
      leadId={leadId}
      setLeadId={setLeadId}
      threadId={threadId}
      setThreadId={setThreadId}
      settingsOpen={settingsOpen}
      setSettingsOpen={setSettingsOpen}
      userName={user?.name || user?.email || '?'}
    />
  );
}

function Shell({
  mode,
  setMode,
  tab,
  setTab,
  leadId,
  setLeadId,
  threadId,
  setThreadId,
  settingsOpen,
  setSettingsOpen,
  userName,
}: {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  tab: string;
  setTab: (t: string) => void;
  leadId: string | null;
  setLeadId: (id: string | null) => void;
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (b: boolean) => void;
  userName: string;
}) {
  const { wid, isLoading } = useActiveWorkspace(mode);
  const isSales = mode === 'sales';

  // Switching workspace (or mode) re-keys every screen's queries to the new
  // workspace. Close any open lead/thread sheet so a stale record from the
  // previous workspace can't linger over the newly isolated data.
  useEffect(() => {
    setLeadId(null);
    setThreadId(null);
  }, [wid, setLeadId, setThreadId]);

  // Badge sources (share the react-query cache with the screens).
  const threads = useThreads(wid, mode);
  const cal = useCalendar(wid);
  const notifCounts = useNotificationCounts(wid);

  const inboxBadge = (threads.data ?? []).filter((t) => t.status === 'handoff' || t.status === 'paused').length;
  const todayBadge = (cal.data ?? []).filter((e) => e.status !== 'cancelled' && dayBucket(e.startAt) === 'today').length;
  const alertsBadge = notifCounts.data?.urgent ?? 0;

  const tabs: TabDef[] = isSales
    ? [
        { id: 'today', label: 'Today', icon: 'home' },
        { id: 'pipeline', label: 'Pipeline', icon: 'branch' },
        { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: inboxBadge },
        { id: 'calls', label: 'Meetings', icon: 'calendar', badge: todayBadge },
        { id: 'alerts', label: 'Alerts', icon: 'bell', badge: alertsBadge },
      ]
    : [
        { id: 'today', label: 'Today', icon: 'home' },
        { id: 'campaigns', label: 'Campaigns', icon: 'target' },
        { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: inboxBadge },
        { id: 'calls', label: 'Meetings', icon: 'calendar', badge: todayBadge },
        { id: 'alerts', label: 'Alerts', icon: 'bell', badge: alertsBadge },
      ];

  const onOpenNotif = useMemo(
    () => (n: AppNotification) => {
      if (n.threadId) setThreadId(n.threadId);
      else if (n.leadId) setLeadId(n.leadId);
    },
    [setLeadId, setThreadId],
  );

  return (
    <div className="m-app-root">
      {/* Workspace switcher — top-left, campaign mode only (sales pins to Inbound) */}
      {!isSales && wid && <WorkspacePill wid={wid} />}

      {/* Profile + mode toggle — top-right cluster */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(12px + env(safe-area-inset-top))',
          right: 14,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={() => setSettingsOpen(true)}
          className="tap"
          style={{ display: 'flex' }}
          aria-label="Settings"
        >
          <MAvatar name={userName} color="rgba(255,255,255,0.12)" size={32} />
        </button>
        <ModePill mode={mode} setMode={setMode} />
      </div>

      <div style={{ height: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <Spinner />
          </div>
        ) : !wid ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 32, textAlign: 'center', color: 'var(--m-text-muted)' }}>
            <div>
              <MIcon name="alert" size={28} />
              <div style={{ marginTop: 10, fontSize: 14 }}>
                No {isSales ? 'inbound' : 'campaign'} workspace on this account.
              </div>
            </div>
          </div>
        ) : (
          <>
            {tab === 'today' && (
              <Today wid={wid} mode={mode} onOpenLead={setLeadId} onGo={setTab} onOpenNotif={onOpenNotif} />
            )}
            {tab === 'pipeline' && <Pipeline wid={wid} onOpenLead={setLeadId} />}
            {tab === 'campaigns' && <Campaigns wid={wid} />}
            {tab === 'inbox' && <Inbox wid={wid} mode={mode} onOpenThread={setThreadId} />}
            {tab === 'calls' && <Meetings wid={wid} onOpenLead={setLeadId} />}
            {tab === 'alerts' && <Alerts wid={wid} onOpenNotif={onOpenNotif} />}
          </>
        )}
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {leadId && <LeadSheet wid={wid} mode={mode} leadId={leadId} onClose={() => setLeadId(null)} />}
      {threadId && (
        <ThreadSheet
          wid={wid}
          threadId={threadId}
          onClose={() => setThreadId(null)}
          onOpenLead={(id) => {
            setThreadId(null);
            setLeadId(id);
          }}
        />
      )}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
