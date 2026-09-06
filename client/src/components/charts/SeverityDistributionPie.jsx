import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: '#F43F5E', // Rose
  HIGH: '#F97316',     // Orange
  MEDIUM: '#F59E0B',   // Amber
  LOW: '#10B981',      // Emerald
};

export default function SeverityDistributionPie({ severities }) {
  const sevs = severities || {};

  const data = [
    { name: 'Critical', key: 'CRITICAL', value: sevs.CRITICAL || 0, color: SEVERITY_COLORS.CRITICAL },
    { name: 'High', key: 'HIGH', value: sevs.HIGH || 0, color: SEVERITY_COLORS.HIGH },
    { name: 'Medium', key: 'MEDIUM', value: sevs.MEDIUM || 0, color: SEVERITY_COLORS.MEDIUM },
    { name: 'Low', key: 'LOW', value: sevs.LOW || 0, color: SEVERITY_COLORS.LOW },
  ].filter((item) => item.value > 0);

  const total = data.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs font-mono">
          <div className="font-bold text-white mb-1 font-sans">{d.name} Severity</div>
          <div className="text-white font-semibold">
            {d.value.toLocaleString()} Events ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center space-x-2.5 mb-6">
        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400">
          <PieIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white text-base">Severity Tier Breakdown</h3>
          <p className="text-xs text-slate-400">
            Proportion of threat events classified across low, medium, high, and critical risk
          </p>
        </div>
      </div>

      <div className="h-72 w-full flex items-center justify-center">
        {data.length === 0 ? (
          <div className="text-slate-500 text-xs">No severity metrics recorded yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => (
                  <span className="text-xs font-medium text-slate-300 mr-2">{value}</span>
                )}
              />
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
