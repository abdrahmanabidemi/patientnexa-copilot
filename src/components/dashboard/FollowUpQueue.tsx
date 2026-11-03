'use client';

import React from 'react';
import { FollowUpTask } from '@/lib/types';
import { FollowUpCard } from './FollowUpCard';
import { ShieldAlert, Info, Inbox } from 'lucide-react';

interface FollowUpQueueProps {
  tasks: FollowUpTask[];
  selectedTask: FollowUpTask | null;
  onSelectTask: (task: FollowUpTask) => void;
  onClearFilters: () => void;
  isLoading: boolean;
}

export function FollowUpQueue({
  tasks,
  selectedTask,
  onSelectTask,
  onClearFilters,
  isLoading,
}: FollowUpQueueProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-36 rounded-xl border border-slate-200 bg-white p-5 animate-pulse"
          >
            <div className="h-4 w-1/4 rounded bg-slate-200" />
            <div className="mt-3 h-5 w-1/2 rounded bg-slate-200" />
            <div className="mt-4 h-12 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          No follow-ups match current criteria
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm">
          Try clearing your search query or selecting a different status tier.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center rounded-lg bg-clinic-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-clinic-700 shadow-xs transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Transparent Queue Ordering Banner */}
      <div className="flex items-center space-x-2 rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2 text-xs text-sky-800">
        <Info className="h-4 w-4 shrink-0 text-sky-600" />
        <span>
          <strong>Rule-Based Queue:</strong> Ranked strictly by elapsed days overdue (Overdue &gt;7d &gt; 1–7d &gt; Due Today). No black-box clinical triage.
        </span>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <FollowUpCard
            key={task.id}
            task={task}
            onSelect={onSelectTask}
            isSelected={selectedTask?.id === task.id}
          />
        ))}
      </div>
    </div>
  );
}
