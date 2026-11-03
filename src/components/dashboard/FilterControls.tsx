'use client';

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface FilterControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  providers: string[];
  totalResults: number;
  onClearFilters: () => void;
}

export function FilterControls({
  searchQuery,
  onSearchChange,
  selectedProvider,
  onProviderChange,
  selectedCategory,
  onCategoryChange,
  providers,
  totalResults,
  onClearFilters,
}: FilterControlsProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedProvider !== 'all' ||
    selectedCategory !== 'all';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by patient name, MRN (e.g. PN-4092), condition, or directive..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-clinic-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-clinic-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdowns & Reset */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Provider Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline font-medium">Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => onProviderChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-clinic-500 focus:outline-hidden"
            >
              <option value="all">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <span className="hidden sm:inline font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-300 focus:border-clinic-500 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="post-op">Post-Procedure</option>
              <option value="chronic-care">Chronic Care</option>
              <option value="lab-review">Lab / Diagnostic Review</option>
              <option value="preventive">Preventive Health</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center space-x-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Result counter summary */}
      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
        <span>
          Showing <strong className="font-semibold text-slate-900">{totalResults}</strong> follow-up{' '}
          {totalResults === 1 ? 'case' : 'cases'} in queue
        </span>
        <span className="text-[11px] text-slate-400">
          Ranked by transparent date rules (Days Overdue DESC)
        </span>
      </div>
    </div>
  );
}
