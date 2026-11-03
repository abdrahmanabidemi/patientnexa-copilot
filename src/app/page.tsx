'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MetricsBar } from '@/components/dashboard/MetricsBar';
import { FilterControls } from '@/components/dashboard/FilterControls';
import { FollowUpQueue } from '@/components/dashboard/FollowUpQueue';
import { PatientDrawer } from '@/components/drawer/PatientDrawer';
import { DailySummaryModal } from '@/components/summary/DailySummaryModal';
import { DashboardMetrics, FollowUpTask } from '@/lib/types';
import { ShieldCheck, Sparkles, Layers } from 'lucide-react';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalQueue: 0,
    overdueHigh: 0,
    overdueModerate: 0,
    dueToday: 0,
    scheduledOrResolved: 0,
  });
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null);
  const [isDailySummaryOpen, setIsDailySummaryOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTier, setActiveTier] = useState<'all' | 'overdue' | 'due_today' | 'scheduled'>('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from API
  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (activeTier !== 'all') params.set('tier', activeTier);
      if (selectedProvider !== 'all') params.set('provider', selectedProvider);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        setMetrics(data.metrics);
        setProviders(data.providers);

        // Keep selectedTask updated if it's currently open
        if (selectedTask) {
          const updated = data.tasks.find((t: FollowUpTask) => t.id === selectedTask.id);
          if (updated) setSelectedTask(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeTier, selectedProvider, selectedCategory, selectedTask]);

  // Initial load & debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTasks();
    }, 150);
    return () => clearTimeout(handler);
  }, [searchQuery, activeTier, selectedProvider, selectedCategory]);

  // Demo Reset Action
  const handleResetDemo = async () => {
    const res = await fetch('/api/demo/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      setSelectedTask(null);
      await fetchTasks();
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveTier('all');
    setSelectedProvider('all');
    setSelectedCategory('all');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clinical App Header */}
      <Navbar
        onResetDemo={handleResetDemo}
        onOpenDailySummary={() => setIsDailySummaryOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Challenge Context & Safety Notice Banner */}
        <section className="rounded-xl border border-clinic-200 bg-clinic-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 rounded-lg bg-clinic-600 p-2 text-white">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  Outpatient Follow-Up Triage Dashboard
                </h1>
                <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
                  Maritime AI Agent Challenge foundation. Follow-ups are prioritized using{' '}
                  <strong className="text-slate-900">transparent date & recall window rules</strong>. All patient records are 100% synthetic.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-500 self-start sm:self-auto bg-white/80 rounded-lg px-3 py-1.5 border border-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Safety Rule: No autonomous actions</span>
            </div>
          </div>
        </section>

        {/* Operational Metrics Bar / Quick Filter Chips */}
        <section>
          <MetricsBar
            metrics={metrics}
            activeTier={activeTier}
            onSelectTier={setActiveTier}
          />
        </section>

        {/* Filter & Search Bar */}
        <section>
          <FilterControls
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedProvider={selectedProvider}
            onProviderChange={setSelectedProvider}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            providers={providers}
            totalResults={tasks.length}
            onClearFilters={handleClearFilters}
          />
        </section>

        {/* Follow-Up Queue List */}
        <section>
          <FollowUpQueue
            tasks={tasks}
            selectedTask={selectedTask}
            onSelectTask={setSelectedTask}
            onClearFilters={handleClearFilters}
            isLoading={isLoading}
          />
        </section>
      </main>

      {/* Patient Detail Context Drawer */}
      <PatientDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onTaskUpdated={fetchTasks}
      />

      {/* Daily Operational Summary Modal */}
      <DailySummaryModal
        isOpen={isDailySummaryOpen}
        onClose={() => setIsDailySummaryOpen(false)}
      />

      {/* Clinical Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>PatientNexa Copilot • Maritime AI Agent Challenge • Production Ready</p>
      </footer>
    </div>
  );
}
