import { useState, useEffect, useRef } from 'react';
import { UserData, ApplianceData, UsageData, PredictionResult } from '../types';
import { generatePrediction } from '../utils/predictions';
import { calculateBESCOMBillWithEntitlement } from '../utils/bescomTariffs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MetricCard } from './MetricCard';
import { SlabBreakdownChart } from './SlabBreakdownChart';
import { BillCalculator } from './BillCalculator';
import { RecommendationsList } from './RecommendationsList';
import { LanguageToggle } from './LanguageToggle';
import { useLang } from '../context/LanguageContext';
import {
  Zap, TrendingUp, AlertCircle, CheckCircle,
  Settings, BarChart3, Moon, Sun, Activity, Sparkles, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { APPLIANCES } from '../data/appliances';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Cell,
} from 'recharts';

interface DashboardProps {
  userData: UserData;
  applianceData: ApplianceData;
  usageData: UsageData;
  onEditSetup: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const steps   = 60;
    const stepVal = target / steps;
    let current   = 0;
    const timer   = setInterval(() => {
      current += stepVal;
      if (current >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

function ConfidenceBadge({ units }: { units: number }) {
  const { t } = useLang();
  const margin  = Math.round(units * 0.08);
  const low     = units - margin;
  const high    = units + margin;
  const pct     = Math.max(0, Math.min(100, Math.round(100 - (margin / units) * 100)));
  return (
    <div className="mt-4 bg-background/40 backdrop-blur-sm rounded-2xl p-4 border border-border/40 shadow-inner">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-black text-foreground uppercase tracking-[0.15em]">
          {t.confidenceRange} — {pct}{t.confidence}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground font-black">{low} {t.units}</span>
        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden relative border border-border/40">
          <div className="absolute inset-0 bg-primary/15 rounded-full" />
          <div
            className="absolute top-0 bottom-0 w-2 bg-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
        <span className="text-[11px] text-muted-foreground font-black">{high} {t.units}</span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">
        {t.mostLikely} <strong className="text-foreground">{units} {t.units}</strong> ({t.plusMinus}{margin} {t.units})
      </p>
    </div>
  );
}

// Helper function to map dataset names to translation keys
function getApplianceTranslationKey(name: string): string {
  const map: Record<string, string> = {
    'AC (1 Ton)': 'ac1Ton',
    'AC (1.5 Ton)': 'ac15Ton',
    'Geyser': 'geyserLabel',
    'Washing Machine': 'wmLabel',
    'Microwave': 'mwLabel',
    'Air Cooler': 'coolerLabel',
    'Iron': 'ironLabel'
  };
  return map[name] || name;
}

export function Dashboard({
  userData, applianceData, usageData, onEditSetup, darkMode, onToggleDark,
}: DashboardProps) {
  const { t } = useLang();
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const trendsRef    = useInView();
  const breakdownRef = useInView();

  useEffect(() => {
    generatePrediction(userData, applianceData, usageData)
      .then((p) => setPrediction(p))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userData, applianceData, usageData]);

  const safeUnits        = prediction?.correctedUnits ?? 0;
  const entitlement      = userData.entitlement ?? 100;
  const safeBillBreakdown = calculateBESCOMBillWithEntitlement(safeUnits, entitlement);

  const animUnits = useCountUp(safeUnits);
  const animBill  = useCountUp(safeBillBreakdown.totalBill);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
        <div className="text-center flex flex-col items-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-border/40" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-foreground font-black text-lg tracking-tight">{t.analysing}</p>
            <p className="text-sm text-muted-foreground mt-1 font-medium">{t.xgboostRunning}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center bg-destructive/8 border border-destructive/20 p-8 rounded-2xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
          <p className="font-black text-destructive">{error ?? 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  const historicalAvg =
    userData.historicalBills.reduce((sum, b) => sum + b.units, 0) /
    Math.max(1, userData.historicalBills.length);

  const isFree   = safeBillBreakdown.scenario === 'ZERO_BILL';
  const trendDir = prediction.correctedUnits > historicalAvg ? 'up' : 'down';
  const trendPct = Math.abs(Math.round(((prediction.correctedUnits - historicalAvg) / historicalAvg) * 100));

  const counts = userData.baseloadCounts ?? { num_fans: 3, num_fridges: 1, num_tvs: 1, num_lights: 6 };
  const baseloadMonthly = parseFloat((
    (counts.num_fans    * 0.45       +
     counts.num_fridges * 0.9        +
     counts.num_tvs     * 0.4        +
     counts.num_lights  * (0.009 * 6) +
     0.1) * 30
  ).toFixed(1));

  const trendsData = [
    ...userData.historicalBills.map((b, idx) => ({
      month: `${t.monthChartLabel ?? 'Month'} ${idx + 1}`,
      units: b.units,
      type: 'historical',
    })),
    {
      month: `${t.nextMonthChart ?? 'Next'} ▶`,
      units: prediction.correctedUnits,
      type: 'predicted',
    },
  ];

  const consumptionBreakdown = [
    { name: t.baseload,       value: baseloadMonthly,                                       fill: 'hsl(var(--primary))' },
    { name: t.heavyAppliances, value: Math.max(0, prediction.correctedUnits - baseloadMonthly), fill: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 pb-20">

      {/* ── Sticky Header ── */}
      <header className="bg-background/80 backdrop-blur-xl border-b border-border/40 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-fade-in-up">
              <div className="relative p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/30">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground leading-none">
                  {t.yourForecast}
                </h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">BESCOM Optimizer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <button
                onClick={onToggleDark}
                className="p-2 rounded-xl bg-card/60 hover:bg-muted border border-border/40 hover:scale-105 transition-all duration-200 shadow-sm"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-foreground" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-4 sm:mt-8 space-y-6 sm:space-y-8">
        
        {/* ── RESPONSIVE ACTION BAR (EDIT SETUP) ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 animate-fade-in-up">
          <Button
            onClick={onEditSetup} 
            variant="outline"
            className="w-full sm:w-auto h-12 sm:h-10 border-border/50 bg-card/60 hover:bg-muted text-foreground hover:text-primary transition-all duration-200 flex items-center justify-center gap-2 rounded-xl shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-bold tracking-wide">{t.editSetup}</span>
          </Button>

          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hidden sm:block">
            {t.forecastEngineActive}
          </div>
        </div>

        {/* ── Hero Card ── */}
        <Card className="relative overflow-hidden border-0 shadow-2xl shadow-primary/10 bg-card/60 backdrop-blur-xl animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%] animate-[gradientShift_4s_ease_infinite]" />
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-secondary/8 rounded-full blur-3xl pointer-events-none" />

          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                    {t.xgboostPowered}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.predictedUnits}</p>
                  <h2 className="text-6xl sm:text-8xl font-black tracking-tighter text-foreground leading-none flex items-baseline gap-2">
                    {animUnits}
                    <span className="text-xl sm:text-2xl text-muted-foreground font-bold uppercase tracking-widest">{t.units}</span>
                  </h2>
                </div>

                <div className={`inline-flex items-center gap-2 font-bold px-4 py-2 rounded-xl text-sm border transition-all ${
                  isFree
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                }`}>
                  {isFree ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {isFree ? t.freeStatus : `${t.estimatedBill}: ₹${animBill.toLocaleString('en-IN')}`}
                </div>
              </div>

              <div className="w-full lg:w-80 space-y-4">
                <div className="bg-background/40 backdrop-blur-sm p-5 rounded-2xl border border-border/40 shadow-inner">
                  <div className="flex justify-between items-center text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                    <span>{t.subsidyStatus || 'Subsidy Limit'}</span>
                    <span>200u Max</span>
                  </div>
                  <div className="h-2.5 w-full bg-muted/50 rounded-full overflow-hidden border border-border/30">
                    <div
                      className={`h-full rounded-full bar-animate transition-all duration-1000 ${isFree ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                      style={{ width: `${Math.min((safeUnits / 200) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center mt-3 font-medium text-muted-foreground">
                    {isFree
                      ? t.freeDesc
                      : t.chargedDesc?.replace('{n}', String(safeBillBreakdown.scenario === 'PARTIAL' ? prediction.correctedUnits - entitlement : Math.max(0, prediction.correctedUnits - 200)))}
                  </p>
                </div>
                <ConfidenceBadge units={prediction.correctedUnits} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title={t.predictedUnits}   value={`${animUnits}`}                description={t.nextMonthForecast} trend={trendDir} trendValue={`${trendPct}${t.vsAvg}`} icon="zap" />
          <MetricCard title={t.estimatedBill}    value={`₹${animBill.toLocaleString('en-IN')}`}        description={isFree ? t.gruhaJyotiFree : safeBillBreakdown.scenario === 'PARTIAL' ? t.partialBill : t.fullBESCOM} icon="rupee" />
          <MetricCard title={t.historicalAvg}    value={`${Math.round(historicalAvg)}`}                description={t.last3MonthsAvg}    icon="trend-up" />
          <MetricCard title={t.unitsToSave}
            value={isFree ? '0' : `${safeBillBreakdown.scenario === 'PARTIAL' ? Math.max(0, safeUnits - entitlement) : Math.max(0, safeUnits - 200)}`}
            description={isFree ? t.alreadyFree : t.toReachZero}
            icon={isFree ? 'trend-down' : 'trend-up'} />
        </div>

        {/* ── Recommendations ── */}
        <RecommendationsList
          recommendations={prediction.recommendations || []}
          correctedUnits={prediction.correctedUnits}
          estimatedBill={prediction.estimatedBill}
          billBreakdown={safeBillBreakdown}
          entitlement={entitlement}
          usageData={usageData}
          applianceData={applianceData}
        />

        {/* ── Charts Row ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <div ref={trendsRef.ref}>
            <Card className="shadow-xl h-full border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-primary to-secondary" />
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-black">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                  {t.monthlyTrend}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trendsData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} stroke="hsl(var(--foreground))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                    />
                    <Bar dataKey="units" radius={[8, 8, 0, 0]} isAnimationActive={trendsRef.inView}>
                      {trendsData.map((entry, i) => (
                        <Cell key={i} fill={entry.type === 'predicted' ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} fillOpacity={entry.type === 'predicted' ? 1 : 0.5} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div ref={breakdownRef.ref}>
            <Card className="shadow-xl h-full border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-secondary to-primary" />
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-black">
                  {t.consumptionBreakdown}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={consumptionBreakdown}>
                    <defs>
                      <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#baseGrad)" strokeWidth={2.5} isAnimationActive={breakdownRef.inView} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Bill Details Row ── */}
        <div className="grid md:grid-cols-2 gap-6">
          <SlabBreakdownChart billBreakdown={safeBillBreakdown} entitlement={entitlement} units={prediction.correctedUnits} />
          <BillCalculator defaultEntitlement={entitlement} />
        </div>

        {/* ── Historical Analysis ── */}
        <Card className="shadow-xl border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-primary/60 to-secondary/60" />
          <CardHeader className="pb-3 pt-5 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-black">
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
              {t.historicalAnalysis}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8 pt-5">
              <div className="space-y-3">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">{t.last3Months}</h4>
                <div className="space-y-2">
                  {userData.historicalBills.map((bill, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-background/40 border border-border/30 rounded-xl px-4 py-2.5 hover:border-border/60 transition-all">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.monthLabel} {idx + 1}</span>
                      <span className="font-black text-foreground">{bill.units} <span className="text-xs font-medium text-muted-foreground">{t.units}</span></span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center bg-primary/8 border border-primary/20 rounded-xl px-4 py-2.5 mt-3">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">{t.average}</span>
                    <span className="font-black text-primary">{Math.round(historicalAvg)} <span className="text-xs font-medium">{t.units}</span></span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">{t.selectedAppliances}</h4>
                <div className="space-y-2">
                  {Object.entries(applianceData).filter(([_, d]) => d.selected).map(([name, data]) => {
                    const appliance = APPLIANCES.find(a => a.name === name);
                    const usage = usageData[name];
                    const appNameStr = (t as any)[getApplianceTranslationKey(name)] || name;

                    return (
                      <div key={name} className="flex justify-between items-center bg-background/40 border border-border/30 rounded-xl px-4 py-2.5 hover:border-border/60 transition-all">
                        <span className="text-xs font-medium text-foreground flex items-center gap-2">
                          <span>{appliance?.icon}</span> {appNameStr}
                        </span>
                        <div className="text-right">
                          <span className="font-black text-foreground text-sm block">{data.wattage}W</span>
                          {usage !== undefined && appliance?.category === 'high-consumption' && (
                            <span className="text-[10px] text-muted-foreground font-bold">
                              ({usage}{name.includes('Washing') || name.includes('Iron') ? t.perWeekShort : t.hoursPerDayShort})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── How It Works ── */}
        <Card className="shadow-xl border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden">
          <div className="h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="bg-primary/8 p-3 rounded-2xl border border-primary/20 shrink-0">
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <h3 className="font-black text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t.howItWorks}
                </h3>
                <div className="grid sm:grid-cols-2 gap-2">
                  {[
                    { dot: '🔢', text: t.ruleBasedDesc },
                    { dot: '🤖', text: t.xgboostDesc },
                    { dot: '📊', text: t.slabDesc },
                    { dot: '🎯', text: t.confidenceDesc },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
                      <span className="text-base leading-none mt-0.5">{item.dot}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  {t.warningNote}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}