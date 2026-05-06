import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input }  from '../ui/input';
import { Label }  from '../ui/label';
import { ApplianceData, UsageData, BaseloadCounts } from '../../types';
import { APPLIANCES } from '../../data/appliances';
import { Clock, Info } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

interface SetupStep3Props {
  applianceData:   ApplianceData;
  initialData:     UsageData;
  onComplete:      (data: UsageData) => void;
  onBack:          () => void;
  baseloadCounts?: BaseloadCounts;
}

function calcBaseloadMonthly(counts?: BaseloadCounts): number {
  const c = counts ?? { num_fans: 3, num_fridges: 1, num_tvs: 1, num_lights: 6 };
  const daily =
    c.num_fans    * 0.45 +
    c.num_fridges * 0.9  +
    c.num_tvs     * 0.4  +
    c.num_lights  * (0.5 / 6) +
    0.1;
  return parseFloat((daily * 30).toFixed(1));
}

const decimalToTime = (decimalHours: number) => {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return { h, m };
};

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

export function SetupStep3({ applianceData, initialData, onComplete, onBack, baseloadCounts }: SetupStep3Props) {
  const { t } = useLang();
  const [usageData, setUsageData] = useState<UsageData>(initialData || {});

  const selectedBuiltIn = APPLIANCES
    .filter(a => a.category === 'high-consumption' && applianceData[a.name]?.selected)
    .map(a => ({
      name:    a.name,
      wattage: applianceData[a.name]?.wattage || a.defaultWattage,
      icon:    a.icon,
      isWeekly: a.name.includes('Washing') || a.name.includes('Iron')
    }));

  const handleTimeChange = (name: string, type: 'h' | 'm', value: string) => {
    const current = usageData[name] || 0;
    const { h, m } = decimalToTime(current);
    
    let newH = h;
    let newM = m;
    
    if (type === 'h') newH = parseInt(value) || 0;
    if (type === 'm') newM = parseInt(value) || 0;
    
    const decimalVal = newH + (newM / 60);
    setUsageData(prev => ({ ...prev, [name]: decimalVal }));
  };

  const handleCycleChange = (name: string, value: string) => {
    setUsageData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const getMonthlyUnitsNumber = (name: string, wattage: number): number => {
    const hours = usageData[name] || 0;
    if (hours === 0) return 0;
    if (name.includes('Washing Machine') || name.includes('Iron')) {
      return hours * 4.33 * 0.5;
    }
    return (wattage / 1000) * hours * 30;
  };

  const isValid = selectedBuiltIn.every(
    a => usageData[a.name] !== undefined && usageData[a.name] >= 0
  );

  const baseMonthly = calcBaseloadMonthly(baseloadCounts);

  return (
    <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/70 backdrop-blur-xl overflow-hidden animate-fade-in-up">
      <div className="h-1.5 w-full animated-gradient" />

      <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-card to-secondary/5 px-6 pt-6 pb-5">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/25">
            <Clock className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-black tracking-tight">{t.step3Title}</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1 ml-11">{t.step3Desc}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-7 px-6 pt-7 pb-6">

        {selectedBuiltIn.length > 0 && (
          <div className="rounded-xl bg-accent/10 border border-accent/20 px-4 py-3 animate-fade-in-up">
            <p className="text-xs font-semibold text-accent-hover dark:text-accent-foreground">{t.paretoNote}</p>
          </div>
        )}

        {selectedBuiltIn.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-5 text-center animate-fade-in-up">
            <p className="text-muted-foreground text-sm">{t.noAppliancesSelected}</p>
            <div className="bg-primary/5 border border-primary/20 text-primary p-5 rounded-2xl text-left max-w-sm shadow-sm">
              <p className="font-black text-sm flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 flex-shrink-0" /> {t.fallbackActivated}
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.fallbackDesc}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 opacity-0 animate-fade-in-up animate-delay-100">
            {selectedBuiltIn.map(appliance => {
              const numUnits = getMonthlyUnitsNumber(appliance.name, appliance.wattage);
              const currentVal = usageData[appliance.name] || 0;
              const { h, m } = decimalToTime(currentVal);
              
              const impactWidth = Math.min((numUnits / 150) * 100, 100);
              const isHeavyImpact = numUnits > 50;
              
              const appNameStr = (t as any)[getApplianceTranslationKey(appliance.name)] || appliance.name;

              return (
                <div key={appliance.name} className="group rounded-xl border border-border/40 bg-background/40 hover:border-border/70 p-4 space-y-4 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={appliance.name} className="flex items-center gap-2 text-foreground font-bold cursor-pointer">
                      <span className="text-xl">{appliance.icon}</span>
                      {appNameStr}
                      <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-md ml-1 uppercase tracking-wider">
                        {appliance.wattage}W
                      </span>
                    </Label>
                    
                    {numUnits > 0 && (
                      <div className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg transition-colors ${isHeavyImpact ? 'text-accent-hover bg-accent/10 dark:text-accent-foreground' : 'text-primary bg-primary/10'}`}>
                        <span>⚡</span>
                        <span>~{numUnits.toFixed(1)} {t.unitsPerMonth}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    {appliance.isWeekly ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="number" min="0" step="1"
                          placeholder="e.g. 5"
                          value={currentVal === 0 ? '' : currentVal}
                          onChange={e => handleCycleChange(appliance.name, e.target.value)}
                          className="bg-background/60 border-border/50 focus:border-primary/60 focus:ring-2 focus:ring-primary/10 transition-all duration-200 text-foreground"
                        />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {t.cyclesPerWeek}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1 bg-background/60 border border-border/50 rounded-lg p-1.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                        <div className="flex items-center flex-1">
                          <Input
                            type="number" min="0" max="24" step="1"
                            placeholder="0"
                            value={h === 0 && m === 0 ? '' : h}
                            onChange={e => handleTimeChange(appliance.name, 'h', e.target.value)}
                            className="border-0 bg-transparent text-right focus-visible:ring-0 px-2 font-black text-lg"
                          />
                          <span className="text-xs font-bold text-muted-foreground/70 pr-3">hrs</span>
                        </div>
                        <div className="w-px h-6 bg-border/50" />
                        <div className="flex items-center flex-1">
                          <Input
                            type="number" min="0" max="59" step="5"
                            placeholder="0"
                            value={h === 0 && m === 0 ? '' : m}
                            onChange={e => handleTimeChange(appliance.name, 'm', e.target.value)}
                            className="border-0 bg-transparent text-right focus-visible:ring-0 px-2 font-black text-lg"
                          />
                          <span className="text-xs font-bold text-muted-foreground/70 pr-3">mins</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Impact Progress Bar */}
                  {numUnits > 0 && (
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2 relative">
                      <div 
                        className={`absolute top-0 left-0 h-full transition-all duration-[800ms] ease-out animate-delay-200 ${isHeavyImpact ? 'bg-accent' : 'bg-primary'}`}
                        style={{ width: `${impactWidth}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Baseload Summary ── */}
        <div className="rounded-xl border border-border/40 bg-background/40 p-4 overflow-hidden mt-6 opacity-0 animate-fade-in-up animate-delay-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h4 className="font-black text-sm text-foreground tracking-tight">{t.baseloadAuto}</h4>
              <p className="text-xs text-muted-foreground">{t.baseloadDesc}</p>
              {baseloadCounts && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { icon: '🌀', val: baseloadCounts.num_fans, label: 'fans' },
                    { icon: '🧊', val: baseloadCounts.num_fridges, label: `fridge${baseloadCounts.num_fridges !== 1 ? 's' : ''}` },
                    { icon: '📺', val: baseloadCounts.num_tvs, label: `TV${baseloadCounts.num_tvs !== 1 ? 's' : ''}` },
                    { icon: '💡', val: baseloadCounts.num_lights, label: 'lights' },
                  ].map((item, i) => (
                    <span key={i} className="text-[10px] font-black uppercase tracking-wider bg-primary/8 text-primary border border-primary/15 px-2.5 py-1 rounded-lg">
                      {item.icon} {item.val} {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:text-right flex-shrink-0">
              <div className="text-3xl font-black tracking-tighter text-primary">
                ~{baseMonthly}
                <span className="text-base font-medium tracking-normal text-muted-foreground ml-1">{t.units}</span>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{t.estimatedPerMonth}</div>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex justify-between pt-2 opacity-0 animate-fade-in-up animate-delay-300">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-border/50 bg-background/50 hover:bg-muted text-foreground transition-all duration-200"
          >
            ← {t.back}
          </Button>
          <Button
            onClick={() => onComplete(usageData)}
            disabled={!isValid}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none px-8"
          >
            {t.completeSetup} ✓
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}