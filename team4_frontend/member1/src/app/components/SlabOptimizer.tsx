/**
 * SlabOptimizer.tsx  — v3.0
 * Gruha Jyothi 3-Scenario Entitlement Engine
 * Calls POST /slab-optimize — physics + entitlement engine.
 *
 * Scenario A: units <= entitlement          → ZERO_BILL  (₹0)
 * Scenario B: entitlement < units <= 200    → PARTIAL    (partial subsidy)
 * Scenario C: units > 200                   → CLIFF_EDGE (subsidy forfeited)
 */

import { useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from './ui/card';
import { Button }  from './ui/button';
import { Input }   from './ui/input';
import { Label }   from './ui/label';
import { Badge }   from './ui/badge';
import {
  Zap, CheckCircle, AlertCircle, TrendingDown,
  ChevronDown, ChevronUp, Loader2, FlaskConical,
  ShieldCheck, AlertTriangle, Skull,
} from 'lucide-react';

const APPLIANCES = [
  { key: 'ac',     label: 'Air Conditioner', icon: '❄️',  max: 24 },
  { key: 'geyser', label: 'Geyser',          icon: '🚿',  max: 24 },
  { key: 'wm',     label: 'Washing Machine', icon: '🧺',  max: 8  },
  { key: 'iron',   label: 'Iron',            icon: '👔',  max: 8  },
  { key: 'mw',     label: 'Microwave',       icon: '🍽️', max: 8  },
  { key: 'cooler', label: 'Air Cooler',      icon: '💨',  max: 24 },
];

interface SlabResult {
  units:          number;
  baseload_units: number;
  hca_units:      number;
  bill:           number;
  is_free:        boolean;
  details: {
    fixed_charge?:    number;
    energy_charge?:   number;
    fppca_charge?:    number;
    pg_surcharge?:    number;
    subtotal?:        number;
    state_duty_9pct?: number;
    gross_total?:     number;
    subsidy_amount?:  number;
    scenario?:        string;
    note?:            string;
  };
  plan:            string[];
  history_note:    string;
  unknown_appliances: string[];
  engine:          string;
  entitlement:     number;
  scenario:        string;   // ZERO_BILL | PARTIAL | CLIFF_EDGE
}

type Scenario = 'ZERO_BILL' | 'PARTIAL' | 'CLIFF_EDGE';

const SCENARIO_CONFIG: Record<Scenario, {
  label: string;
  icon: React.ReactNode;
  outerCls: string;
  textCls: string;
}> = {
  ZERO_BILL: {
    label:    '✅ ZERO BILL — Gruha Jyothi (Scenario A)',
    icon:     <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />,
    outerCls: 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600',
    textCls:  'text-green-700 dark:text-green-400',
  },
  PARTIAL: {
    label:    '⚠️ PARTIAL BILL — Scenario B (excess over entitlement)',
    icon:     <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
    outerCls: 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 dark:border-amber-600',
    textCls:  'text-amber-700 dark:text-amber-400',
  },
  CLIFF_EDGE: {
    label:    '🚨 CLIFF EDGE — Scenario C (over 200 units, subsidy forfeited!)',
    icon:     <Skull className="w-8 h-8 text-red-600 dark:text-red-400" />,
    outerCls: 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600',
    textCls:  'text-red-700 dark:text-red-400',
  },
};

export function SlabOptimizer() {
  const [hours,       setHours]       = useState<Record<string, string>>({});
  const [entitlement, setEntitlement] = useState<string>('100');
  const [result,      setResult]      = useState<SlabResult | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [showPlan,    setShowPlan]    = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const handleRun = async () => {
    const appliance_hours: Record<string, number> = {};
    for (const a of APPLIANCES) {
      const val = parseFloat(hours[a.key] || '0');
      if (val > 0) appliance_hours[a.key] = val;
    }
    if (Object.keys(appliance_hours).length === 0) {
      setError('Enter at least one appliance usage (hours/day).');
      return;
    }
    const entitlementVal = parseFloat(entitlement) || 100;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('http://localhost:8000/slab-optimize', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ appliance_hours, entitlement: entitlementVal }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }
      const data: SlabResult = await res.json();
      setResult(data);
      setShowPlan(true);
      setShowDetails(false);
    } catch (e: any) {
      setError(e.message ?? 'Backend unreachable. Is the FastAPI server running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setHours({});
    setResult(null);
    setError(null);
    setEntitlement('100');
  };

  const scenario = result?.scenario as Scenario | undefined;
  const scenarioCfg = scenario ? SCENARIO_CONFIG[scenario] : null;

  return (
    <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
          <FlaskConical className="w-5 h-5" />
          Slab Optimizer
          <Badge variant="outline" className="text-xs ml-1 border-blue-400 text-blue-600 dark:text-blue-400">
            Entitlement Engine
          </Badge>
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          <strong>Gruha Jyothi 3-Scenario Engine</strong> — Enter your personal entitlement limit
          and daily appliance usage to get exact BESCOM slab calculation + reduction plan.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* ── Entitlement Input ── */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 space-y-2">
          <Label className="text-sm font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Your Personal Entitlement Limit (units/month)
          </Label>
          <Input
            type="number"
            min="0"
            max="200"
            step="1"
            placeholder="e.g. 100"
            value={entitlement}
            onChange={(e) => setEntitlement(e.target.value)}
            className="h-9 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white max-w-xs"
          />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            💡 Find your limit on your BESCOM bill or Seva Sindhu portal. Default: 100 units.
          </p>
        </div>

        {/* ── Appliance Inputs ── */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Daily Appliance Usage (hours/day)
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {APPLIANCES.map((a) => (
              <div key={a.key} className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <span>{a.icon}</span> {a.label}
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max={a.max}
                    step="0.5"
                    placeholder="0"
                    value={hours[a.key] ?? ''}
                    onChange={(e) => setHours(prev => ({ ...prev, [a.key]: e.target.value }))}
                    className="h-8 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <span className="text-xs text-gray-400 whitespace-nowrap">h/d</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex gap-2">
          <Button
            onClick={handleRun}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Calculating…</>
              : <><Zap className="w-4 h-4 mr-2" /> Run Slab Optimizer</>
            }
          </Button>
          {result && (
            <Button variant="outline" onClick={handleReset} className="dark:border-gray-600 dark:text-gray-300">
              Reset
            </Button>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Results ── */}
        {result && scenarioCfg && (
          <div className="space-y-3 animate-in fade-in duration-300">

            {/* Scenario Banner */}
            <div className={`rounded-lg p-4 border-2 ${scenarioCfg.outerCls}`}>
              <div className="flex items-center gap-3">
                {scenarioCfg.icon}
                <div className="flex-1">
                  <div className={`text-lg font-bold ${scenarioCfg.textCls}`}>
                    {scenario === 'ZERO_BILL'
                      ? '₹0.00 — Full Subsidy Applied'
                      : scenario === 'PARTIAL'
                      ? `₹${result.bill.toLocaleString('en-IN')} Payable (after subsidy)`
                      : `₹${result.bill.toLocaleString('en-IN')} — No Subsidy`
                    }
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                    {scenarioCfg.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Predicted: <strong>{result.units} units</strong>
                    {' '}| Entitlement: <strong>{result.entitlement} units</strong>
                    {' '}| Limit: <strong>200 units</strong>
                  </div>
                </div>
              </div>

              {/* Scenario progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>0</span>
                  <span>Entitlement: {result.entitlement}</span>
                  <span>200 (Max)</span>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  {/* Entitlement zone */}
                  <div
                    className="absolute top-0 left-0 h-full bg-green-400 dark:bg-green-600 rounded-full"
                    style={{ width: `${Math.min(100, (result.entitlement / 200) * 100)}%` }}
                  />
                  {/* Usage marker */}
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full opacity-70 ${
                      scenario === 'ZERO_BILL'   ? 'bg-green-600' :
                      scenario === 'PARTIAL'     ? 'bg-amber-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(100, (result.units / 200) * 100)}%` }}
                  />
                  {/* You are here pin */}
                  <div
                    className="absolute top-0 h-full w-0.5 bg-gray-900 dark:bg-white"
                    style={{ left: `${Math.min(98, (result.units / 220) * 100)}%` }}
                  />
                </div>
                <div className="text-center text-xs mt-1 text-gray-500 dark:text-gray-400">
                  You: {result.units} units
                </div>
              </div>
            </div>

            {/* Consumption Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">Baseload</div>
                <div className="font-bold text-blue-700 dark:text-blue-400">{result.baseload_units}</div>
                <div className="text-xs text-gray-400">units</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400">HCA Usage</div>
                <div className="font-bold text-amber-700 dark:text-amber-400">{result.hca_units}</div>
                <div className="text-xs text-gray-400">units</div>
              </div>
              <div className={`rounded-lg p-2 ${
                scenario === 'ZERO_BILL'   ? 'bg-green-50 dark:bg-green-900/30' :
                scenario === 'PARTIAL'     ? 'bg-amber-50 dark:bg-amber-900/30' :
                                            'bg-red-50 dark:bg-red-900/30'
              }`}>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                <div className={`font-bold ${
                  scenario === 'ZERO_BILL'   ? 'text-green-700 dark:text-green-400' :
                  scenario === 'PARTIAL'     ? 'text-amber-700 dark:text-amber-400' :
                                              'text-red-700 dark:text-red-400'
                }`}>{result.units}</div>
                <div className="text-xs text-gray-400">units</div>
              </div>
            </div>

            {/* Bill Breakdown (collapsible) */}
            {scenario !== 'ZERO_BILL' && (
              <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span>Bill Breakdown (BESCOM Digital Twin)</span>
                  {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showDetails && (
                  <div className="px-4 py-3 space-y-1.5 text-sm bg-white dark:bg-gray-800">
                    {[
                      ['Fixed Charge (₹145 × 3kW)',  result.details.fixed_charge],
                      ['Energy Charge (×₹5.80)',       result.details.energy_charge],
                      ['FPPCA (×₹0.39)',               result.details.fppca_charge],
                      ['P&G Surcharge (×₹0.36)',       result.details.pg_surcharge],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>{label}</span>
                        <span>₹{(val as number)?.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t dark:border-gray-700 pt-1 text-gray-700 dark:text-gray-300">
                      <span>Subtotal</span>
                      <span>₹{result.details.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>State Duty (9%)</span>
                      <span>₹{result.details.state_duty_9pct?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t dark:border-gray-700 pt-1 text-gray-800 dark:text-gray-200">
                      <span>Gross Total</span>
                      <span>₹{result.details.gross_total?.toFixed(2)}</span>
                    </div>
                    {result.details.subsidy_amount != null && result.details.subsidy_amount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>GJS Subsidy (−)</span>
                        <span>−₹{result.details.subsidy_amount?.toFixed(2)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between font-bold border-t dark:border-gray-700 pt-1 text-base ${
                      scenario === 'CLIFF_EDGE' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      <span>NET PAYABLE</span>
                      <span>₹{result.bill.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trend Note */}
            {result.history_note && (
              <div className="text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                {result.history_note}
              </div>
            )}

            {/* Optimization Plan */}
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowPlan(!showPlan)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
              >
                <span className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" /> Optimization Plan
                </span>
                {showPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showPlan && (
                <div className="px-4 py-3 space-y-2 bg-white dark:bg-gray-800">
                  {result.plan.map((step, i) => (
                    <div key={i} className={`text-sm rounded p-2 ${
                      step.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                      step.startsWith('🔹') ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 font-medium' :
                      step.startsWith('🚨') ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 font-semibold' :
                      step.startsWith('⚠️') ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      step.startsWith('💡') ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Engine Badge */}
            <div className="text-center">
              <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600">
                Engine: {result.engine} · GJS 3-Scenario Logic (2026)
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
