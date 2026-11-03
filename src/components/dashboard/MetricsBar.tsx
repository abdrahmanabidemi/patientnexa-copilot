'use client';

import React from 'react';
import { AlertCircle, Clock, CalendarCheck, CheckCircle, ListFilter } from 'lucide-react';
import { DashboardMetrics } from '@/lib/types';

interface MetricsBarProps {
  metrics: DashboardMetrics;
  activeTier: 'all' | 'overdue' | 'due_today' | 'scheduled';
  onSelectTier: (tier: 'all' | 'overdue' | 'due_today' | 'scheduled') => void;
}

export function MetricsBar({ metrics, activeTier, onSelectTier }: MetricsBarProps) {
  const cards = [
    {
      id: 'all' as const,
      label: 'Total Queue',
      subtext: 'Active outpatient follow-ups',
      count: metrics.totalQueue,
      icon: ListFilter,
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      activeRing: 'ring-2 ring-slate-800 border-slate-800 bg-slate-50',
    },
    {
      id: 'overdue' as const,
      label: 'Overdue Follow-Ups',
      subtext: `${metrics.overdueHigh} critical (>7d) · ${metrics.overdueModerate} moderate (1-7d)`,
      count: metrics.overdueHigh + metrics.overdueModerate,
      icon: AlertCircle,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      activeRing: 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/50',
    },
    {
      id: 'due_today' as const,
      label: 'Due Today',
      subtext: 'Target follow-up date is today',
      count: metrics.dueToday,
      icon: Clock,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      activeRing: 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50',
    },
    {
      id: 'scheduled' as const,
      label: 'Scheduled / Resolved',
      subtext: 'Appointments confirmed or closed',
      count: metrics.scheduledOrResolved,
      icon: CheckCircle,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeRing: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeTier === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectTier(card.id)}
            className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-all hover:shadow-xs focus:outline-hidden ${
              isActive
                ? card.activeRing
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">
                {card.label}
              </span>
              <div className={`rounded-lg border p-1.5 ${card.badgeColor}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold tracking-tight text-slate-900">
                {card.count}
              </div>
              <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                {card.subtext}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
