/**
 * Core domain types for PatientNexa Copilot
 * Designed for alignment with standard FHIR healthcare resource concepts
 */

export type WorkflowPriorityTier =
  | 'overdue_high'     // Overdue > 7 days past scheduled follow-up
  | 'overdue_moderate' // Overdue 1–7 days past scheduled follow-up
  | 'due_today'        // Scheduled for today (0 days)
  | 'scheduled';       // Upcoming or already resolved/scheduled

export type FollowUpStatus =
  | 'pending'          // Awaiting staff review/action
  | 'drafted'          // AI outreach draft generated, awaiting approval
  | 'contacted'        // Outreach simulated/sent, awaiting patient response
  | 'resolved'         // Appointment scheduled or follow-up closed
  | 'escalated';       // Flagged for clinical triage nurse/physician

export type FollowUpCategory =
  | 'post-op'          // Post-procedure / wound check
  | 'chronic-care'     // Chronic condition monitoring (diabetes, hypertension)
  | 'lab-review'       // Diagnostic test / lab results review
  | 'preventive';      // Annual check / immunization

export type ContactChannel = 'sms' | 'phone' | 'email';

export interface Patient {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'female' | 'male' | 'other';
  phone: string;
  email: string;
  preferredChannel: ContactChannel;
  preferredLanguage: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface FollowUpTask {
  id: string;
  patientId: string;
  patient: Patient;
  encounterDate: string;    // Date of visit/discharge (YYYY-MM-DD)
  dueDate: string;          // Target follow-up date (YYYY-MM-DD)
  daysOverdue: number;      // Positive = overdue, 0 = due today, negative = upcoming
  attendingProvider: string; // e.g., "Dr. Robert Chen, MD"
  clinicLocation: string;   // e.g., "Suite 400 - Main Outpatient"
  primaryDiagnosis: string; // Fictional clinical visit reason
  clinicalDirective: string;// Doctor's directive note
  category: FollowUpCategory;
  priorityTier: WorkflowPriorityTier;
  priorityReason: string;   // Transparent rule explanation (e.g., "Overdue: 9 days past recall target")
  status: FollowUpStatus;
  lastAttemptAt?: string;
  attemptsCount: number;
  scheduledAppointmentAt?: string;
}

export type OutcomeType =
  | 'contacted'
  | 'no_response'
  | 'appointment_scheduled'
  | 'declined'
  | 'follow_up_needed'
  | 'unable_to_reach';

export interface FollowUpOutcome {
  id: string;
  followUpTaskId: string;
  outcomeType: OutcomeType;
  scheduledAppointmentAt?: string;
  staffNotes?: string;
  recordedByStaff: string;
  recordedAt: string;
}

export interface AuditLog {
  id: string;
  taskId: string;
  patientId: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalQueue: number;
  overdueHigh: number;      // >7 days
  overdueModerate: number;  // 1-7 days
  dueToday: number;
  scheduledOrResolved: number;
}

export interface TaskFilterOptions {
  searchQuery?: string;
  tierFilter?: 'all' | 'overdue' | 'due_today' | 'scheduled';
  providerFilter?: string;
  categoryFilter?: string;
}

export type ToneModifier = 'standard' | 'briefer' | 'gentle' | 'direct';

export interface DraftRequest {
  taskId: string;
  channel: ContactChannel;
  tone?: ToneModifier;
}

export interface DraftResponse {
  success: boolean;
  taskId: string;
  channel: ContactChannel;
  draftText: string;
  emailSubject?: string;
  isUrgentClinicalConcern: boolean;
  escalationNotice?: string;
  source: 'ai_gemini' | 'deterministic_template';
  warning?: string;
}

export interface SimulatedOutreachEvent {
  taskId: string;
  channel: ContactChannel;
  messageContent: string;
  emailSubject?: string;
  staffEdited: boolean;
  staffName?: string;
}

export interface DailyOperationalSummary {
  reportDate: string;
  isAllTime: boolean;
  dueTodayCount: number;
  overdueCount: number;
  overdueHighCount: number;
  overdueModerateCount: number;
  unresolvedCount: number;
  simulatedOutreachCount: number;
  appointmentsScheduledCount: number;
  noResponseCount: number;
  unableToReachCount: number;
  contactedCount: number;
  declinedCount: number;
  followUpNeededCount: number;
  recentActivity: Array<{
    id: string;
    patientName: string;
    mrn: string;
    outcomeType: OutcomeType;
    scheduledAppointmentAt?: string;
    staffNotes?: string;
    recordedAt: string;
  }>;
  scheduledAppointments: Array<{
    taskId: string;
    patientName: string;
    mrn: string;
    provider: string;
    scheduledAt: string;
  }>;
}
