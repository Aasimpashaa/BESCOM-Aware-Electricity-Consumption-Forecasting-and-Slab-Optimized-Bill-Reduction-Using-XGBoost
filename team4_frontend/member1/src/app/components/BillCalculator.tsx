import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { calculateBESCOMBillWithEntitlement } from '../utils/bescomTariffs';
import { Calculator, ShieldCheck, ChevronRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

interface BillCalculatorProps {
  defaultEntitlement?: number;
}

export function BillCalculator({ defaultEntitlement = 100 }: BillCalculatorProps) {
  const { t } = useLang();
  const [units,       setUnits]       = useState<string>('150');
  const [entitlement, setEntitlement] = useState<string>(defaultEntitlement.toString());
  const [result,      setResult]      = useState(
    calculateBESCOMBillWithEntitlement(150, defaultEntitlement)
  );

  const handleCalculate = () => {
    const unitsNum       = parseFloat(units)       || 0;
    const entitlementNum = parseFloat(entitlement) || 100;
    setResult(calculateBESCOMBillWithEntitlement(unitsNum, entitlementNum));
  };

  const scenarioBadge = () => {
    if (!result.scenario) return null;
    const cfg = {
      ZERO_BILL:  { cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25', text: t.scenarioABadge },
      PARTIAL:    { cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',         text: t.scenarioBBadge },
      CLIFF_EDGE: { cls: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',                 text: t.scenarioCBadge },
    }[result.scenario];
    return (
      <div className={`text-[10px] font-black rounded-full px-3 py-1 text-center border uppercase tracking-widest ${cfg.cls}`}>
        {cfg.text}
      </div>
    );
  };

  const billColor = result.scenario === 'ZERO_BILL' ? 'text-emerald-500' : result.scenario === 'PARTIAL' ? 'text-amber-500' : 'text-red-500';

  return (
    <Card className="border-0 shadow-xl bg-card/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-primary to-secondary px-6 py-5 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-white tracking-tight">{t.bescomBillCalc}</h3>
            <p className="text-white/70 text-xs mt-0.5">{t.gjEntitlementCalc}</p>
          </div>
        </div>
      </div>

      <CardContent className="pt-5 space-y-4">
        {/* Entitlement */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {t.personalEntitlement}
          </Label>
          <Input
            type="number" min="0" max="200" step="1"
            value={entitlement}
            onChange={e => setEntitlement(e.target.value)}
            placeholder="e.g. 100"
            className="max-w-[180px] bg-background/60 border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
          />
        </div>

        {/* Units + Calculate */}
        <div className="space-y-1.5">
          <Label htmlFor="units" className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t.unitsConsumedKwh}
          </Label>
          <div className="flex gap-2">
            <Input
              id="units" type="number"
              value={units} onChange={e => setUnits(e.target.value)}
              placeholder={t.enterUnits} min="0" step="1"
              className="bg-background/60 border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all text-foreground"
            />
            <Button
              onClick={handleCalculate}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold shadow-md hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
            >
              {t.calculate} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Result card */}
        {result.totalUnits > 0 && (
          <div className="rounded-xl bg-background/50 border border-border/40 p-4 space-y-3 animate-fade-in-up">
            <div className="flex items-center justify-between">
              {scenarioBadge()}
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-muted-foreground">{result.totalUnits}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.units}</span>
              </div>
            </div>

            {result.scenario !== 'ZERO_BILL' && (
              <div className="space-y-1.5 text-xs">
                {result.slabBreakdown.map((slab, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-muted-foreground">{slab.slab} @ ₹{slab.rate}</span>
                    <span className="font-bold text-foreground">₹{Math.round(slab.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-border/40 pt-1.5 mt-1">
                  <span className="text-muted-foreground">{t.fixedCharges}</span>
                  <span className="font-bold text-foreground">₹{result.fixedCharges}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.stateDuty}</span>
                  <span className="font-bold text-foreground">₹{result.electricityDuty}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border/40 pt-1.5">
                  <span className="text-foreground">{t.grossTotal}</span>
                  <span className="text-foreground">₹{result.grossTotal}</span>
                </div>
                {(result.subsidyAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>{t.gjsSubsidyShort}</span>
                    <span>−₹{result.subsidyAmount}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center border-t-2 border-border/50 pt-3">
              <span className="text-xs font-black uppercase tracking-wider text-foreground">{t.netPayableFull}</span>
              <span className={`text-2xl font-black tracking-tighter ${billColor}`}>
                ₹{result.totalBill}
              </span>
            </div>

            {result.totalBill > 0 && (
              <p className="text-[10px] text-center text-muted-foreground font-medium">
                {t.averageRate.replace('{r}', result.averageRate.toFixed(2))}
              </p>
            )}
          </div>
        )}

        {/* Tariff info table */}
        <div className="rounded-xl bg-muted/30 border border-border/30 p-3.5 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{t.gjTariff2026}</div>
          {[
            { label: t.scenarioAFree,    val: t.zeroBillFree,    cls: 'text-emerald-500' },
            { label: t.scenarioBPartial, val: t.partialBill,     cls: 'text-amber-500' },
            { label: t.scenarioCFull,    val: t.fullBillCliff,   cls: 'text-red-500' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`font-black ${row.cls}`}>{row.val}</span>
            </div>
          ))}
          <div className="border-t border-border/30 pt-2 space-y-1">
            {[
              { l: t.energyRate,    v: '₹5.80/unit' },
              { l: t.fppcaLabel,    v: '₹0.39/unit' },
              { l: t.pgSurcharge,   v: '₹0.36/unit' },
              { l: t.fixedCharge,   v: '₹435 (₹145 × 3kW)' },
              { l: t.stateDutyLabel,v: '9%' },
            ].map((row, i) => (
              <div key={i} className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">{row.l}</span>
                <span className="font-bold text-foreground">{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}