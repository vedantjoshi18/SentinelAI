import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-luxury-surface border border-luxury-border shadow-elevated rounded-xl p-3 font-sans text-xs">
        <p className="font-semibold text-luxury-ink mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-luxury-muted py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}:</span>
            </span>
            <span className="font-semibold text-luxury-ink">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function PerformanceChart({
  data = [],
  height = 280,
  dataKey1 = 'visitors',
  name1 = 'Attack Attempts',
  dataKey2 = 'sessions',
  name2 = 'Auto-Mitigated',
}) {
  return (
    <div className="w-full h-full font-sans" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={6}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--luxury-border, #E5E5E0)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--luxury-muted, #71717A)', fontSize: 11 }}
            dy={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--luxury-muted, #71717A)', fontSize: 11 }}
            tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey={dataKey1}
            name={name1}
            fill="#18181B"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
          {data[0]?.[dataKey2] !== undefined && (
            <Bar
              dataKey={dataKey2}
              name={name2}
              fill="#D4AF37"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
