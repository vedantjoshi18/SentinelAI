import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';

const LUXURY_PALETTE = ['#D4AF37', '#18181B', '#71717A', '#A1A1AA', '#E4E4E7', '#B45309'];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-luxury-surface border border-luxury-border shadow-elevated rounded-xl p-2.5 font-sans text-xs">
        <p className="font-medium text-luxury-ink">{data.name}</p>
        <p className="text-luxury-muted mt-0.5">
          <span className="font-semibold text-luxury-ink">
            {data.value.toLocaleString()} events
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export default function DistributionPie({ data = [], height = 220, innerRadius = 55, outerRadius = 80 }) {
  return (
    <div className="w-full flex flex-col items-center justify-center font-sans">
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color || LUXURY_PALETTE[index % LUXURY_PALETTE.length]}
                  stroke="var(--luxury-surface, #FFFFFF)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-luxury-border/60">
        {data.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-luxury-muted">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: entry.color || LUXURY_PALETTE[idx % LUXURY_PALETTE.length],
              }}
            />
            <span className="truncate">{entry.name}</span>
            <span className="ml-auto font-medium text-luxury-ink">
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
