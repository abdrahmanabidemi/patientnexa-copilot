'use client';

import React from 'react';
import {
  Calendar,
  User,
  Phone,
  MessageSquare,
  Mail,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Building,
} from 'lucide-react';
import { FollowUpTask } from '@/lib/types';

interface FollowUpCardProps {
  task: FollowUpTask;
  onSelect: (task: FollowUpTask) => void;
  isSelected: boolean;
}

export function FollowUpCard({ task, onSelect, isSelected }: FollowUpCardProps) {
  const patient = task.patient;

  // Calculate age from DOB
  const birthYear = new Date(patient.dateOfBirth).getFullYear();
  const currentYear = 2026;
  const age = currentYear - birthYear;

  // Channel icon and label
  const channelBadge = {
    sms: { icon: MessageSquare, label: 'SMS Preferred', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    phone: { icon: Phone, label: 'Phone Preferred', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    email: { icon: Mail, label: 'Email Preferred', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  }[patient.preferredChannel];

  const ChannelIcon = channelBadge.icon;

  // Priority tier badge styling
  const priorityStyling = {
    overdue_high: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      label: `🔴 Overdue: ${task.daysOverdue} Days`,
      icon: AlertTriangle,
      borderAccent: 'border-l-rose-500',
    },
    overdue_moderate: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      label: `🟡 Overdue: ${task.daysOverdue} Days`,
      icon: Clock,
      borderAccent: 'border-l-amber-500',
    },
    due_today: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      label: '🔵 Due Today (0 Days)',
      icon: Clock,
      borderAccent: 'border-l-blue-500',
    },
    scheduled: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      label: '🟢 Scheduled / Confirmed',
      icon: CheckCircle2,
      borderAccent: 'border-l-emerald-500',
    },
  }[task.priorityTier];

  return (
    <div
      onClick={() => onSelect(task)}
      className={`group relative rounded-xl border border-l-4 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md cursor-pointer ${
        priorityStyling.borderAccent
      } ${isSelected ? 'ring-2 ring-clinic-600 border-clinic-600 bg-clinic-50/20' : 'border-slate-200'}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {/* Patient Name & Core Metadata */}
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${priorityStyling.badge}`}
            >
              {priorityStyling.label}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${channelBadge.color}`}
            >
              <ChannelIcon className="h-3 w-3" />
              <span>{channelBadge.label}</span>
            </span>

            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
              {patient.mrn}
            </span>
          </div>

          <div className="pt-0.5">
            <h3 className="text-base font-bold text-slate-900 group-hover:text-clinic-700 transition-colors">
              {patient.fullName}{' '}
              <span className="text-xs font-normal text-slate-500">
                ({age}y · {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)})
              </span>
            </h3>
            <p className="text-xs font-medium text-slate-700 line-clamp-1">
              {task.primaryDiagnosis}
            </p>
          </div>
        </div>

        {/* Action Button Indicator */}
        <div className="hidden sm:flex items-center self-center pl-2">
          <button
            type="button"
            className="inline-flex items-center space-x-1 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-clinic-700 group-hover:bg-clinic-600 group-hover:text-white transition-colors"
          >
            <span>View Context</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Clinical Directive & Workflow Rule Note */}
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-600">
        <div className="flex items-start space-x-2">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
          <div className="flex-1">
            <span className="font-semibold text-slate-700">Directive: </span>
            <span className="italic text-slate-600">{task.clinicalDirective}</span>
          </div>
        </div>
      </div>

      {/* Footer Details: Date, Provider, and Transparent Workflow Rule Reason */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>Target: <strong className="text-slate-700">{task.dueDate}</strong></span>
          </span>

          <span className="flex items-center gap-1">
            <Building className="h-3.5 w-3.5 text-slate-400" />
            <span>{task.attendingProvider}</span>
          </span>
        </div>

        {/* Transparent Rule Placement Explanation */}
        <div className="w-full sm:w-auto text-[11px] font-medium text-slate-500 bg-slate-100 rounded px-2 py-0.5">
          Rule: {task.priorityReason}
        </div>
      </div>
    </div>
  );
}
