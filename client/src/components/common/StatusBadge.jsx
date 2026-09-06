import React from 'react';

export function SeverityBadge({ severity }) {
  const level = (severity || 'LOW').toUpperCase();

  const styles = {
    CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.15)]',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]',
    LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${
        styles[level] || styles.LOW
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {level}
    </span>
  );
}

export function ActionBadge({ action }) {
  const act = (action || 'ALLOW').toUpperCase();

  const styles = {
    BLOCK: 'bg-red-950/60 text-red-400 border-red-800/60',
    MONITOR: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    ALLOW: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
        styles[act] || styles.ALLOW
      }`}
    >
      {act}
    </span>
  );
}

export function ThreatTypeBadge({ type }) {
  const t = (type || 'NORMAL').toUpperCase();

  const styles = {
    SQL_INJECTION: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    XSS: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    PATH_TRAVERSAL: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    COMMAND_INJECTION: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    BEHAVIORAL_ANOMALY: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    NORMAL: 'bg-slate-700/30 text-slate-300 border-slate-700/50',
    MULTIPLE: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${
        styles[t] || styles.NORMAL
      }`}
    >
      {t.replace(/_/g, ' ')}
    </span>
  );
}
