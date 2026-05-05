import { Card, CardContent } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BillBreakdown } from '../utils/bescomTariffs';
import { ShieldCheck, AlertTriangle, Skull } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface SlabBreakdownChartProps {
  billBreakdown: BillBreakdown;
  entitlement:   number;
  units:         number;
}

export function SlabBreakdownChart({ billBreakdown, entitlement, units }: SlabBreakdownChartProps) {
  const { t } = useLang();

  const SCENARIO_META = {
    ZERO_BILL:  { label: t.scenarioA, gradFrom: '#10b981', gradTo: '#059669', bg: 'bg-emerald-500/8', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', barColor: '#10b981', Icon: ShieldCheck },
    PARTIAL:    { label: t.scenarioB, gradFrom: '#f59e0b', gradTo: '#d97706', bg: 'bg-amber-500/8',   border: 'border-amber-500/30',   text: 'text-amber-600 dark:text-amber-400',   barColor: '#f59e0b', Icon: AlertTriangle },
    CLIFF_EDGE: { label: t.scenarioC, gradFrom: '#ef4444', gradTo: '#dc2626', bg: 'bg-red-500/8',     border: 'border-red-500/30',     text: 'text-red-600 dark:text-red-400',       barColor: '#ef4444', Icon: Skull },
  } as const;

  const scenario = (billBreakdown.scenario ?? 'CLIFF_EDGE') as keyof typeof SCENARIO_META;
  const meta     = SCENARIO_META[scenario];
  const Icon     = meta.Icon;

  const chartData = scenario === 'ZERO_BILL'
    ? [{ name: `Free (≤${entitlement}u)`, units: entitlement, amount: 0, color: '#10b981' }]
    : scenario === 'PARTIAL'
    ? [
        { name: `Free (≤${entitlement}u)`,           units: entitlement,         amount: 0,                       color: '#10b981' },
        { name: `Excess (${entitlement}–${units}u)`, units: units - entitlement, amount: billBreakdown.totalBill, color: '#f59e0b' },
      ]
    : billBreakdown.slabBreakdown.map((item, i) => ({
        name: item.slab, units: item.units, amount: Math.round(item.amount),
        color: ['#3b82f6', '#8b5cf6', '#f97316', '#ef4444'][i % 4],
      }));

  const netPayable = billBreakdown.netPayable ?? billBreakdown.totalBill;
  const grossTotal = billBreakdown.grossTotal ?? billBreakdown.totalBill;

  const labels: Record<string, string> = {
    ZERO_BILL: t.legendA, PARTIAL: t.legendB, CLIFF_EDGE: t.legendC,
  };

  const usagePct = Math.min(100, (units / Math.max(units, 200)) * 100);
  const entPct   = Math.min(100, (entitlement / Math.max(units, 200)) * 100);

  return (
    <Card className="border-0 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Scenario-colored top bar */}
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${meta.gradFrom}, ${meta.gradTo})` }} />

      {/* Header */}
      <div className={`px-5 py-4 border-b ${meta.border} ${meta.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${meta.bg} border ${meta.border}`}>
            <Icon className={`w-4 h-4 ${meta.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-black text-sm ${meta.text}`}>{meta.label}</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">
              {units} {t.units} · {t.entitlementLabel}: {entitlement}u · Cliff: 200u
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl font-black tracking-tighter ${meta.text}`}>
              ₹{netPayable.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t.netPayable}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>0</span>
            <span>{t.entitlementLabel} ({entitlement})</span>
            <span>{t.limitLabel}</span>
          </div>
          <div className="relative h-3 bg-background/50 rounded-full overflow-hidden border border-border/40">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/60 transition-all duration-700"
              style={{ width: `${entPct}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full opacity-70 transition-all duration-700"
              style={{
                width: `${usagePct}%`,
                background: `linear-gradient(90deg, ${meta.gradFrom}, ${meta.gradTo})`
              }}
            />
          </div>
        </div>
      </div>

      <CardContent className="pt-5 space-y-5">
        {/* Bar breakdown (non-zero) */}
        {scenario !== 'ZERO_BILL' && (
          <div className="space-y-2">
            {chartData.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">{item.name}</span>
                  <span className="font-medium text-muted-foreground">{item.units}u → ₹{item.amount}</span>
                </div>
                <div className="h-6 bg-muted/40 rounded-lg overflow-hidden border border-border/30">
                  <div
                    className="h-full flex items-center justify-center text-[10px] text-white font-black transition-all duration-700 rounded-lg"
                    style={{
                      width: `${Math.max(10, (item.units / Math.max(1, units)) * 100)}%`,
                      backgroundColor: item.color,
                    }}
                  >
                    {item.units > 0 && `₹${item.amount}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recharts */}
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={chartData} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.08} stroke="hsl(var(--foreground))" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} label={{ value: t.units, angle: -90, position: 'insideLeft', fontSize: 9 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tooltip-bg)',
                border: '1px solid var(--tooltip-border)',
                borderRadius: '12px',
                color: 'var(--tooltip-text)',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="units" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Bill summary */}
        <div className="border-t border-border/40 pt-4 space-y-2 text-sm">
          {scenario === 'ZERO_BILL' ? (
            <div className="text-center py-4">
              <div className="text-4xl font-black text-emerald-500 tracking-tighter">₹0</div>
              <div className="text-xs text-muted-foreground mt-1.5">
                {t.allUnitsCovered.replace('{n}', String(units)).replace('{e}', String(entitlement))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t.grossTotal}</span>
                <span className="font-bold text-foreground">₹{grossTotal.toLocaleString('en-IN')}</span>
              </div>
              {(billBreakdown.subsidyAmount ?? 0) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t.gjsSubsidy.replace('{e}', String(entitlement))}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">−₹{billBreakdown.subsidyAmount!.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t.fixedCharges}</span>
                <span className="font-bold text-foreground">₹{billBreakdown.fixedCharges.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">{t.stateDuty}</span>
                <span className="font-bold text-foreground">₹{billBreakdown.electricityDuty.toLocaleString('en-IN')}</span>
              </div>
              <div className={`flex justify-between font-black border-t border-border/40 pt-2 ${meta.text}`}>
                <span>{t.netPayableLabel}</span>
                <span className="text-lg">₹{netPayable.toLocaleString('en-IN')}</span>
              </div>
              {netPayable > 0 && (
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t.avgRate}</span>
                  <span className="font-bold">₹{billBreakdown.averageRate.toFixed(2)}/unit</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 3-scenario legend */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border/40">
          {(['ZERO_BILL', 'PARTIAL', 'CLIFF_EDGE'] as const).map(s => {
            const m = SCENARIO_META[s];
            const active = s === scenario;
            return (
              <div key={s} className={`rounded-xl p-2 text-center text-[10px] font-black leading-tight transition-all duration-200 ${
                active
                  ? `${m.bg} ${m.text} border ${m.border} shadow-sm`
                  : 'bg-muted/30 text-muted-foreground/60 border border-transparent'
              }`}>
                {labels[s]}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}