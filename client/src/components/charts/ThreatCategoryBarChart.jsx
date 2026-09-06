import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CATEGORY_COLORS = {
  'SQL Injection': '#A855F7',      // Purple
  'XSS': '#06B6D4',                // Cyan
  'Path Traversal': '#F59E0B',      // Amber
  'Command Injection': '#F43F5E',  // Rose
  'Behavioral Anomaly': '#EC4899', // Pink
  'Normal Traffic': '#64748B',     // Slate
  'Multiple Vectors': '#6366F1',   // Indigo
};

export default function ThreatCategoryBarChart({ threatTypes }) {
  const types = threatTypes || {};

  const nameMapping = {
    SQL_INJECTION: 'SQL Injection',
    XSS: 'XSS',
    PATH_TRAVERSAL: 'Path Traversal',
    COMMAND_INJECTION: 'Command Injection',
    BEHAVIORAL_ANOMALY: 'Behavioral Anomaly',
    NORMAL: 'Normal Traffic',
    MULTIPLE: 'Multiple Vectors',
  };

  const data = Object.entries(nameMapping)
    .map(([rawKey, label]) => ({
      name: label,
      count: types[rawKey] || 0,
      color: CATEGORY_COLORS[label] || '#3B82F6',
    }))
    .filter((item) => item.count > 0 || item.name !== 'Multiple Vectors');

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs font-mono">
          <div className="font-bold text-white mb-1 font-sans">{d.name}</div>
          <div className="text-cyan-400 font-semibold">{d.count.toLocaleString()} Recorded Events</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-2.5 mb-6">
        <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Threat Category Distribution</h3>
          <p className="text-xs text-slate-400">
            Breakdown of security telemetry across payload vectors and behavioural anomalies
          </p>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
