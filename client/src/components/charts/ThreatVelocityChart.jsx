import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

export default function ThreatVelocityChart({ 
  data = [], 
  height = 300, 
  primaryKey = 'attacks', 
  secondaryKey = 'blocked', 
  primaryLabel = 'Attack Attempts', 
  secondaryLabel = 'WAF Blocks' 
}) {
  return (
    <div className="w-full h-full font-sans" style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="threatGoldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="threatGreyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#888888" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#888888" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={primaryKey}
            name={primaryLabel}
            stroke="#D4AF37"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#threatGoldGrad)"
          />
          {data[0]?.[secondaryKey] !== undefined && (
            <Area
              type="monotone"
              dataKey={secondaryKey}
              name={secondaryLabel}
              stroke="#A1A1AA"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#threatGreyGrad)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
