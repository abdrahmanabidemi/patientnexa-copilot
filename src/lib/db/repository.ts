import { getDatabase, resetDatabase } from './database';
import {
  AuditLog,
  DashboardMetrics,
  FollowUpOutcome,
  FollowUpTask,
  OutcomeType,
  SimulatedOutreachEvent,
  TaskFilterOptions,
} from '../types';

interface TaskDbRow {
  id: string;
  patient_id: string;
  encounter_date: string;
  due_date: string;
  days_overdue: number;
  attending_provider: string;
  clinic_location: string;
  primary_diagnosis: string;
  clinical_directive: string;
  category: any;
  priority_tier: any;
  priority_reason: string;
  status: any;
  last_attempt_at: string | null;
  attempts_count: number;
  scheduled_appointment_at: string | null;
  mrn: string;
  full_name: string;
  date_of_birth: string;
  gender: any;
  phone: string;
  email: string;
  preferred_channel: any;
  preferred_language: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

function mapRowToTask(row: TaskDbRow): FollowUpTask {
  return {
    id: row.id,
    patientId: row.patient_id,
    encounterDate: row.encounter_date,
    dueDate: row.due_date,
    daysOverdue: row.days_overdue,
    attendingProvider: row.attending_provider,
    clinicLocation: row.clinic_location,
    primaryDiagnosis: row.primary_diagnosis,
    clinicalDirective: row.clinical_directive,
    category: row.category,
    priorityTier: row.priority_tier,
    priorityReason: row.priority_reason,
    status: row.status,
    lastAttemptAt: row.last_attempt_at || undefined,
    attemptsCount: row.attempts_count,
    scheduledAppointmentAt: row.scheduled_appointment_at || undefined,
    patient: {
      id: row.patient_id,
      mrn: row.mrn,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      preferredChannel: row.preferred_channel,
      preferredLanguage: row.preferred_language,
      emergencyContactName: row.emergency_contact_name || undefined,
      emergencyContactPhone: row.emergency_contact_phone || undefined,
    },
  };
}

export function getFollowUpTasks(filters: TaskFilterOptions = {}): {
  tasks: FollowUpTask[];
  metrics: DashboardMetrics;
  providers: string[];
} {
  const db = getDatabase();

  // 1. Calculate overall metrics
  const allRows = db.prepare(`
    SELECT priority_tier, status, days_overdue, attending_provider
    FROM follow_up_tasks
  `).all() as Array<{
    priority_tier: string;
    status: string;
    days_overdue: number;
    attending_provider: string;
  }>;

  const providers = Array.from(new Set(allRows.map((r) => r.attending_provider))).sort();

  const metrics: DashboardMetrics = {
    totalQueue: allRows.length,
    overdueHigh: allRows.filter((r) => r.priority_tier === 'overdue_high' && r.status !== 'resolved').length,
    overdueModerate: allRows.filter((r) => r.priority_tier === 'overdue_moderate' && r.status !== 'resolved').length,
    dueToday: allRows.filter((r) => r.priority_tier === 'due_today' && r.status !== 'resolved').length,
    scheduledOrResolved: allRows.filter(
      (r) => r.priority_tier === 'scheduled' || r.status === 'resolved'
    ).length,
  };

  // 2. Build filtered query
  let sql = `
    SELECT 
      t.id, t.patient_id, t.encounter_date, t.due_date, t.days_overdue,
      t.attending_provider, t.clinic_location, t.primary_diagnosis,
      t.clinical_directive, t.category, t.priority_tier, t.priority_reason,
      t.status, t.last_attempt_at, t.attempts_count, t.scheduled_appointment_at,
      p.mrn, p.full_name, p.date_of_birth, p.gender, p.phone, p.email,
      p.preferred_channel, p.preferred_language, p.emergency_contact_name, p.emergency_contact_phone
    FROM follow_up_tasks t
    JOIN patients p ON t.patient_id = p.id
    WHERE 1=1
  `;

  const params: any[] = [];

  // Filter: Tier / Status
  if (filters.tierFilter === 'overdue') {
    sql += ` AND (t.priority_tier = 'overdue_high' OR t.priority_tier = 'overdue_moderate') AND t.status != 'resolved'`;
  } else if (filters.tierFilter === 'due_today') {
    sql += ` AND t.priority_tier = 'due_today' AND t.status != 'resolved'`;
  } else if (filters.tierFilter === 'scheduled') {
    sql += ` AND (t.priority_tier = 'scheduled' OR t.status = 'resolved')`;
  }

  // Filter: Provider
  if (filters.providerFilter && filters.providerFilter !== 'all') {
    sql += ` AND t.attending_provider = ?`;
    params.push(filters.providerFilter);
  }

  // Filter: Category
  if (filters.categoryFilter && filters.categoryFilter !== 'all') {
    sql += ` AND t.category = ?`;
    params.push(filters.categoryFilter);
  }

  // Filter: Search Query (matches name, MRN, diagnosis, clinical directive)
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = `%${filters.searchQuery.trim()}%`;
    sql += ` AND (
      p.full_name LIKE ? OR 
      p.mrn LIKE ? OR 
      t.primary_diagnosis LIKE ? OR 
      t.attending_provider LIKE ? OR
      t.clinical_directive LIKE ?
    )`;
    params.push(q, q, q, q, q);
  }

  // Sorting strictly by transparent workflow rules:
  // 1. Highest days overdue first (descending)
  // 2. Earliest due date
  sql += `
    ORDER BY 
      CASE 
        WHEN t.status = 'resolved' THEN 4
        WHEN t.priority_tier = 'overdue_high' THEN 1
        WHEN t.priority_tier = 'overdue_moderate' THEN 2
        WHEN t.priority_tier = 'due_today' THEN 3
        ELSE 4
      END ASC,
      t.days_overdue DESC,
      t.due_date ASC
  `;

  const rows = db.prepare(sql).all(...params) as unknown as TaskDbRow[];
  const tasks = rows.map(mapRowToTask);

  return { tasks, metrics, providers };
}

export function getTaskById(taskId: string): FollowUpTask | null {
  const db = getDatabase();
  const sql = `
    SELECT 
      t.id, t.patient_id, t.encounter_date, t.due_date, t.days_overdue,
      t.attending_provider, t.clinic_location, t.primary_diagnosis,
      t.clinical_directive, t.category, t.priority_tier, t.priority_reason,
      t.status, t.last_attempt_at, t.attempts_count, t.scheduled_appointment_at,
      p.mrn, p.full_name, p.date_of_birth, p.gender, p.phone, p.email,
      p.preferred_channel, p.preferred_language, p.emergency_contact_name, p.emergency_contact_phone
    FROM follow_up_tasks t
    JOIN patients p ON t.patient_id = p.id
    WHERE t.id = ?
  `;

  const row = db.prepare(sql).get(taskId) as unknown as TaskDbRow | undefined;
  if (!row) {
    return null;
  }
  return mapRowToTask(row);
}

export function getTaskOutcomes(taskId: string): FollowUpOutcome[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, follow_up_task_id, outcome_type, scheduled_appointment_at, staff_notes, recorded_by_staff, recorded_at
    FROM follow_up_outcomes
    WHERE follow_up_task_id = ?
    ORDER BY recorded_at DESC
  `).all(taskId) as Array<{
    id: string;
    follow_up_task_id: string;
    outcome_type: OutcomeType;
    scheduled_appointment_at: string | null;
    staff_notes: string | null;
    recorded_by_staff: string;
    recorded_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    followUpTaskId: r.follow_up_task_id,
    outcomeType: r.outcome_type,
    scheduledAppointmentAt: r.scheduled_appointment_at || undefined,
    staffNotes: r.staff_notes || undefined,
    recordedByStaff: r.recorded_by_staff,
    recordedAt: r.recorded_at,
  }));
}

export function getTaskAuditLogs(taskId: string): AuditLog[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, task_id, patient_id, action, details, performed_by, timestamp
    FROM audit_logs
    WHERE task_id = ?
    ORDER BY timestamp DESC
  `).all(taskId) as Array<{
    id: string;
    task_id: string | null;
    patient_id: string | null;
    action: string;
    details: string;
    performed_by: string;
    timestamp: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    taskId: r.task_id || '',
    patientId: r.patient_id || '',
    action: r.action,
    details: r.details,
    performedBy: r.performed_by,
    timestamp: r.timestamp,
  }));
}

export function recordOutcome(
  taskId: string,
  data: {
    outcomeType: OutcomeType;
    scheduledAppointmentAt?: string;
    staffNotes?: string;
    staffName?: string;
  }
): { success: boolean; task: FollowUpTask; outcomeId: string } {
  const db = getDatabase();
  const existing = getTaskById(taskId);
  if (!existing) {
    throw new Error(`Task ${taskId} not found`);
  }

  const outcomeId = `outcome-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const staffName = data.staffName || 'Care Coordinator';
  const now = new Date().toISOString();

  // 1. Insert into follow_up_outcomes
  db.prepare(`
    INSERT INTO follow_up_outcomes (
      id, follow_up_task_id, outcome_type, scheduled_appointment_at, staff_notes, recorded_by_staff, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    outcomeId,
    taskId,
    data.outcomeType,
    data.scheduledAppointmentAt || null,
    data.staffNotes || null,
    staffName,
    now
  );

  // 2. Determine state transition on follow_up_tasks based on outcome
  let nextStatus = existing.status;
  let nextPriorityTier = existing.priorityTier;
  let nextPriorityReason = existing.priorityReason;
  let scheduledAt = existing.scheduledAppointmentAt || null;
  let attemptsCount = existing.attemptsCount;

  switch (data.outcomeType) {
    case 'appointment_scheduled':
      nextStatus = 'resolved';
      nextPriorityTier = 'scheduled';
      scheduledAt = data.scheduledAppointmentAt || now.split('T')[0];
      nextPriorityReason = `Scheduled: Confirmed appointment for ${scheduledAt}`;
      break;

    case 'declined':
      nextStatus = 'resolved';
      nextPriorityReason = 'Resolved: Patient declined follow-up or completed elsewhere';
      break;

    case 'contacted':
      nextStatus = 'contacted';
      attemptsCount += 1;
      break;

    case 'no_response':
      nextStatus = 'pending';
      attemptsCount += 1;
      break;

    case 'follow_up_needed':
      nextStatus = 'pending';
      break;

    case 'unable_to_reach':
      nextStatus = 'contacted';
      attemptsCount += 1;
      break;
  }

  db.prepare(`
    UPDATE follow_up_tasks
    SET status = ?, priority_tier = ?, priority_reason = ?, scheduled_appointment_at = ?,
        attempts_count = ?, last_attempt_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(nextStatus, nextPriorityTier, nextPriorityReason, scheduledAt, attemptsCount, now, taskId);

  // 3. Log audit event
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, task_id, patient_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditId,
    taskId,
    existing.patientId,
    'OUTCOME_RECORDED',
    JSON.stringify({
      outcomeType: data.outcomeType,
      scheduledAppointmentAt: data.scheduledAppointmentAt,
      staffNotes: data.staffNotes,
    }),
    staffName,
    now
  );

  const updatedTask = getTaskById(taskId);
  if (!updatedTask) {
    throw new Error('Failed to retrieve updated task');
  }

  return { success: true, task: updatedTask, outcomeId };
}

export function recordSimulatedOutreach(
  taskId: string,
  event: SimulatedOutreachEvent
): { success: boolean; auditId: string; timestamp: string } {
  const db = getDatabase();
  const existing = getTaskById(taskId);
  if (!existing) {
    throw new Error(`Task ${taskId} not found`);
  }

  const now = new Date().toISOString();
  const staffName = event.staffName || 'Care Coordinator';
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Update task last_attempt_at and attempts_count
  db.prepare(`
    UPDATE follow_up_tasks
    SET last_attempt_at = ?, attempts_count = attempts_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(now, taskId);

  // Insert audit record specifically documenting simulation
  db.prepare(`
    INSERT INTO audit_logs (id, task_id, patient_id, action, details, performed_by, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    auditId,
    taskId,
    existing.patientId,
    'SIMULATED_OUTREACH_APPROVED',
    JSON.stringify({
      channel: event.channel,
      staffEdited: event.staffEdited,
      messageLength: event.messageContent.length,
      emailSubject: event.emailSubject || null,
      simulationNotice: 'Simulated outreach only: text copied to clipboard, no external SMS/email sent.',
    }),
    staffName,
    now
  );

  return { success: true, auditId, timestamp: now };
}

export function resetDemoCohort() {
  return resetDatabase();
}

export function getDailyOperationalSummary(dateParam: string = '2026-11-03'): import('../types').DailyOperationalSummary {
  const db = getDatabase();
  const isAllTime = dateParam === 'all';
  const targetDate = isAllTime ? '2026-11-03' : dateParam;

  // Active & Backlog Follow-Up Tasks
  const taskRows = db.prepare(`
    SELECT id, due_date, days_overdue, priority_tier, status, attending_provider, scheduled_appointment_at, patient_id
    FROM follow_up_tasks
  `).all() as Array<{
    id: string;
    due_date: string;
    days_overdue: number;
    priority_tier: string;
    status: string;
    attending_provider: string;
    scheduled_appointment_at: string | null;
    patient_id: string;
  }>;

  const dueTodayCount = taskRows.filter((t) => t.due_date === targetDate && t.status !== 'resolved').length;
  const overdueCount = taskRows.filter((t) => t.days_overdue > 0 && t.status !== 'resolved').length;
  const overdueHighCount = taskRows.filter((t) => t.days_overdue > 7 && t.status !== 'resolved').length;
  const overdueModerateCount = taskRows.filter(
    (t) => t.days_overdue >= 1 && t.days_overdue <= 7 && t.status !== 'resolved'
  ).length;
  const unresolvedCount = taskRows.filter((t) => t.status !== 'resolved').length;

  // Simulated Outreach Attempts (audit_logs)
  let outreachSql = `SELECT COUNT(*) as count FROM audit_logs WHERE action = 'SIMULATED_OUTREACH_APPROVED'`;
  const outreachParams: any[] = [];
  if (!isAllTime) {
    outreachSql += ` AND date(timestamp) = ?`;
    outreachParams.push(targetDate);
  }
  const outreachRow = db.prepare(outreachSql).get(...outreachParams) as { count: number } | undefined;
  const simulatedOutreachCount = outreachRow ? outreachRow.count : 0;

  // Outcomes distribution
  let outcomeSql = `SELECT outcome_type, COUNT(*) as count FROM follow_up_outcomes`;
  const outcomeParams: any[] = [];
  if (!isAllTime) {
    outcomeSql += ` WHERE date(recorded_at) = ?`;
    outcomeParams.push(targetDate);
  }
  outcomeSql += ` GROUP BY outcome_type`;
  const outcomeRows = db.prepare(outcomeSql).all(...outcomeParams) as Array<{ outcome_type: string; count: number }>;

  const getCount = (type: string) => outcomeRows.find((r) => r.outcome_type === type)?.count || 0;
  const appointmentsScheduledCount = getCount('appointment_scheduled');
  const noResponseCount = getCount('no_response');
  const unableToReachCount = getCount('unable_to_reach');
  const contactedCount = getCount('contacted');
  const declinedCount = getCount('declined');
  const followUpNeededCount = getCount('follow_up_needed');

  // Recent Activity Log
  let recentSql = `
    SELECT o.id, o.outcome_type, o.scheduled_appointment_at, o.staff_notes, o.recorded_at,
           p.full_name as patient_name, p.mrn
    FROM follow_up_outcomes o
    JOIN follow_up_tasks t ON o.follow_up_task_id = t.id
    JOIN patients p ON t.patient_id = p.id
  `;
  const recentParams: any[] = [];
  if (!isAllTime) {
    recentSql += ` WHERE date(o.recorded_at) = ?`;
    recentParams.push(targetDate);
  }
  recentSql += ` ORDER BY o.recorded_at DESC LIMIT 15`;
  const recentActivityRows = db.prepare(recentSql).all(...recentParams) as any[];

  // Confirmed Scheduled Appointments
  const scheduledAppointmentsRows = db.prepare(`
    SELECT t.id as task_id, t.attending_provider, t.scheduled_appointment_at,
           p.full_name as patient_name, p.mrn
    FROM follow_up_tasks t
    JOIN patients p ON t.patient_id = p.id
    WHERE (t.status = 'resolved' OR t.priority_tier = 'scheduled')
      AND t.scheduled_appointment_at IS NOT NULL
    ORDER BY t.scheduled_appointment_at ASC
  `).all() as any[];

  return {
    reportDate: targetDate,
    isAllTime,
    dueTodayCount,
    overdueCount,
    overdueHighCount,
    overdueModerateCount,
    unresolvedCount,
    simulatedOutreachCount,
    appointmentsScheduledCount,
    noResponseCount,
    unableToReachCount,
    contactedCount,
    declinedCount,
    followUpNeededCount,
    recentActivity: recentActivityRows.map((r) => ({
      id: r.id,
      patientName: r.patient_name,
      mrn: r.mrn,
      outcomeType: r.outcome_type,
      scheduledAppointmentAt: r.scheduled_appointment_at || undefined,
      staffNotes: r.staff_notes || undefined,
      recordedAt: r.recorded_at,
    })),
    scheduledAppointments: scheduledAppointmentsRows.map((r) => ({
      taskId: r.task_id,
      patientName: r.patient_name,
      mrn: r.mrn,
      provider: r.attending_provider,
      scheduledAt: r.scheduled_appointment_at,
    })),
  };
}
