import React from 'react';
import { SeverityBadge, ActionBadge, ThreatTypeBadge } from '../common/StatusBadge';
import { AlertCircle, ExternalLink, Clock } from 'lucide-react';

export default function RecentIncidentsTable({ recentThreats, onSelectIncident }) {
  const threats = recentThreats || [];

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Top Critical Incidents</h3>
            <p className="text-xs text-slate-400">
              High-priority intrusions requiring analyst verification and triage
            </p>
          </div>
        </div>
      </div>

      {threats.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          No critical security incidents recorded in recent activity.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">IP Origin</th>
                <th className="py-3 px-4">Threat Vector</th>
                <th className="py-3 px-4">Target Path</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4 text-right">Triage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {threats.map((threat) => (
                <tr
                  key={threat._id}
                  onClick={() => onSelectIncident(threat)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap flex items-center space-x-1.5 font-sans">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(threat.timestamp).toLocaleTimeString()}</span>
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{threat.ip}</td>
                  <td className="py-3 px-4">
                    <ThreatTypeBadge type={threat.threatType} />
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-sans">
                    <span className="font-mono text-xs text-blue-400 mr-1">{threat.method}</span>
                    {threat.path}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                      {threat.riskScore}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={threat.severity} />
                  </td>
                  <td className="py-3 px-4">
                    <ActionBadge action={threat.action} />
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(threat);
                      }}
                      className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
