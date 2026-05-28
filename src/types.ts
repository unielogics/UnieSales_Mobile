// Duplicated, stable backend contract types. Kept independent of the desktop
// repo on purpose — the only shared contract between the two apps is the HTTP
// API + JWT. Small, stable interfaces; not worth a shared package.

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  errors: never[];
}
export interface ApiErrorBody {
  success: false;
  data: null;
  message: string;
  errors: { field?: string; reason: string }[];
}
export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorBody;

export interface AuthedUser {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceRole = 'owner' | 'admin' | 'viewer';

export interface Workspace {
  id: string;
  name: string;
  companyName: string;
  brandName: string | null;
  autoReplyEnabled: boolean;
  isActive: boolean;
}
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface DashboardSummary {
  workspace: Workspace;
  counts: {
    campaigns: { total: number; active: number; draft: number };
    leads: { total: number; active: number; closed: number };
    gmail_accounts: number;
    pending_ai_actions: number;
    scheduled_sends: number;
    send_volume_7d: number;
    send_volume_today: number;
    handoff_queue: number;
    replied_7d: number;
    new_leads_today: { from_upload: number; from_update: number };
  };
}

export type IntakeSite = 'uniewms' | 'unielogics' | 'uniecortex';

export interface InboundLeadRow {
  id: string;
  workspaceId: string;
  campaignId: string | null;
  email: string;
  contactName: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  title: string | null;
  phone: string | null;
  source: string | null;
  sourceUrl: string | null;
  site: IntakeSite | null;
  tag: string | null;
  leadScore: number;
  status: string;
  pipelineStage: string | null;
  nextActionAt: string | null;
  hasOpenHandoff: boolean;
  openTaskCount: number;
  createdAt: string;
  postIntakeProcessedAt: string | null;
}

export type LifecycleStatus = 'active' | 'paused' | 'paused_human' | 'closed';

export interface Lead {
  id: string;
  workspaceId: string;
  campaignId: string | null;
  companyName: string | null;
  contactName: string | null;
  email: string;
  phone: string | null;
  title: string | null;
  segment: string | null;
  source: string | null;
  sourceUrl: string | null;
  leadScore: number;
  leadScoreReason: string | null;
  painAngle: string | null;
  personalization: string | null;
  status: string;
  lifecycleStatus: LifecycleStatus;
  nextActionAt: string | null;
  pipelineStage: string | null;
  firstName: string | null;
  lastName: string | null;
  lastContactedAt: string | null;
  lastEngagementAt: string | null;
  customFields: Record<string, string> | null;
  aiOwner: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailThread {
  id: string;
  workspaceId: string;
  campaignId: string | null;
  leadId: string | null;
  channel: 'email' | 'sms';
  subject: string | null;
  status: 'active' | 'handoff' | 'closed' | 'paused';
  aiOwner: boolean;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailMessage {
  id: string;
  leadId: string | null;
  channel: 'email' | 'sms';
  direction: 'inbound' | 'outbound' | 'draft' | null;
  fromEmail: string | null;
  toEmail: string | null;
  subject: string | null;
  body: string | null;
  aiClassification: string | null;
  aiSummary: string | null;
  createdAt: string;
}

export interface ThreadDetail {
  thread: EmailThread & { messages: EmailMessage[]; lead: Lead | null };
}

export interface DraftReply {
  ai: {
    actionId: string;
    classification: string;
    confidence: number;
    lead_temperature: string;
    should_auto_reply: boolean;
    should_handoff: boolean;
    summary: string;
    reply_subject: string | null;
    reply_body: string | null;
    handoff_summary: string | null;
  };
  meetEvent: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    meetLink: string | null;
  } | null;
}

export interface CalendarAttendee {
  email: string;
  name?: string;
  responseStatus?: string;
}
export interface CalendarEvent {
  id: string;
  workspaceId: string;
  leadId: string | null;
  campaignId: string | null;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  attendees: CalendarAttendee[] | null;
  meetLink: string | null;
  location: string | null;
  status: 'confirmed' | 'tentative' | 'cancelled';
  source: 'app' | 'google' | 'ai_booked';
  createdAt: string;
}

export type CampaignStatus =
  | 'draft'
  | 'needs_training'
  | 'training_in_progress'
  | 'needs_review'
  | 'ready_to_activate'
  | 'active'
  | 'paused'
  | 'archived';

export interface Campaign {
  id: string;
  workspaceId: string;
  name: string;
  status: CampaignStatus;
  goalSummary: string | null;
  sentToday: number;
  updatedAt: string;
}

export interface PlannedAction {
  id: string;
  kind: 'scheduled_send' | 'queued_action';
  actionType: string;
  actionLabel: string;
  leadId: string | null;
  campaignId: string | null;
  contactName: string | null;
  companyName: string | null;
  email: string | null;
  summary: string;
  subject: string | null;
  body: string | null;
  confidence: number | null;
  triggerAt: string | null;
  status: string;
  createdAt: string;
}

export type SalesTaskStatus = 'open' | 'completed' | 'snoozed';
export type SalesTaskPriority = 'low' | 'med' | 'high';

export interface SalesTask {
  id: string;
  workspaceId: string;
  leadId: string | null;
  title: string;
  type: string;
  priority: SalesTaskPriority;
  status: SalesTaskStatus;
  dueAt: string | null;
  source: 'manual' | 'AI';
  createdAt: string;
  completedAt: string | null;
}

// ─── Notifications (Phase 2 backend; mobile reads these) ───────────────────
export type NotificationKind =
  | 'handoff' | 'booking' | 'draft' | 'reply' | 'objection'
  | 'won' | 'lost' | 'score' | 'risk' | 'summary';
export type NotificationPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface AppNotification {
  id: string;
  workspaceId: string;
  userId: string | null;
  kind: NotificationKind;
  priority: NotificationPriority;
  title: string;
  body: string | null;
  meta: string | null;
  leadId: string | null;
  threadId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCounts {
  total: number;
  unread: number;
  urgent: number;
}

export interface NotificationSettings {
  perKind: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}
