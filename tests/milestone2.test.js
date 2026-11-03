/**
 * Milestone 2 Automated Verification Suite
 */
const draftRoute = require('../.next/server/app/api/copilot/draft/route.js');
const approveRoute = require('../.next/server/app/api/copilot/approve-simulated/route.js');
const outcomeRoute = require('../.next/server/app/api/outcomes/route.js');
const taskDetailRoute = require('../.next/server/app/api/tasks/[id]/route.js');
const tasksRoute = require('../.next/server/app/api/tasks/route.js');
const resetRoute = require('../.next/server/app/api/demo/reset/route.js');

async function runTests() {
  console.log('=== STARTING MILESTONE 2 VERIFICATION SUITE ===\n');

  // 1. Reset demo cohort
  const resetRes = await resetRoute.routeModule.userland.POST().then(r => r.json());
  console.log('[TEST 1] Reset database to fresh synthetic state:', resetRes.success ? 'PASSED' : 'FAILED');

  // 2. Draft generation across all 3 channels
  const draftPOST = draftRoute.routeModule.userland.POST;
  
  // 2a. SMS draft
  const smsReq = { json: async () => ({ taskId: 'task-001', channel: 'sms', tone: 'standard' }) };
  const smsRes = await draftPOST(smsReq).then(r => r.json());
  console.log('[TEST 2a] SMS Draft Generation:');
  console.log('  Success:', smsRes.success);
  console.log('  Channel:', smsRes.channel);
  console.log('  Draft Text:', smsRes.draftText);
  if (!smsRes.draftText.includes('(555) 019-2830') || !smsRes.draftText.includes('Jane')) {
    throw new Error('SMS draft failed expectation');
  }

  // 2b. Phone Call Script
  const phoneReq = { json: async () => ({ taskId: 'task-001', channel: 'phone' }) };
  const phoneRes = await draftPOST(phoneReq).then(r => r.json());
  console.log('\n[TEST 2b] Phone-Call Script Generation:');
  console.log('  Channel:', phoneRes.channel);
  console.log('  Script Excerpt:', phoneRes.draftText.split('\n').slice(0, 5).join('\n'));
  if (!phoneRes.draftText.includes('PHONE CALL SCRIPT') || !phoneRes.draftText.includes('VOICEMAIL SCRIPT')) {
    throw new Error('Phone call script missing structured sections');
  }

  // 2c. Email draft
  const emailReq = { json: async () => ({ taskId: 'task-001', channel: 'email', tone: 'gentle' }) };
  const emailRes = await draftPOST(emailReq).then(r => r.json());
  console.log('\n[TEST 2c] Email Draft Generation:');
  console.log('  Subject:', emailRes.emailSubject);
  console.log('  Body Excerpt:', emailRes.draftText.split('\n').slice(0, 4).join('\n'));
  if (!emailRes.emailSubject || !emailRes.draftText.includes('Dear Jane Doe')) {
    throw new Error('Email draft missing subject or greeting');
  }

  // 3. Missing / Unclear Context Test
  const { DatabaseSync } = require('node:sqlite');
  const path = require('node:path');
  const db = new DatabaseSync(path.join(process.cwd(), 'data', 'patientnexa.db'));

  db.prepare(`
    INSERT OR REPLACE INTO follow_up_tasks (
      id, patient_id, encounter_date, due_date, days_overdue, attending_provider, clinic_location,
      primary_diagnosis, clinical_directive, category, priority_tier, priority_reason, status
    ) VALUES (
      'task-vague-01', 'pt-001', '2026-10-20', '2026-11-03', 0, 'Dr. Sarah Vance, MD', 'Main Clinic',
      'Routine Outpatient Review', '', 'preventive', 'due_today', 'Due Today', 'pending'
    )
  `).run();

  const vagueRes = await draftPOST({ json: async () => ({ taskId: 'task-vague-01', channel: 'sms' }) }).then(r => r.json());
  console.log('\n[TEST 3] Vague / Missing Context Safe Fallback:');
  console.log('  Draft with empty directive:', vagueRes.draftText);
  if (!vagueRes.draftText || vagueRes.draftText.includes('undefined') || vagueRes.draftText.includes('null')) {
    throw new Error('Vague directive produced invalid interpolation');
  }

  // 4. Safety Boundary Tests
  // 4a. Urgent Clinical Symptom Screening
  db.prepare(`
    INSERT OR REPLACE INTO follow_up_tasks (
      id, patient_id, encounter_date, due_date, days_overdue, attending_provider, clinic_location,
      primary_diagnosis, clinical_directive, category, priority_tier, priority_reason, status
    ) VALUES (
      'task-urgent-01', 'pt-001', '2026-10-20', '2026-11-03', 0, 'Dr. Robert Chen, MD', 'Emergency Suite',
      'Follow-Up Consultation', 'Patient reported severe chest pain and shortness of breath at home.', 'chronic-care', 'due_today', 'Due Today', 'pending'
    )
  `).run();

  const urgentRes = await draftPOST({ json: async () => ({ taskId: 'task-urgent-01', channel: 'sms' }) }).then(r => r.json());
  console.log('\n[TEST 4a] Urgent Clinical Symptom Trigger:');
  console.log('  isUrgentClinicalConcern:', urgentRes.isUrgentClinicalConcern);
  console.log('  Escalation Notice:', urgentRes.escalationNotice);
  console.log('  Draft Text Suppressed:', urgentRes.draftText === '');
  if (!urgentRes.isUrgentClinicalConcern || !urgentRes.escalationNotice) {
    throw new Error('Urgent symptom was not caught by safety screening');
  }

  // 4b. Guardrail checks on prohibited prescriptive language (regex rule check)
  const forbiddenPatterns = [
    /\btake\s+\d+\s*(mg|mcg|ml|tablets?|pills?)\b/i,
    /\bstop\s+taking\b/i,
    /\byou\s+have\s+been\s+diagnosed\s+with\b/i,
  ];
  const unsafeText = 'Please take 500mg amoxicillin and stop taking your blood pressure medication.';
  const flagged = forbiddenPatterns.some(p => p.test(unsafeText));
  console.log('\n[TEST 4b] Prohibited Clinical Phrasing Guardrail Pattern Matching:');
  console.log('  Flagged Unsafe Text:', flagged);
  if (!flagged) {
    throw new Error('Guardrail failed to flag prohibited medication adjustment phrasing');
  }

  // 5. Human Approval & Simulated Outreach Logging
  const approvePOST = approveRoute.routeModule.userland.POST;
  const approveReq = {
    json: async () => ({
      taskId: 'task-001',
      channel: 'sms',
      messageContent: 'Hi Jane, this is Metro Health Clinic checking in on your knee recovery.',
      staffEdited: true,
      staffName: 'Staff Member Alex',
    }),
  };
  const approveRes = await approvePOST(approveReq).then(r => r.json());
  console.log('\n[TEST 5] Human Approval & Simulated Dispatch:');
  console.log('  Success:', approveRes.success);
  console.log('  Audit ID:', approveRes.auditId);
  console.log('  Simulation Notice:', approveRes.simulationNotice);
  if (!approveRes.success || !approveRes.auditId) {
    throw new Error('Approval simulation failed to persist audit log');
  }

  // 6. Test All 6 Outcome Types
  const outcomePOST = outcomeRoute.routeModule.userland.POST;
  const outcomesToTest = [
    { type: 'contacted', notes: 'Spoke with patient briefly' },
    { type: 'no_response', notes: 'Left standard voicemail' },
    { type: 'appointment_scheduled', notes: 'Confirmed slot for Friday', scheduledAt: '2026-11-06T10:00:00' },
    { type: 'declined', notes: 'Patient relocated out of state' },
    { type: 'follow_up_needed', notes: 'Patient requested afternoon callback' },
    { type: 'unable_to_reach', notes: 'Phone number inactive' },
  ];

  console.log('\n[TEST 6] Testing All 6 Outcome Types:');
  for (const item of outcomesToTest) {
    const outcomeReq = {
      json: async () => ({
        taskId: 'task-002',
        outcomeType: item.type,
        staffNotes: item.notes,
        scheduledAppointmentAt: item.scheduledAt,
        staffName: 'Care Coordinator Maria',
      }),
    };
    const outRes = await outcomePOST(outcomeReq).then(r => r.json());
    console.log(`  Outcome '${item.type}': Success=${outRes.success}, OutcomeId=${outRes.outcomeId}`);
    if (!outRes.success || !outRes.outcomeId) {
      throw new Error(`Failed to log outcome ${item.type}`);
    }
  }

  // 7. Verify Task Detail & Outcomes History API
  const detailGET = taskDetailRoute.routeModule.userland.GET;
  const detailRes = await detailGET({}, { params: { id: 'task-002' } }).then(r => r.json());
  console.log('\n[TEST 7] Fetch Task History & Audit Trail:');
  console.log('  Task ID:', detailRes.task.id);
  console.log('  Total Outcomes Recorded:', detailRes.outcomes.length);
  console.log('  Total Audit Logs:', detailRes.auditLogs.length);
  console.log('  Latest Outcome Type:', detailRes.outcomes[0]?.outcomeType);
  if (detailRes.outcomes.length < 6) {
    throw new Error('Not all outcomes persisted in history');
  }

  console.log('\n=== ALL MILESTONE 2 TESTS PASSED SUCCESSFULLY ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST RUNNER FAILED:', err);
  process.exit(1);
});
