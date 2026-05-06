import { Card, CardContent } from './ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { ConsumptionData } from '../types'; // FIX: Imported from types, not predictions
import { format } from 'date-fns';
import { useMemo } from 'react';

// ── Sandstorm palette ──────────────────────────────────────────────
const SAND_GOLD    = '#D4A017';
const DUNE_TAN     = '#E8C170';
// FIX: Removed unused DUST_AMBER to prevent TS 'noUnusedLocals' error

interface MonthlyTrendsChartProps {
  historicalData: ConsumptionData[];
}

export function MonthlyTrendsChart({ historicalData }: MonthlyTrendsChartProps) {
  const chartData = useMemo(() => {
    const monthlyData: { [key: string]: { units: number; count: number } } = {};

    historicalData.forEach(data => {
      // Safely handle both Date objects and ISO strings
      const monthKey = format(new Date(data.date), 'yyyy-MM');

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { units: 0, count: 0 };
      }
      monthlyData[monthKey].units += data.units;
      monthlyData[monthKey].count += 1;
    });

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        id: month,
        month: format(new Date(month + '-01'), 'MMM yyyy'),
        totalUnits: Math.round(data.units),
        avgDaily: Math.round((data.units / data.count) * 10) / 10,
      }))
      .slice(-12);
  }, [historicalData]);

  // Guard against empty chartData before calling Math.max/min
  const avgMonthly = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.totalUnits, 0) / chartData.length)
    : 0;
  const highestMonth = chartData.length > 0
    ? Math.max(...chartData.map(d => d.totalUnits))
    : 0;
  const lowestMonth = chartData.length > 0
    ? Math.min(...chartData.map(d => d.totalUnits))
    : 0;

  // Highlight the peak bar
  const maxUnits = highestMonth;

  return (
    <Card className="border-0 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Sandstorm gradient header */}
      <div
        className="relative overflow-hidden px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A1A05 50%, #3B2608 100%)' }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 70% 60%, #D4A017 0%, transparent 55%), radial-gradient(ellipse at 10% 30%, #C8860A 0%, transparent 45%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#D4A017]" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400/80">Last 12 Months</span>
          </div>
          <h3 className="font-black text-white tracking-tight">Historical Consumption Trends</h3>
          <p className="text-amber-200/60 text-xs mt-0.5">Monthly electricity consumption overview</p>
        </div>
      </div>

      <CardContent className="pt-5 pb-5 space-y-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barSize={28}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.07}
              stroke="hsl(var(--foreground))"
            />

            <XAxis
              dataKey="id"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              angle={-40}
              textAnchor="end"
              height={72}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string) => {
                const item = chartData.find(d => d.id === value);
                return item ? item.month : '';
              }}
            />

            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Total Units (kWh)',
                angle: -90,
                position: 'insideLeft',
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
                dx: -4,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg, rgba(26,20,8,0.97))',
                border: '1px solid #C8860A',
                borderRadius: '10px',
                color: 'var(--tooltip-text, #F5F0E8)',
                fontSize: '12px',
              }}
              cursor={{ fill: 'rgba(212,160,23,0.06)' }}
              labelFormatter={(value: string) => {
                const item = chartData.find(d => d.id === value);
                return item ? item.month : value;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {value}
                </span>
              )}
            />

            <Bar
              dataKey="totalUnits"
              name="Total Monthly Units"
              radius={[6, 6, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.totalUnits === maxUnits ? DUNE_TAN : SAND_GOLD}
                  fillOpacity={entry.totalUnits === maxUnits ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Monthly stats strip */}
        <div className="grid grid-cols-3 gap-3 border-t border-border/40 pt-4">
          {[
            { label: 'Avg Monthly', value: avgMonthly,    color: 'text-amber-500 dark:text-amber-400' },
            { label: 'Peak Month',  value: highestMonth,  color: 'text-orange-500 dark:text-orange-400' },
            { label: 'Low Month',   value: lowestMonth,   color: 'text-emerald-500 dark:text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-1 px-2 py-3 rounded-xl bg-background/40 border border-border/30 hover:border-border/60 transition-all duration-200">
              <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {stat.label}
              </div>
              <div className={`text-xl font-black tracking-tighter ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                units
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}