/**
 * Milestone 3 Automated Verification Suite
 */
const summaryRoute = require('../.next/server/app/api/summary/route.js');
const healthRoute = require('../.next/server/app/api/health/route.js');
const resetRoute = require('../.next/server/app/api/demo/reset/route.js');
const tasksRoute = require('../.next/server/app/api/tasks/route.js');
const outcomeRoute = require('../.next/server/app/api/outcomes/route.js');
const approveRoute = require('../.next/server/app/api/copilot/approve-simulated/route.js');

async function runMilestone3Tests() {
  console.log('=== STARTING MILESTONE 3 VERIFICATION SUITE ===\n');

  // 1. Healthcheck Endpoint Verification
  const healthGET = healthRoute.routeModule.userland.GET;
  const healthRes = await healthGET().then(r => r.json());
  console.log('[TEST 1] /api/health Endpoint:');
  console.log('  Status:', healthRes.status);
  console.log('  Service:', healthRes.service);
  console.log('  Timestamp:', healthRes.timestamp);
  if (healthRes.status !== 'healthy') {
    throw new Error('Health check endpoint failed');
  }

  // 2. Demo Reset & Fresh Database Seeding
  const resetPOST = resetRoute.routeModule.userland.POST;
  const resetRes = await resetPOST().then(r => r.json());
  console.log('\n[TEST 2] Demo Reset & Seeding:');
  console.log('  Success:', resetRes.success);
  console.log('  Seeded Count:', resetRes.count);
  if (!resetRes.success || resetRes.count !== 12) {
    throw new Error('Database seeding failed to initialize 12 cases');
  }

  // 3. Record a simulated outreach and an outcome to verify aggregation
  const approvePOST = approveRoute.routeModule.userland.POST;
  await approvePOST({
    json: async () => ({
      taskId: 'task-001',
      channel: 'sms',
      messageContent: 'Simulated follow-up SMS for Jane Doe',
      staffEdited: false,
      staffName: 'Coordinator Alex',
    }),
  });

  const outcomePOST = outcomeRoute.routeModule.userland.POST;
  await outcomePOST({
    json: async () => ({
      taskId: 'task-001',
      outcomeType: 'appointment_scheduled',
      scheduledAppointmentAt: '2026-11-06T10:00:00',
      staffNotes: 'Confirmed knee suture removal with Dr. Chen',
      staffName: 'Coordinator Alex',
    }),
  });

  // 4. Daily Operational Summary Endpoint Verification
  const summaryGET = summaryRoute.routeModule.userland.GET;
  
  // 4a. Today's Shift
  const todayReq = { nextUrl: new URL('http://localhost:3000/api/summary?date=2026-11-03') };
  const todayRes = await summaryGET(todayReq).then(r => r.json());
  console.log('\n[TEST 3a] Daily Operational Summary (Today 2026-11-03):');
  console.log('  Success:', todayRes.success);
  console.log('  Simulation Notice:', todayRes.simulationNotice);
  console.log('  Due Today Count:', todayRes.summary.dueTodayCount);
  console.log('  Overdue Count:', todayRes.summary.overdueCount);
  console.log('  Unresolved Backlog:', todayRes.summary.unresolvedCount);
  console.log('  Simulated Outreach Count:', todayRes.summary.simulatedOutreachCount);
  console.log('  Appointments Scheduled:', todayRes.summary.appointmentsScheduledCount);
  console.log('  Confirmed Appointments List Count:', todayRes.summary.scheduledAppointments.length);
  console.log('  Recent Logged Outcomes Count:', todayRes.summary.recentActivity.length);

  if (!todayRes.success || todayRes.summary.appointmentsScheduledCount < 1) {
    throw new Error('Daily summary failed to aggregate appointments scheduled');
  }

  // 4b. All-Time Summary
  const allReq = { nextUrl: new URL('http://localhost:3000/api/summary?date=all') };
  const allRes = await summaryGET(allReq).then(r => r.json());
  console.log('\n[TEST 3b] Operational Summary (All-Time):');
  console.log('  All-Time Flag:', allRes.summary.isAllTime);
  console.log('  Total Scheduled Appointments:', allRes.summary.scheduledAppointments.length);

  // 5. Verify Persistence Across Re-initialization
  // Re-read directly from SQLite database to confirm persistent table storage
  const { DatabaseSync } = require('node:sqlite');
  const path = require('node:path');
  const db = new DatabaseSync(path.join(process.cwd(), 'data', 'patientnexa.db'));
  const outcomeCount = db.prepare('SELECT COUNT(*) as count FROM follow_up_outcomes').get();
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
  console.log('\n[TEST 4] Database Persistence Across Sessions:');
  console.log('  Persisted Outcomes Count in SQLite file:', outcomeCount.count);
  console.log('  Persisted Audit Logs Count in SQLite file:', auditCount.count);

  if (outcomeCount.count < 1 || auditCount.count < 1) {
    throw new Error('Database persistence check failed');
  }

  console.log('\n=== ALL MILESTONE 3 VERIFICATION CHECKS PASSED ===');
}

runMilestone3Tests().catch(err => {
  console.error('\n❌ MILESTONE 3 TEST FAILED:', err);
  process.exit(1);
});
