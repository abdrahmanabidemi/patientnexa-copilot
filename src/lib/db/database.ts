import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { SYNTHETIC_PATIENTS, SYNTHETIC_TASKS_DATA } from './synthetic-data';

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = process.env.SQLITE_DB_PATH || path.join(dbDir, 'patientnexa.db');
  const db = new DatabaseSync(dbPath);

  // Configure SQLite WAL mode for concurrency and reliability
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize Schema
  initSchema(db);

  // Check if seeding is needed
  const countRow = db.prepare('SELECT COUNT(*) as count FROM patients').get() as { count: number };
  if (!countRow || countRow.count === 0) {
    seedDatabase(db);
  }

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      mrn TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      preferred_channel TEXT NOT NULL,
      preferred_language TEXT NOT NULL,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follow_up_tasks (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      encounter_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      days_overdue INTEGER NOT NULL,
      attending_provider TEXT NOT NULL,
      clinic_location TEXT NOT NULL,
      primary_diagnosis TEXT NOT NULL,
      clinical_directive TEXT NOT NULL,
      category TEXT NOT NULL,
      priority_tier TEXT NOT NULL,
      priority_reason TEXT NOT NULL,
      status TEXT NOT NULL,
      last_attempt_at TEXT,
      attempts_count INTEGER NOT NULL DEFAULT 0,
      scheduled_appointment_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS follow_up_outcomes (
      id TEXT PRIMARY KEY,
      follow_up_task_id TEXT NOT NULL,
      outcome_type TEXT NOT NULL,
      scheduled_appointment_at TEXT,
      staff_notes TEXT,
      recorded_by_staff TEXT NOT NULL,
      recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follow_up_task_id) REFERENCES follow_up_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT,
      patient_id TEXT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function seedDatabase(db: DatabaseSync) {
  // Clear existing records
  db.exec('DELETE FROM follow_up_outcomes;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM follow_up_tasks;');
  db.exec('DELETE FROM patients;');

  // Insert Patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (
      id, mrn, full_name, date_of_birth, gender, phone, email,
      preferred_channel, preferred_language, emergency_contact_name, emergency_contact_phone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of SYNTHETIC_PATIENTS) {
    insertPatient.run(
      p.id,
      p.mrn,
      p.fullName,
      p.dateOfBirth,
      p.gender,
      p.phone,
      p.email,
      p.preferredChannel,
      p.preferredLanguage,
      p.emergencyContactName || null,
      p.emergencyContactPhone || null
    );
  }

  // Insert Tasks
  const insertTask = db.prepare(`
    INSERT INTO follow_up_tasks (
      id, patient_id, encounter_date, due_date, days_overdue,
      attending_provider, clinic_location, primary_diagnosis, clinical_directive,
      category, priority_tier, priority_reason, status, last_attempt_at,
      attempts_count, scheduled_appointment_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of SYNTHETIC_TASKS_DATA) {
    insertTask.run(
      t.id,
      t.patientId,
      t.encounterDate,
      t.dueDate,
      t.daysOverdue,
      t.attendingProvider,
      t.clinicLocation,
      t.primaryDiagnosis,
      t.clinicalDirective,
      t.category,
      t.priorityTier,
      t.priorityReason,
      t.status,
      t.lastAttemptAt || null,
      t.attemptsCount,
      (t as any).scheduledAppointmentAt || null
    );
  }

  // Insert initial audit record
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, task_id, patient_id, action, details, performed_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    'audit-seed-001',
    null,
    null,
    'SYSTEM_DEMO_SEED',
    `Seeded ${SYNTHETIC_PATIENTS.length} patients and ${SYNTHETIC_TASKS_DATA.length} follow-up tasks`,
    'System'
  );
}

export function resetDatabase() {
  const db = getDatabase();
  seedDatabase(db);
  return { success: true, count: SYNTHETIC_TASKS_DATA.length };
}
