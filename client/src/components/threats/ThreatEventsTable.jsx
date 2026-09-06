import React from 'react';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../common/StatusBadge';
import { Clock, CheckCircle2, ChevronLeft, ChevronRight, Shield } from 'lucide-react';

export default function ThreatEventsTable({
  events,
  totalEvents,
  page,
  limit,
  onPageChange,
  onSelectEvent,
  isLoading,
}) {
  const totalPages = Math.max(1, Math.ceil(totalEvents / limit));

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white uppercase tracking-wider">
            Live Security Event Audit Log
          </span>
          <span className="px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 font-semibold">
            {totalEvents.toLocaleString()} Total Records
          </span>
        </div>
        {isLoading && (
          <span className="text-cyan-400 font-semibold animate-pulse">Syncing...</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Origin IP</th>
              <th className="py-3 px-4">Threat Type</th>
              <th className="py-3 px-4">Method & Path</th>
              <th className="py-3 px-4 text-center">Risk Score</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Enforcement</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {events.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                  {isLoading ? 'Loading security events...' : 'No security events matched your query filters.'}
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr
                  key={ev._id}
                  onClick={() => onSelectEvent(ev)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-sans flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{ev.ip}</td>
                  <td className="py-3 px-4">
                    <ThreatTypeBadge type={ev.threatType} />
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate font-sans">
                    <span className="font-mono text-xs font-bold text-blue-400 mr-1.5">
                      {ev.method}
                    </span>
                    {ev.path}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`font-bold px-2 py-0.5 rounded border ${
                        ev.riskScore >= 80
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                          : ev.riskScore >= 60
                          ? 'bg-orange-950/80 text-orange-300 border-orange-800'
                          : ev.riskScore >= 30
                          ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {ev.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={ev.severity} />
                  </td>
                  <td className="py-3 px-4">
                    <ActionBadge action={ev.action} />
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    {ev.resolved ? (
                      <span className="inline-flex items-center text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Resolved
                      </span>
                    ) : (
                      <span className="text-slate-500">Unresolved</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing {events.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
          {Math.min(page * limit, totalEvents)} of {totalEvents} records
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-bold text-white px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
