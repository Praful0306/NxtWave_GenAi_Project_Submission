import { useState, useEffect } from 'react';
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
import { Card, EmptyState } from '../ui';
import { LineChart, BarChart3 } from 'lucide-react';

const ERROR_META = {
  grammar: { label: 'Grammar', color: '#dc2626' },
  vocabulary: { label: 'Vocabulary', color: '#ea580c' },
  word_order: { label: 'Word order', color: '#0d9488' },
  register: { label: 'Register', color: '#0891b2' },
  pronunciation_note: { label: 'Pronunciation', color: '#059669' },
  other: { label: 'Other', color: '#8a8175' },
};

/** Recharts needs literal colours, so read the resolved tokens and re-read on theme change. */
function useChartTheme() {
  const read = () => {
    const s = getComputedStyle(document.documentElement);
    return {
      grid: s.getPropertyValue('--line').trim() || 'rgba(0,0,0,0.08)',
      axis: s.getPropertyValue('--ink-faint').trim() || '#8a8175',
      brand: s.getPropertyValue('--brand').trim() || '#0f766e',
      surface: s.getPropertyValue('--surface-raised').trim() || '#fff',
      ink: s.getPropertyValue('--ink').trim() || '#1c1917',
    };
  };

  const [theme, setTheme] = useState(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function ChartTooltip({ active, payload, theme, render }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border border-line px-3 py-2 text-[12px] shadow-md"
      style={{ background: theme.surface, color: theme.ink }}
    >
      {render(payload[0].payload)}
    </div>
  );
}

export default function ProgressChart({ fluencyTrend = [], errorTypeBreakdown = {} }) {
  const theme = useChartTheme();

  const trend = fluencyTrend.map((p) => ({
    name: `S${p.sessionIndex}`,
    sessionIndex: p.sessionIndex,
    fluencyScore: Math.max(0, Math.min(100, p.fluencyScore || 0)),
    date: p.date || null,
  }));

  const errors = Object.entries(ERROR_META)
    .map(([key, m]) => ({ type: key, ...m, count: errorTypeBreakdown[key] || 0 }))
    .sort((a, b) => b.count - a.count);

  const totalErrors = errors.reduce((a, e) => a + e.count, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Fluency trend */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-display text-[15px] font-bold text-ink">Fluency over time</h3>
          <p className="mt-0.5 text-[12px] text-ink-soft">Score out of 100, session by session</p>
        </div>

        {trend.length === 0 ? (
          <EmptyState
            icon={LineChart}
            title="No sessions yet"
            description="Complete a Speak activity and your trend starts here."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="fluencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.brand} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={theme.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
                <XAxis dataKey="name" stroke={theme.axis} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  stroke={theme.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ stroke: theme.grid }}
                  content={
                    <ChartTooltip
                      theme={theme}
                      render={(d) => (
                        <>
                          <p className="font-semibold">Session {d.sessionIndex}</p>
                          <p className="tabular opacity-80">Fluency {d.fluencyScore}/100</p>
                          {d.date && <p className="opacity-60">{d.date}</p>}
                        </>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="fluencyScore"
                  stroke={theme.brand}
                  strokeWidth={2.5}
                  fill="url(#fluencyFill)"
                  activeDot={{ r: 5, fill: theme.brand, stroke: theme.surface, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Error breakdown */}
      <Card className="p-5">
        <div className="mb-4">
          <h3 className="font-display text-[15px] font-bold text-ink">What trips you up</h3>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            {totalErrors === 0 ? 'No errors recorded yet' : `${totalErrors} corrections across your sessions`}
          </p>
        </div>

        {totalErrors === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Nothing flagged yet"
            description="Errors are grouped by type once you have a few sessions in."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errors} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={theme.axis}
                  fontSize={11}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  stroke={theme.axis}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={92}
                />
                <Tooltip
                  cursor={{ fill: theme.grid }}
                  content={
                    <ChartTooltip
                      theme={theme}
                      render={(d) => (
                        <>
                          <p className="font-semibold">{d.label}</p>
                          <p className="tabular opacity-80">
                            {d.count} correction{d.count === 1 ? '' : 's'}
                          </p>
                        </>
                      )}
                    />
                  }
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {errors.map((e) => (
                    <Cell key={e.type} fill={e.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend doubles as a text readout so meaning isn't carried by colour alone */}
        {totalErrors > 0 && (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-3">
            {errors
              .filter((e) => e.count > 0)
              .map((e) => (
                <li key={e.type} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <span className="size-2.5 rounded-sm" style={{ background: e.color }} aria-hidden="true" />
                  {e.label}
                  <span className="tabular font-semibold text-ink">{e.count}</span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
