import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Label }  from '../ui/label';
import { ApplianceData, BaseloadCounts } from '../../types';
import { APPLIANCES } from '../../data/appliances';
import { Edit2, Check, Zap, Cpu } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

interface SetupStep2Props {
  initialData:     ApplianceData;
  onComplete:      (data: ApplianceData) => void;
  onBack:          () => void;
  baseloadCounts?: BaseloadCounts;
}

const BASELOAD_COUNT_KEY: Record<string, keyof BaseloadCounts> = {
  'Ceiling Fan':  'num_fans',
  'Refrigerator': 'num_fridges',
  'TV (LED)':     'num_tvs',
  'LED Lights':   'num_lights',
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
    'Iron': 'ironLabel',
    'Ceiling Fan': 'ceilingFans',
    'Refrigerator': 'refrigerators',
    'TV (LED)': 'tvs',
    'LED Lights': 'lightBulbs',
    'Phone Charger': 'phoneCharger'
  };
  return map[name] || name;
}

function getApplianceDescKey(name: string): string {
  const map: Record<string, string> = {
    'AC (1 Ton)': 'ac1TonDesc',
    'AC (1.5 Ton)': 'ac15TonDesc',
    'Geyser': 'geyserDesc',
    'Washing Machine': 'wmDesc',
    'Microwave': 'mwDesc',
    'Air Cooler': 'coolerDesc',
    'Iron': 'ironDesc'
  };
  return map[name] || '';
}

export function SetupStep2({ initialData, onComplete, onBack, baseloadCounts }: SetupStep2Props) {
  const { t } = useLang();
  const [applianceData,    setApplianceData]    = useState<ApplianceData>(initialData || {});
  const [editingAppliance, setEditingAppliance] = useState<string | null>(null);

  const toggleAppliance = (name: string) => {
    const appliance = APPLIANCES.find(a => a.name === name);
    if (!appliance) return;
    setApplianceData(prev => {
      if (prev[name]?.selected) {
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: { selected: true, wattage: appliance.defaultWattage } };
    });
  };

  const updateWattage = (name: string, wattage: number) => {
    setApplianceData(prev => ({
      ...prev,
      [name]: { ...(prev[name] || { selected: true }), wattage },
    }));
    setEditingAppliance(null);
  };

  const highConsumption = APPLIANCES.filter(a => a.category === 'high-consumption');
  const baseload        = APPLIANCES.filter(a => a.category === 'baseload');
  const hasSelection    = Object.values(applianceData).some(a => a.selected);

  return (
    <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/70 backdrop-blur-xl overflow-hidden animate-fade-in-up">
      <div className="h-1.5 w-full animated-gradient" />

      <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-card to-secondary/5 px-6 pt-6 pb-5">
        <CardTitle className="flex items-center gap-3 text-foreground">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-lg shadow-primary/25">
            <Cpu className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-black tracking-tight">{t.step2Title}</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground mt-1 ml-11">{t.step2Desc}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-7 px-6 pt-7 pb-6">

        {/* ── High-Consumption Section (BENTO GRID) ── */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-accent" />
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground">{t.highConsumption}</h3>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{t.editableWattage}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {highConsumption.map(appliance => {
              const isSelected     = !!applianceData[appliance.name]?.selected;
              const currentWattage = applianceData[appliance.name]?.wattage || appliance.defaultWattage;
              const isEditing      = editingAppliance === appliance.name;
              
              const appNameStr = (t as any)[getApplianceTranslationKey(appliance.name)] || appliance.name;
              const appDescStr = (t as any)[getApplianceDescKey(appliance.name)] || appliance.description;

              return (
                <div
                  key={appliance.name}
                  className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-300 ease-out flex flex-col justify-between min-h-[140px] ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md shadow-primary/10 scale-[1.02] transform-gpu'
                      : 'border-border/40 bg-background/40 hover:border-border hover:bg-background/70 hover:scale-[1.01] hover:shadow-sm transform-gpu'
                  }`}
                  onClick={() => { if (!isEditing) toggleAppliance(appliance.name); }}
                >
                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-primary text-primary-foreground scale-100 opacity-100 animate-scale-in' : 'scale-75 opacity-0'}`}>
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>

                  <div>
                    <div className="text-3xl mb-2">{appliance.icon}</div>
                    <Label className={`font-bold block cursor-pointer transition-colors ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {appNameStr}
                    </Label>
                    <p className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-2 leading-tight">{appDescStr}</p>
                  </div>

                  <div className="mt-3" onClick={e => e.stopPropagation()}>
                    {isSelected && (
                      isEditing ? (
                        <select
                          value={currentWattage}
                          onChange={e => updateWattage(appliance.name, parseInt(e.target.value))}
                          onBlur={() => setEditingAppliance(null)}
                          autoFocus
                          className="w-full border border-primary/40 bg-background text-foreground rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        >
                          {appliance.wattageRange &&
                            Array.from(
                              { length: Math.floor((appliance.wattageRange[1] - appliance.wattageRange[0]) / 50) + 1 },
                              (_, i) => appliance.wattageRange![0] + i * 50
                            ).map(w => (
                              <option key={w} value={w}>{w}W</option>
                            ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingAppliance(appliance.name)}
                          className="flex w-full items-center justify-center gap-1.5 text-[11px] font-black text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg py-1 transition-all duration-150"
                        >
                          {currentWattage}W <Edit2 className="w-3 h-3" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Baseload Info (read-only) ── */}
        <div className="space-y-3 pt-2 opacity-0 animate-fade-in-up animate-delay-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Auto-Included Baseload</span>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </div>

          <div className="rounded-xl bg-secondary/5 border border-secondary/20 px-4 py-3">
            <p className="text-xs text-secondary-hover dark:text-secondary-foreground font-semibold">{t.autoBaseload}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {baseload.map(appliance => {
              const countKey = BASELOAD_COUNT_KEY[appliance.name];
              const count = countKey && baseloadCounts ? baseloadCounts[countKey] : null;
              const appNameStr = (t as any)[getApplianceTranslationKey(appliance.name)] || appliance.name;
              
              return (
                <div key={appliance.name} className="relative rounded-xl border border-secondary/20 bg-secondary/5 p-3 overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <Check className="w-3.5 h-3.5 text-secondary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xl">{appliance.icon}</span>
                    <div className="text-xs font-bold text-foreground leading-tight">{appNameStr}</div>
                    {count !== null ? (
                      <div className="text-[10px] font-black text-primary uppercase tracking-wider">× {count} (Step 1)</div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground font-medium">{t.autoIncluded}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-border/50 bg-background/50 hover:bg-muted text-foreground transition-all duration-200"
          >
            ← {t.back}
          </Button>
          <Button
            onClick={() => onComplete(applianceData)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold shadow-lg shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 px-8"
          >
            {hasSelection ? t.continueToUsage : t.skipToUsage} →
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}