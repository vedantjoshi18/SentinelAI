import React from 'react';
import { ShieldAlert, ShieldX, Eye, Gauge } from 'lucide-react';

export default function MetricCards({ stats }) {
  const total = stats?.totalEvents || 0;
  const blocked = stats?.blockedCount ?? stats?.actions?.BLOCK ?? 0;
  const monitored = stats?.monitoredCount ?? stats?.actions?.MONITOR ?? 0;
  const allowed = stats?.allowedCount ?? stats?.actions?.ALLOW ?? 0;
  const avgRisk = stats?.avgRiskScore ? Math.round(stats.avgRiskScore) : 0;

  const blockRate = total > 0 ? ((blocked / total) * 100).toFixed(1) : '0.0';

  const cards = [
    {
      title: 'Total Evaluated Events',
      value: total.toLocaleString(),
      subtitle: `${allowed.toLocaleString()} Clean Requests Allowed`,
      icon: ShieldAlert,
      color: 'blue',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-400',
    },
    {
      title: 'Intrusions Blocked',
      value: blocked.toLocaleString(),
      subtitle: `${blockRate}% Gateway Interception Rate`,
      icon: ShieldX,
      color: 'rose',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-400',
    },
    {
      title: 'Suspicious Monitored',
      value: monitored.toLocaleString(),
      subtitle: 'Triage Queue Telemetry Active',
      icon: Eye,
      color: 'amber',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      border: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-400',
    },
    {
      title: 'Average Risk Level',
      value: `${avgRisk}/100`,
      subtitle:
        avgRisk >= 60
          ? 'CRITICAL DEFENSE ACTIVE'
          : avgRisk >= 30
          ? 'ELEVATED SURVEILLANCE'
          : 'NOMINAL BASELINE',
      icon: Gauge,
      color: 'cyan',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      border: 'border-cyan-500/30',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`bg-[#111827] border ${card.border} rounded-2xl p-5 relative overflow-hidden transition hover:-translate-y-0.5 ${card.glow}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border border-white/5 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black tracking-tight text-white font-mono mb-1">
              {card.value}
            </div>
            <div className="text-xs text-slate-400 flex items-center font-medium">
              {card.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
