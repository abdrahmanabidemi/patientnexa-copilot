'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  Send,
  CalendarCheck,
  PhoneOff,
  Inbox,
  Copy,
  Check,
  CheckCircle2,
  FileText,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { DailyOperationalSummary } from '@/lib/types';

interface DailySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailySummaryModal({ isOpen, onClose }: DailySummaryModalProps) {
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [summary, setSummary] = useState<DailyOperationalSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedBriefing, setCopiedBriefing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, dateFilter]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const param = dateFilter === 'all' ? 'all' : '2026-11-03';
      const res = await fetch(`/api/summary?date=${param}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyBriefingToClipboard = async () => {
    if (!summary) return;

    const report = `# PatientNexa Copilot — Daily Operational Summary
Date: ${summary.isAllTime ? 'All Time (Aggregated)' : summary.reportDate}
Generated for: Metro Health Clinic Outpatient Care Coordination

## Operational Triage & Queue Metrics
• Due Today: ${summary.dueTodayCount} patients
• Total Overdue: ${summary.overdueCount} patients (Critical >7d: ${summary.overdueHighCount}, Moderate 1-7d: ${summary.overdueModerateCount})
• Total Unresolved Backlog: ${summary.unresolvedCount} patients

## Outreach & Staff Activity (SIMULATED)
• Simulated Outreach Dispatches: ${summary.simulatedOutreachCount}
• Appointments Scheduled: ${summary.appointmentsScheduledCount}
• Contacted (Pending Scheduling): ${summary.contactedCount}
• No Response / Voicemail: ${summary.noResponseCount}
• Unable to Reach / Inactive: ${summary.unableToReachCount}
• Declined / Care Elsewhere: ${summary.declinedCount}
• Follow-Up Needed / Callbacks: ${summary.followUpNeededCount}

*Note: All outreach metrics represent simulated staff approval in demo sandbox environment.*
`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(report);
      } else {
        const ta = document.createElement('textarea');
        ta.value = report;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setCopiedBriefing(true);
      setTimeout(() => setCopiedBriefing(false), 3000);
    } catch (err) {
      console.warn('Clipboard write fallback triggered:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="border-b border-slate-200 px-5 py-4 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-clinic-600 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daily Operational Follow-Up Summary
              </h2>
              <p className="text-xs text-slate-500">
                Metro Health Clinic • Outpatient Care Coordination
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={copyBriefingToClipboard}
              className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {copiedBriefing ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Report</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Simulation Disclaimer Notice */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs text-sky-900 flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
            <span>
              <strong>Simulation Mode:</strong> All outreach metrics reflect staff-approved simulated dispatches in the demo sandbox. No real external telephony or SMS messages are sent.
            </span>
          </div>

          {/* Date Filter Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Reference Date: <strong className="text-slate-900 font-mono">2026-11-03</strong></span>
            </div>

            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  dateFilter === 'today'
                    ? 'bg-white text-clinic-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Today's Shift
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={`rounded-md px-2.5 py-1 transition-all ${
                  dateFilter === 'all'
                    ? 'bg-white text-clinic-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All-Time Total
              </button>
            </div>
          </div>

          {isLoading || !summary ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Aggregating operational metrics from SQLite database...
            </div>
          ) : (
            <>
              {/* Primary Metric KPI Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Due Today</span>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {summary.dueTodayCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">Target recall date is today</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Overdue</span>
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-rose-700">
                    {summary.overdueCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {summary.overdueHighCount} critical (&gt;7d) · {summary.overdueModerateCount} moderate
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Remaining Backlog</span>
                    <Inbox className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">
                    {summary.unresolvedCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">Active unresolved follow-ups</p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-emerald-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Appts Scheduled</span>
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-emerald-800">
                    {summary.appointmentsScheduledCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-emerald-700">Confirmed patient visits</p>
                </div>

                <div className="rounded-xl border border-clinic-200 bg-clinic-50/40 p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-clinic-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Simulated Outreach</span>
                    <Send className="h-4 w-4 text-clinic-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-clinic-800">
                    {summary.simulatedOutreachCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-clinic-700">Staff-approved dispatches</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Unreachable / No Reply</span>
                    <PhoneOff className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-slate-800">
                    {summary.noResponseCount + summary.unableToReachCount}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {summary.noResponseCount} voicemails · {summary.unableToReachCount} unreachable
                  </p>
                </div>
              </div>

              {/* Confirmed Appointments Section */}
              {summary.scheduledAppointments.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                    Confirmed Appointments Booked ({summary.scheduledAppointments.length})
                  </h3>
                  <div className="divide-y divide-slate-100 text-xs">
                    {summary.scheduledAppointments.map((appt) => (
                      <div key={appt.taskId} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-900">{appt.patientName}</span>{' '}
                          <span className="font-mono text-[11px] text-slate-400">({appt.mrn})</span>
                          <p className="text-[11px] text-slate-500">{appt.provider}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-medium font-mono text-[11px]">
                            {appt.scheduledAt}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logged Outcomes Activity History */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Recent Logged Outcomes ({summary.recentActivity.length})
                </h3>
                {summary.recentActivity.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No outcomes logged for this date period yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {summary.recentActivity.map((act) => (
                      <div key={act.id} className="py-2 flex items-start justify-between gap-3">
                        <div>
                          <span className="font-semibold text-slate-900">{act.patientName}</span>{' '}
                          <span className="font-mono text-[11px] text-slate-400">({act.mrn})</span>
                          {act.staffNotes && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5">
                              "{act.staffNotes}"
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 capitalize">
                            {act.outcomeType.replace(/_/g, ' ')}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(act.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Source: Persistent SQLite Store (`data/patientnexa.db`)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
}
