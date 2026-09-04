import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import './ProgressChart.css';

const ERROR_TYPE_COLORS = {
  grammar: '#ef4444',
  vocabulary: '#f59e0b',
  word_order: '#8b5cf6',
  register: '#3b82f6',
  pronunciation_note: '#10b981',
  other: '#6b7280',
};

const ERROR_LABELS = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  word_order: 'Word Order',
  register: 'Register',
  pronunciation_note: 'Pronunciation',
  other: 'Other',
};

// Custom Tooltip for Fluency Trend AreaChart
function CustomFluencyTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">Session #{data.sessionIndex}</p>
        <p className="tooltip-score">Fluency: {data.fluencyScore}/100</p>
        {data.date && <p className="tooltip-date">{data.date}</p>}
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Error Taxonomy BarChart
function CustomErrorTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-title">{data.label}</p>
        <p className="tooltip-score">Errors: {data.count}</p>
      </div>
    );
  }
  return null;
}

export default function ProgressChart({ fluencyTrend = [], errorTypeBreakdown = {} }) {
  // 1. Prepare Fluency Trend Data for Recharts
  const trendData = fluencyTrend.map((pt) => ({
    name: `S${pt.sessionIndex}`,
    sessionIndex: pt.sessionIndex,
    fluencyScore: Math.max(0, Math.min(100, pt.fluencyScore || 0)),
    date: pt.date || null,
  }));

  // 2. Prepare Error Taxonomy Data for Recharts
  const errorData = Object.keys(ERROR_LABELS).map((key) => ({
    type: key,
    label: ERROR_LABELS[key],
    count: errorTypeBreakdown[key] || 0,
    color: ERROR_TYPE_COLORS[key] || '#6b7280',
  }));

  const totalErrors = errorData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="progress-charts-grid">
      {/* ─── 1. Fluency Trend Chart (Recharts AreaChart) ─── */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Fluency Score Progression</h3>
          <span className="chart-subtitle">Chronological score history (0–100)</span>
        </div>

        <div className="chart-body">
          {trendData.length === 0 ? (
            <div className="chart-empty-state">
              <p>No practice sessions recorded yet. Start practicing to see your trend!</p>
            </div>
          ) : (
            <div className="recharts-wrapper-container" style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fluencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomFluencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="fluencyScore"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#fluencyGradient)"
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#6366f1', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. Error Taxonomy Breakdown (Recharts BarChart) ─── */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Error Taxonomy Breakdown</h3>
          <span className="chart-subtitle">
            {totalErrors === 0 ? 'Zero errors recorded' : `${totalErrors} total errors identified`}
          </span>
        </div>

        <div className="chart-body">
          {totalErrors === 0 ? (
            <div className="chart-empty-state">
              <p>🎉 Excellent accuracy! No errors recorded in your practice history.</p>
            </div>
          ) : (
            <div className="recharts-wrapper-container" style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={errorData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<CustomErrorTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {errorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
