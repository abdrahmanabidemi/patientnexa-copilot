'use client';

import React, { useState } from 'react';
import { Activity, RotateCcw, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

interface NavbarProps {
  onResetDemo: () => Promise<void>;
  onOpenDailySummary: () => void;
}

export function Navbar({ onResetDemo, onOpenDailySummary }: NavbarProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      await onResetDemo();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-clinic-600 text-white shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                PatientNexa <span className="text-clinic-600 font-semibold">Copilot</span>
              </span>
              <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                v1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Metro Health Outpatient Care Coordination
            </p>
          </div>
        </div>

        {/* Status badges & Demo reset */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Maritime Online</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1 rounded-md bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 border border-sky-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>100% Synthetic Demo Cohort</span>
          </div>

          <button
            type="button"
            onClick={onOpenDailySummary}
            className="inline-flex items-center space-x-1.5 rounded-lg border border-clinic-200 bg-clinic-50 px-3 py-1.5 text-xs font-semibold text-clinic-700 hover:bg-clinic-100 hover:text-clinic-900 transition-colors shadow-xs"
          >
            <FileText className="h-3.5 w-3.5 text-clinic-600" />
            <span>Daily Summary</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            title="Reset database to initial synthetic demo cohort"
            className="inline-flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-clinic-500 focus:ring-offset-1 transition-colors disabled:opacity-50"
          >
            {resetSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Cohort Reset</span>
              </>
            ) : (
              <>
                <RotateCcw className={`h-3.5 w-3.5 text-slate-500 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting...' : 'Reset Demo Cohort'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
