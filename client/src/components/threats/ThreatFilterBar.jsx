import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';

export default function ThreatFilterBar({ filters, onFilterChange, onResetFilters }) {
  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by IP or target path..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Threat Type Filter */}
        <select
          value={filters.threatType || ''}
          onChange={(e) => onFilterChange('threatType', e.target.value)}
          className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
        >
          <option value="">All Threat Categories</option>
          <option value="SQL_INJECTION">SQL Injection</option>
          <option value="XSS">Cross-Site Scripting (XSS)</option>
          <option value="PATH_TRAVERSAL">Path Traversal / LFI</option>
          <option value="COMMAND_INJECTION">Command Injection</option>
          <option value="BEHAVIORAL_ANOMALY">Behavioral Anomaly</option>
          <option value="NORMAL">Normal Traffic</option>
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity || ''}
          onChange={(e) => onFilterChange('severity', e.target.value)}
          className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
        >
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {/* Action Filter */}
        <select
          value={filters.action || ''}
          onChange={(e) => onFilterChange('action', e.target.value)}
          className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
        >
          <option value="">All Enforcement Actions</option>
          <option value="BLOCK">BLOCK (403)</option>
          <option value="MONITOR">MONITOR</option>
          <option value="ALLOW">ALLOW</option>
        </select>

        {/* Resolution Filter */}
        <select
          value={filters.resolved || ''}
          onChange={(e) => onFilterChange('resolved', e.target.value)}
          className="bg-slate-900/80 border border-slate-700/60 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 transition cursor-pointer"
        >
          <option value="">All Triage Statuses</option>
          <option value="false">Unresolved</option>
          <option value="true">Resolved</option>
        </select>
      </div>

      {/* Reset Button */}
      <button
        onClick={onResetFilters}
        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl transition flex items-center space-x-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset</span>
      </button>
    </div>
  );
}
