'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Building,
  FileText,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Copy,
  Check,
  Send,
  ShieldCheck,
  RotateCcw,
  MessageSquare,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import {
  ContactChannel,
  FollowUpOutcome,
  FollowUpTask,
  OutcomeType,
  ToneModifier,
} from '@/lib/types';

interface PatientDrawerProps {
  task: FollowUpTask | null;
  onClose: () => void;
  onTaskUpdated?: () => void;
}

const OUTCOME_OPTIONS: Array<{
  id: OutcomeType;
  label: string;
  description: string;
  badgeColor: string;
}> = [
  {
    id: 'appointment_scheduled',
    label: 'Appointment scheduled',
    description: 'Patient confirmed a follow-up visit date & time',
    badgeColor: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    description: 'Patient reached; follow-up discussed',
    badgeColor: 'border-blue-300 bg-blue-50 text-blue-800',
  },
  {
    id: 'follow_up_needed',
    label: 'Follow-up needed',
    description: 'Patient requested a callback or pending decision',
    badgeColor: 'border-amber-300 bg-amber-50 text-amber-800',
  },
  {
    id: 'no_response',
    label: 'No response',
    description: 'Voicemail left or message delivered with no reply',
    badgeColor: 'border-slate-300 bg-slate-50 text-slate-800',
  },
  {
    id: 'unable_to_reach',
    label: 'Unable to reach',
    description: 'Invalid phone, disconnected line, or full inbox',
    badgeColor: 'border-rose-300 bg-rose-50 text-rose-800',
  },
  {
    id: 'declined',
    label: 'Declined',
    description: 'Patient declined follow-up or care completed elsewhere',
    badgeColor: 'border-slate-300 bg-slate-100 text-slate-700',
  },
];

export function PatientDrawer({ task, onClose, onTaskUpdated }: PatientDrawerProps) {
  // Active channel & tone state
  const [selectedChannel, setSelectedChannel] = useState<ContactChannel>('sms');
  const [selectedTone, setSelectedTone] = useState<ToneModifier>('standard');

  // Draft state
  const [draftContent, setDraftContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isUrgentConcern, setIsUrgentConcern] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState<string | null>(null);
  const [draftSource, setDraftSource] = useState<'ai_gemini' | 'deterministic_template' | null>(null);
  const [hasStaffEdited, setHasStaffEdited] = useState(false);

  // Approval / Clipboard state
  const [isApproving, setIsApproving] = useState(false);
  const [simulationRecorded, setSimulationRecorded] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Outcome logging state
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeType>('contacted');
  const [appointmentDateTime, setAppointmentDateTime] = useState('');
  const [staffNotes, setStaffNotes] = useState('');
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false);
  const [outcomeSuccessMessage, setOutcomeSuccessMessage] = useState<string | null>(null);

  // Outcomes history
  const [pastOutcomes, setPastOutcomes] = useState<FollowUpOutcome[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Reset drawer state whenever selected task changes
  useEffect(() => {
    if (task) {
      setSelectedChannel(task.patient.preferredChannel);
      setSelectedTone('standard');
      setDraftContent('');
      setEmailSubject('');
      setIsUrgentConcern(false);
      setEscalationNotice(null);
      setDraftSource(null);
      setHasStaffEdited(false);
      setSimulationRecorded(false);
      setCopiedToClipboard(false);
      setSelectedOutcome('contacted');
      setAppointmentDateTime('');
      setStaffNotes('');
      setOutcomeSuccessMessage(null);

      // Fetch past outcomes history
      loadTaskHistory(task.id);

      // Auto-generate initial draft
      generateDraft(task, task.patient.preferredChannel, 'standard');
    }
  }, [task?.id]);

  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const patient = task.patient;
  const birthYear = new Date(patient.dateOfBirth).getFullYear();
  const currentYear = 2026;
  const age = currentYear - birthYear;

  const loadTaskHistory = async (taskId: string) => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch(`/api/tasks/${taskId}`);
      const data = await res.json();
      if (data.success && data.outcomes) {
        setPastOutcomes(data.outcomes);
      }
    } catch (err) {
      console.error('Failed to load task history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const generateDraft = async (
    currentTask: FollowUpTask,
    channel: ContactChannel,
    tone: ToneModifier
  ) => {
    try {
      setIsDrafting(true);
      setSimulationRecorded(false);
      const res = await fetch('/api/copilot/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTask.id, channel, tone }),
      });
      const data = await res.json();

      if (data.success) {
        setIsUrgentConcern(Boolean(data.isUrgentClinicalConcern));
        setEscalationNotice(data.escalationNotice || null);
        setDraftContent(data.draftText || '');
        setEmailSubject(data.emailSubject || '');
        setDraftSource(data.source);
        setHasStaffEdited(false);
      }
    } catch (err) {
      console.error('Failed to generate draft:', err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleChannelSwitch = (channel: ContactChannel) => {
    setSelectedChannel(channel);
    generateDraft(task, channel, selectedTone);
  };

  const handleToneSwitch = (tone: ToneModifier) => {
    setSelectedTone(tone);
    generateDraft(task, selectedChannel, tone);
  };

  const copyToClipboardSafely = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch (err) {
      console.warn('Clipboard write fallback triggered:', err);
    }
  };

  // Staff Approval & Simulated Outreach Action
  const handleApproveSimulated = async () => {
    if (!draftContent.trim()) return;

    try {
      setIsApproving(true);

      // 1. Copy draft to clipboard
      const textToCopy =
        selectedChannel === 'email' && emailSubject
          ? `Subject: ${emailSubject}\n\n${draftContent}`
          : draftContent;
      await copyToClipboardSafely(textToCopy);

      // 2. Record simulated outreach audit log in SQLite
      const res = await fetch('/api/copilot/approve-simulated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          channel: selectedChannel,
          messageContent: draftContent,
          emailSubject: selectedChannel === 'email' ? emailSubject : undefined,
          staffEdited: hasStaffEdited,
          staffName: 'Clinic Staff',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimulationRecorded(true);
        if (onTaskUpdated) onTaskUpdated();
        loadTaskHistory(task.id);
      }
    } catch (err) {
      console.error('Failed to approve simulated outreach:', err);
    } finally {
      setIsApproving(false);
    }
  };

  // Staff Outcome Recording Action
  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingOutcome(true);
      setOutcomeSuccessMessage(null);

      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          outcomeType: selectedOutcome,
          scheduledAppointmentAt:
            selectedOutcome === 'appointment_scheduled' ? appointmentDateTime : undefined,
          staffNotes: staffNotes.trim() || undefined,
          staffName: 'Clinic Staff',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOutcomeSuccessMessage(
          `Outcome "${selectedOutcome.replace(/_/g, ' ')}" recorded in database.`
        );
        setStaffNotes('');
        setAppointmentDateTime('');
        if (onTaskUpdated) onTaskUpdated();
        loadTaskHistory(task.id);
        setTimeout(() => setOutcomeSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Failed to record outcome:', err);
    } finally {
      setIsSubmittingOutcome(false);
    }
  };

  const priorityBadge = {
    overdue_high: {
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      text: `Critical Overdue: ${task.daysOverdue} Days`,
    },
    overdue_moderate: {
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      text: `Moderate Overdue: ${task.daysOverdue} Days`,
    },
    due_today: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      text: 'Due Today (0 Days Overdue)',
    },
    scheduled: {
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      text: 'Confirmed Scheduled / Resolved',
    },
  }[task.priorityTier];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="border-b border-slate-200 px-5 py-3.5 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-clinic-600 text-white shadow-xs">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {patient.fullName}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    ({age}y · {patient.gender})
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  MRN: <span className="font-mono font-medium text-slate-700">{patient.mrn}</span> · Follow-Up Copilot
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Urgent Clinical Alert (Safety Boundary) */}
            {isUrgentConcern && escalationNotice && (
              <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm animate-pulse">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                      Safety Warning: Potential Acute Clinical Concern
                    </h3>
                    <p className="mt-1 text-xs text-rose-800 leading-relaxed font-medium">
                      {escalationNotice}
                    </p>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white">
                        Standard Outreach Disabled
                      </span>
                      <span className="text-[11px] text-rose-700">
                        Follow clinic escalation protocol immediately.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Context & Directive Summary */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Encounter & Directive
                </span>
                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${priorityBadge.color}`}>
                  {priorityBadge.text}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400">Diagnosis / Reason:</span>
                  <p className="font-semibold text-slate-900">{task.primaryDiagnosis}</p>
                </div>
                <div>
                  <span className="text-slate-400">Attending Provider:</span>
                  <p className="font-medium text-slate-800">{task.attendingProvider}</p>
                </div>
                <div>
                  <span className="text-slate-400">Target Due Date:</span>
                  <p className="font-medium text-slate-800">
                    {task.dueDate} ({task.daysOverdue > 0 ? `${task.daysOverdue}d overdue` : 'Due today'})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Phone (Simulated):</span>
                  <p className="font-mono text-slate-800">{patient.phone}</p>
                </div>
              </div>

              {/* Doctor's Directive */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1">
                  <FileText className="h-3.5 w-3.5 text-clinic-600" />
                  <span>Attending Physician Directive Note:</span>
                </div>
                <p className="text-xs text-slate-800 italic leading-relaxed">
                  "{task.clinicalDirective || 'No specific directive provided. Safe administrative recall recommended.'}"
                </p>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-100 rounded px-2.5 py-1">
                <strong>Rule placement:</strong> {task.priorityReason}
              </div>
            </div>

            {/* Copilot Outreach Drafting Workspace */}
            {!isUrgentConcern && (
              <div className="rounded-xl border border-clinic-200 bg-white p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-clinic-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Outreach Draft Generator
                    </h3>
                  </div>

                  {/* Channel Toggle Tabs */}
                  <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => handleChannelSwitch('sms')}
                      className={`inline-flex items-center space-x-1 rounded-md px-2.5 py-1 transition-all ${
                        selectedChannel === 'sms'
                          ? 'bg-white text-clinic-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>SMS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChannelSwitch('phone')}
                      className={`inline-flex items-center space-x-1 rounded-md px-2.5 py-1 transition-all ${
                        selectedChannel === 'phone'
                          ? 'bg-white text-clinic-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Phone className="h-3 w-3" />
                      <span>Phone Script</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChannelSwitch('email')}
                      className={`inline-flex items-center space-x-1 rounded-md px-2.5 py-1 transition-all ${
                        selectedChannel === 'email'
                          ? 'bg-white text-clinic-700 shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </button>
                  </div>
                </div>

                {/* Tone Modifiers */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 font-medium">Tone:</span>
                  {(['standard', 'briefer', 'gentle', 'direct'] as ToneModifier[]).map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => handleToneSwitch(tone)}
                      className={`rounded-md border px-2 py-0.5 text-xs transition-colors capitalize ${
                        selectedTone === tone
                          ? 'border-clinic-500 bg-clinic-50 text-clinic-700 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => generateDraft(task, selectedChannel, selectedTone)}
                    disabled={isDrafting}
                    title="Regenerate draft"
                    className="ml-auto inline-flex items-center space-x-1 text-slate-500 hover:text-clinic-600 text-xs font-medium"
                  >
                    <RotateCcw className={`h-3 w-3 ${isDrafting ? 'animate-spin' : ''}`} />
                    <span>{isDrafting ? 'Drafting...' : 'Regenerate'}</span>
                  </button>
                </div>

                {/* Email Subject Line (if Email channel) */}
                {selectedChannel === 'email' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Subject:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => {
                        setEmailSubject(e.target.value);
                        setHasStaffEdited(true);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-xs font-medium text-slate-900 focus:bg-white focus:border-clinic-500 focus:outline-hidden"
                      placeholder="Email subject..."
                    />
                  </div>
                )}

                {/* Editable Message Draft Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <label className="font-semibold text-slate-700">
                      {selectedChannel === 'phone'
                        ? 'Phone-Call Talking Points (Outbound Staff Script):'
                        : 'Outreach Draft (Staff Review & Edit):'}
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {draftContent.length} chars
                      {hasStaffEdited && ' · (Edited by staff)'}
                    </span>
                  </div>

                  <textarea
                    rows={selectedChannel === 'phone' ? 8 : 5}
                    value={draftContent}
                    onChange={(e) => {
                      setDraftContent(e.target.value);
                      setHasStaffEdited(true);
                    }}
                    placeholder={isDrafting ? 'Generating safe outreach draft...' : 'Message draft...'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 leading-relaxed font-mono sm:font-sans focus:bg-white focus:border-clinic-500 focus:outline-hidden"
                  />
                </div>

                {/* Safety & Generation Source Indicator */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-t border-slate-100 pt-2 text-slate-500">
                  <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Administrative Recall Only (No Medical Diagnosis or Treatment Advice)</span>
                  </span>

                  <span className="text-slate-400">
                    Source:{' '}
                    {draftSource === 'ai_gemini'
                      ? 'Gemini 2.5 Flash'
                      : 'Deterministic Template'}
                  </span>
                </div>

                {/* Human Review & Simulated Outreach Action Bar */}
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                    <AlertCircle className="h-4 w-4 text-amber-700" />
                    <span>Human Approval Gate & Simulated Dispatch</span>
                  </div>

                  <p className="text-xs text-amber-800 leading-relaxed">
                    Review and confirm message above. Clicking below records staff approval in the audit trail and copies text to your clipboard.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleApproveSimulated}
                      disabled={isApproving || !draftContent.trim()}
                      className="inline-flex items-center space-x-1.5 rounded-lg bg-clinic-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-clinic-700 focus:outline-hidden disabled:opacity-50 transition-colors"
                    >
                      {copiedToClipboard ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-300" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Approve & Mark Sent (Simulation)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyToClipboardSafely(draftContent)}
                      className="inline-flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                      <span>Copy Text</span>
                    </button>
                  </div>

                  {simulationRecorded && (
                    <div className="rounded-lg bg-emerald-100 border border-emerald-300 p-2 text-xs text-emerald-900 font-medium flex items-center space-x-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                      <span>
                        Simulated outreach recorded in audit trail. <em>(No external SMS/email sent).</em> Please log the patient outcome below.
                      </span>
                    </div>
                  )}

                  <div className="text-[10px] text-amber-900/80">
                    ⚠️ <strong>Simulation Disclaimer:</strong> Maritime challenge sandbox environment. No actual SMS, telephone call, or email is dispatched.
                  </div>
                </div>
              </div>
            )}

            {/* Structured Outcome Logging Panel */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
                <ClipboardList className="h-4 w-4 text-clinic-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Record Follow-Up Outcome
                </h3>
              </div>

              {outcomeSuccessMessage && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 font-medium flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{outcomeSuccessMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveOutcome} className="space-y-4">
                {/* Outcome Selection Chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Outreach Outcome:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {OUTCOME_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOutcome(opt.id)}
                        className={`flex flex-col text-left p-2.5 rounded-lg border text-xs transition-all ${
                          selectedOutcome === opt.id
                            ? 'ring-2 ring-clinic-600 border-clinic-600 bg-clinic-50/50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{opt.label}</span>
                          {selectedOutcome === opt.id && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-clinic-600" />
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {opt.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Appointment Date/Time Input */}
                {selectedOutcome === 'appointment_scheduled' && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-emerald-900">
                      Confirmed Appointment Date & Time:
                    </label>
                    <input
                      type="datetime-local"
                      value={appointmentDateTime}
                      onChange={(e) => setAppointmentDateTime(e.target.value)}
                      required
                      className="w-full rounded-lg border border-emerald-300 bg-white p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {/* Optional Staff Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Staff Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={staffNotes}
                    onChange={(e) => setStaffNotes(e.target.value)}
                    placeholder="e.g. Left voicemail on mobile, patient requested morning clinic slot..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-clinic-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Logged as: <strong>Clinic Staff</strong> in SQLite
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmittingOutcome}
                    className="inline-flex items-center space-x-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{isSubmittingOutcome ? 'Saving...' : 'Save Outcome'}</span>
                  </button>
                </div>
              </form>

              {/* Past Outcomes History List */}
              {pastOutcomes.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Activity & Outcome History ({pastOutcomes.length})
                  </h4>
                  <div className="space-y-2">
                    {pastOutcomes.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800 capitalize">
                            {item.outcomeType.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.recordedAt).toLocaleString()}
                          </span>
                        </div>
                        {item.scheduledAppointmentAt && (
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Appointment Date: {item.scheduledAppointmentAt}
                          </div>
                        )}
                        {item.staffNotes && (
                          <div className="text-[11px] text-slate-600 italic">
                            "{item.staffNotes}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Patient ID: {patient.id} · Synthetic Demo Record
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
