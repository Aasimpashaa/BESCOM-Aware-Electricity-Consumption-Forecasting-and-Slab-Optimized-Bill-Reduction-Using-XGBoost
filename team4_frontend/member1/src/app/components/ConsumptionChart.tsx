import { Card, CardContent } from './ui/card';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { ConsumptionData, PredictionResult } from '../types'; // FIX: Imported from types
import { format } from 'date-fns';
import { useMemo } from 'react';

// ── Sandstorm palette ──────────────────────────────────────────────
const SAND_GOLD   = '#D4A017';
const SIROCCO_RUST = '#B85C2A';
// FIX: Removed unused DUST_AMBER to prevent TS error

interface ConsumptionChartProps {
  historicalData: ConsumptionData[];
  predictions: PredictionResult[];
}

export function ConsumptionChart({ historicalData, predictions }: ConsumptionChartProps) {
  
  const chartData = useMemo(() => {
    const recentHistorical = historicalData.slice(-60);
    return [
      ...recentHistorical.map((d, index) => ({
        id: `hist-${index}`,
        date: format(new Date(d.date), 'MMM dd'),
        actual: d.units,
        predicted: undefined as number | undefined,
      })),
      ...predictions.map((p: any, index) => ({
        id: `pred-${index}`,
        // Safely fallback to current date if 'date' isn't explicitly in the PredictionResult interface
        date: format(new Date(p.date || Date.now()), 'MMM dd'),
        actual: undefined as number | undefined,
        predicted: p.predictedUnits || p.correctedUnits || 0, // Fallback safely
      })),
    ];
  }, [historicalData, predictions]);

  return (
    <Card className="border-0 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Sandstorm gradient header */}
      <div className="relative overflow-hidden px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2C1F0A 50%, #3D2B0F 100%)' }}
      >
        {/* Dust particle shimmer overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(ellipse at 20% 50%, #D4A017 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #C8860A 0%, transparent 50%)',
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#D4A017]" />
            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400/80">XGBoost Model</span>
          </div>
          <h3 className="font-black text-white tracking-tight">Consumption Forecast</h3>
          <p className="text-amber-200/60 text-xs mt-0.5">Historical (last 60 days) + 30-day prediction</p>
        </div>
      </div>

      <CardContent className="pt-5 pb-5">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sandActualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={SAND_GOLD}   stopOpacity={0.45} />
                <stop offset="95%" stopColor={SAND_GOLD}   stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sandPredictedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={SIROCCO_RUST} stopOpacity={0.35} />
                <stop offset="95%" stopColor={SIROCCO_RUST} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              opacity={0.08}
              stroke="hsl(var(--foreground))"
            />

            <XAxis
              dataKey="id"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 10))}
              tickFormatter={(value: string) => {
                const item = chartData.find(d => d.id === value);
                return item ? item.date : '';
              }}
            />

            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Units (kWh)',
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
              labelFormatter={(value: string) => {
                const item = chartData.find(d => d.id === value);
                return item ? item.date : value;
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {value}
                </span>
              )}
            />

            <Area
              type="monotone"
              dataKey="actual"
              stroke={SAND_GOLD}
              fill="url(#sandActualGrad)"
              strokeWidth={2.5}
              name="Actual Consumption"
              connectNulls
              dot={false}
              activeDot={{ r: 5, fill: SAND_GOLD, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="predicted"
              stroke={SIROCCO_RUST}
              fill="url(#sandPredictedGrad)"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              name="Predicted Consumption"
              connectNulls
              dot={false}
              activeDot={{ r: 5, fill: SIROCCO_RUST, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend footnote */}
        <div className="mt-3 flex items-center gap-5 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: SAND_GOLD }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full border-t-2 border-dashed" style={{ borderColor: SIROCCO_RUST }} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Forecast</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}