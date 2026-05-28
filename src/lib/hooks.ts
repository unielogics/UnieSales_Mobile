import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import { useAuth } from './auth';
import type { AppMode } from './mode';
import type {
  AppNotification,
  CalendarEvent,
  Campaign,
  DashboardSummary,
  DraftReply,
  InboundLeadRow,
  IntakeSite,
  Lead,
  NotificationCounts,
  NotificationSettings,
  PlannedAction,
  SalesTask,
  ThreadDetail,
  EmailThread,
  WorkspaceWithRole,
} from '../types';

const POLL = 30_000;

function useToken() {
  return useAuth((s) => s.token);
}

// ─── Workspaces + active-workspace resolution ────────────────────────────────
export function useWorkspaces() {
  const token = useToken();
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.get<{ workspaces: WorkspaceWithRole[] }>('/workspaces'),
    enabled: !!token,
    select: (d) => d.workspaces,
  });
}

const INBOUND_UUID = '00000000-0000-4000-a000-000000000001';
function isInbound(w: WorkspaceWithRole) {
  return w.id === INBOUND_UUID || w.name.trim().toLowerCase() === 'inbound';
}

/**
 * Resolve which workspace the given mode operates on.
 *  - sales    → the Inbound workspace (where intake leads land)
 *  - campaign → the first non-Inbound workspace
 */
export function useActiveWorkspace(mode: AppMode) {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const wid = useMemo(() => {
    if (workspaces.length === 0) return null;
    if (mode === 'sales') {
      return (workspaces.find(isInbound) ?? workspaces[0]).id;
    }
    return (workspaces.find((w) => !isInbound(w)) ?? workspaces[0]).id;
  }, [workspaces, mode]);
  const workspace = useMemo(
    () => workspaces.find((w) => w.id === wid) ?? null,
    [workspaces, wid],
  );
  return { wid, workspace, isLoading };
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export function useDashboard(wid: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['dashboard', wid],
    queryFn: () => api.get<DashboardSummary>(`/workspaces/${wid}/dashboard`),
    enabled: !!token && !!wid,
    refetchInterval: POLL,
  });
}

// ─── Inbound leads (Pipeline + Today) ────────────────────────────────────────
export function useInboundLeads(
  wid: string | null,
  params: { site?: IntakeSite; tag?: string; filter?: string; limit?: number } = {},
) {
  const token = useToken();
  return useQuery({
    queryKey: ['inbound-leads', wid, params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.site) sp.set('site', params.site);
      if (params.tag) sp.set('tag', params.tag);
      if (params.filter) sp.set('filter', params.filter);
      sp.set('limit', String(params.limit ?? 200));
      return api.get<{ items: InboundLeadRow[]; total: number }>(
        `/workspaces/${wid}/inbound-leads?${sp.toString()}`,
      );
    },
    enabled: !!token && !!wid,
    select: (d) => d.items,
    refetchInterval: POLL,
  });
}

// ─── Campaigns ───────────────────────────────────────────────────────────────
export function useCampaigns(wid: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['campaigns', wid],
    queryFn: () => api.get<{ campaigns: Campaign[] }>(`/workspaces/${wid}/campaigns`),
    enabled: !!token && !!wid,
    select: (d) => d.campaigns,
    refetchInterval: POLL,
  });
}

// ─── Threads (Inbox) ─────────────────────────────────────────────────────────
export function useThreads(wid: string | null, mode: AppMode) {
  const token = useToken();
  const origin = mode === 'sales' ? 'intake' : 'outbound';
  return useQuery({
    queryKey: ['threads', wid, origin],
    queryFn: () =>
      api.get<{ threads: EmailThread[] }>(
        `/workspaces/${wid}/threads?origin=${origin}&limit=100`,
      ),
    enabled: !!token && !!wid,
    select: (d) => d.threads,
    refetchInterval: POLL,
  });
}

export function useThread(wid: string | null, threadId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['thread', wid, threadId],
    queryFn: () => api.get<ThreadDetail>(`/workspaces/${wid}/threads/${threadId}`),
    enabled: !!token && !!wid && !!threadId,
    select: (d) => d.thread,
  });
}

// ─── Calendar (Meetings) ─────────────────────────────────────────────────────
export function useCalendar(wid: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['calendar', wid],
    queryFn: () =>
      api.get<{ events: CalendarEvent[]; syncedFromGoogle: number }>(
        `/workspaces/${wid}/calendar/events`,
      ),
    enabled: !!token && !!wid,
    select: (d) => d.events,
    refetchInterval: POLL,
  });
}

// ─── AI plan (the approval queue) ────────────────────────────────────────────
export function usePlan(wid: string | null, mode: AppMode) {
  const token = useToken();
  const origin = mode === 'sales' ? 'intake' : 'outbound';
  return useQuery({
    queryKey: ['plan', wid, origin],
    queryFn: () =>
      api.get<{ items: PlannedAction[] }>(
        `/workspaces/${wid}/ai-actions/plan?origin=${origin}`,
      ),
    enabled: !!token && !!wid,
    select: (d) => d.items,
    refetchInterval: POLL,
  });
}

// ─── Lead detail ─────────────────────────────────────────────────────────────
export function useLead(wid: string | null, leadId: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['lead', wid, leadId],
    queryFn: () => api.get<{ lead: Lead }>(`/workspaces/${wid}/leads/${leadId}`),
    enabled: !!token && !!wid && !!leadId,
    select: (d) => d.lead,
  });
}

// ─── Sales tasks (My Queue) ──────────────────────────────────────────────────
export function useSalesTasks(
  wid: string | null,
  params: { status?: string; limit?: number } = {},
) {
  const token = useToken();
  return useQuery({
    queryKey: ['sales-tasks', wid, params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params.status) sp.set('status', params.status);
      if (params.limit != null) sp.set('limit', String(params.limit));
      sp.set('origin', 'intake');
      return api.get<{ items: SalesTask[] }>(
        `/workspaces/${wid}/sales-tasks?${sp.toString()}`,
      );
    },
    enabled: !!token && !!wid,
    select: (d) => d.items,
    refetchInterval: POLL,
  });
}

// ─── Notifications (Phase 2 backend; tolerant of 404 pre-launch) ─────────────
async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 0)) return fallback;
    throw err;
  }
}

export function useNotifications(wid: string | null, unreadOnly = false) {
  const token = useToken();
  return useQuery({
    queryKey: ['notifications', wid, unreadOnly],
    queryFn: () =>
      safe(
        api.get<{ items: AppNotification[] }>(
          `/workspaces/${wid}/notifications?limit=50${unreadOnly ? '&unread=true' : ''}`,
        ),
        { items: [] },
      ),
    enabled: !!token && !!wid,
    select: (d) => d.items,
    refetchInterval: POLL,
  });
}

export function useNotificationCounts(wid: string | null) {
  const token = useToken();
  return useQuery({
    queryKey: ['notification-counts', wid],
    queryFn: () =>
      safe(api.get<NotificationCounts>(`/workspaces/${wid}/notifications/counts`), {
        total: 0,
        unread: 0,
        urgent: 0,
      }),
    enabled: !!token && !!wid,
    refetchInterval: POLL,
  });
}

export function useNotificationSettings() {
  const token = useToken();
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: () =>
      safe(api.get<NotificationSettings>('/users/me/notification-settings'), {
        perKind: {},
        quietHoursEnabled: true,
        quietHoursStart: '21:00',
        quietHoursEnd: '07:00',
      }),
    enabled: !!token,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────
export function useApproveAction(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (actionId: string) =>
      api.post(`/workspaces/${wid}/ai-actions/${actionId}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', wid] });
      qc.invalidateQueries({ queryKey: ['sales-tasks', wid] });
    },
  });
}

export function useRejectAction(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, reason }: { actionId: string; reason?: string }) =>
      api.post(`/workspaces/${wid}/ai-actions/${actionId}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan', wid] }),
  });
}

export function useDraftReply(wid: string | null) {
  return useMutation({
    mutationFn: (threadId: string) =>
      api.post<DraftReply>(`/workspaces/${wid}/threads/${threadId}/draft-reply`, {}),
  });
}

export function useSendThreadReply(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: { subject?: string; body: string } }) =>
      api.post(`/workspaces/${wid}/threads/${threadId}/send-reply`, body),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['thread', wid, v.threadId] });
      qc.invalidateQueries({ queryKey: ['threads', wid] });
    },
  });
}

export function useStopSequence(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ threadId, reason }: { threadId: string; reason?: string }) =>
      api.post(`/workspaces/${wid}/threads/${threadId}/stop-sequence`, { reason }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['thread', wid, v.threadId] });
      qc.invalidateQueries({ queryKey: ['threads', wid] });
    },
  });
}

export function useCloseLead(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, closeReason }: { leadId: string; closeReason: string }) =>
      api.post(`/workspaces/${wid}/leads/${leadId}/close`, { closeReason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbound-leads', wid] });
      qc.invalidateQueries({ queryKey: ['lead', wid] });
    },
  });
}

export function useUpdateLead(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, patch }: { leadId: string; patch: Record<string, unknown> }) =>
      api.patch(`/workspaces/${wid}/leads/${leadId}`, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inbound-leads', wid] });
      qc.invalidateQueries({ queryKey: ['lead', wid] });
    },
  });
}

export function useCompleteTask(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api.post(`/workspaces/${wid}/sales-tasks/${taskId}`, { action: 'complete' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-tasks', wid] }),
  });
}

export function useBulkCompleteTasks(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskIds: string[]) =>
      api.post(`/workspaces/${wid}/sales-tasks/bulk-complete`, { taskIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sales-tasks', wid] }),
  });
}

export function useBulkDeleteLeads(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadIds: string[]) =>
      api.post(`/workspaces/${wid}/leads/bulk-delete`, { leadIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbound-leads', wid] }),
  });
}

export function useBulkDismissThreads(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (threadIds: string[]) =>
      api.post(`/workspaces/${wid}/threads/bulk-dismiss`, { threadIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['threads', wid] }),
  });
}

export function useBulkCancelEvents(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventIds: string[]) =>
      api.post(`/workspaces/${wid}/calendar/events/bulk-cancel`, { eventIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar', wid] }),
  });
}

export function useMarkNotifRead(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`/workspaces/${wid}/notifications/${id}`, { read: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', wid] });
      qc.invalidateQueries({ queryKey: ['notification-counts', wid] });
    },
  });
}

export function useMarkAllNotifRead(wid: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/workspaces/${wid}/notifications/mark-all-read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', wid] });
      qc.invalidateQueries({ queryKey: ['notification-counts', wid] });
    },
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) =>
      api.patch('/users/me/notification-settings', patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-settings'] }),
  });
}

// ─── Shared helpers ──────────────────────────────────────────────────────────
export function tierOfScore(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  return score >= 88 ? 'S' : score >= 78 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D';
}
