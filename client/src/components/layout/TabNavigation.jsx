import React from 'react';
import { LayoutDashboard, ShieldAlert, BarChart3, Terminal } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'SOC Overview', icon: LayoutDashboard },
  { id: 'threats', label: 'Threat Event Feed', icon: ShieldAlert },
  { id: 'analytics', label: 'Attack Visualizations', icon: BarChart3 },
  { id: 'sandbox', label: 'Threat Sandbox', icon: Terminal },
];

export default function TabNavigation({ activeTab, onSelectTab, eventCount }) {
  return (
    <div className="border-b border-slate-800 bg-[#0F172A]/90 px-6">
      <nav className="flex space-x-2 -mb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
                isActive
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span>{tab.label}</span>
              {tab.id === 'threats' && typeof eventCount === 'number' && eventCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {eventCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
