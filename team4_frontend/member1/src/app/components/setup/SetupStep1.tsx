import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button }  from '../ui/button';
import { Input }   from '../ui/input';
import { Label }   from '../ui/label';
import { UserData, HistoricalBill, BaseloadCounts } from '../../types';
import { Calendar, Users, ShieldCheck, Home, SlidersHorizontal, Minus, Plus, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

interface SetupStep1Props {
  initialData: UserData;
  onComplete:  (data: UserData) => void;
}

const BASELOAD_INPUT_DEFS: {
  key:   keyof BaseloadCounts;
  labelKey: string;
  icon:  string;
  min:   number;
  max:   number;
  defaultVal: number;
  hintKey:  string;
}[] = [
  { key: 'num_fans',    labelKey: 'ceilingFans',     icon: '🌀', min: 1,  max: 8,  defaultVal: 3, hintKey: 'totalFansHint'   },
  { key: 'num_fridges', labelKey: 'refrigerators',   icon: '🧊', min: 0,  max: 3,  defaultVal: 1, hintKey: 'inclSecondFridge'},
  { key: 'num_tvs',     labelKey: 'tvs',             icon: '📺', min: 0,  max: 4,  defaultVal: 1, hintKey: 'ledLcdTvHint'   },
  { key: 'num_lights',  labelKey: 'lightBulbs',      icon: '💡', min: 1,  max: 15, defaultVal: 6, hintKey: 'ledCflBulbHint' },
];

export function SetupStep1({ initialData, onComplete }: SetupStep1Props) {
  const { t } = useLang();

  // Tab state
  const [activeTab, setActiveTab] = useState<'history' | 'household'>('history');

  const [month1Units, setMonth1Units] = useState(initialData.historicalBills[0]?.units.toString() || '');
  const [month2Units, setMonth2Units] = useState(initialData.historicalBills[1]?.units.toString() || '');
  const [month3Units, setMonth3Units] = useState(initialData.historicalBills[2]?.units.toString() || '');
  const [numberOfPeople, setNumberOfPeople] = useState(initialData.numberOfPeople || 1);
  const [entitlement, setEntitlement] = useState(initialData.entitlement?.toString() || '');
  const [daysHome, setDaysHome] = useState((initialData.daysHome ?? 30).toString());

  const initCounts = initialData.baseloadCounts ?? {
    num_fans: 3, num_fridges: 1, num_tvs: 1, num_lights: 6,
  };
  const [baseload, setBaseload] = useState<BaseloadCounts>(initCounts);

  const updateBaseload = (key: keyof BaseloadCounts, delta: number, min: number, max: number) => {
    setBaseload(prev => {
      const current = prev[key];
      const next = Math.max(min, Math.min(max, current + delta));
      return { ...prev, [key]: next };
    });
  };

  const updatePeople = (delta: number) => {
    setNumberOfPeople(prev => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleSubmit = () => {
    const now = new Date();
    const historicalBills: HistoricalBill[] = [
      { month: new Date(now.getFullYear(), now.getMonth() - 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), units: parseFloat(month1Units) || 0, bill: 0 },
      { month: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), units: parseFloat(month2Units) || 0, bill: 0 },
      { month: new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), units: parseFloat(month3Units) || 0, bill: 0 },
    ];
    onComplete({
      ...initialData,
      historicalBills,
      numberOfPeople:  numberOfPeople,
      entitlement:     parseFloat(entitlement)  || 100,
      daysHome:        parseInt(daysHome)        || 30,
      baseloadCounts:  baseload,
    });
  };

  const isHistoryValid = month1Units && month2Units && month3Units;
  const isAllValid = isHistoryValid && numberOfPeople > 0;
  
  const monthLabels  = [t.monthsAgo3, t.monthsAgo2, t.lastMonth];
  const monthValues  = [
    { value: month1Units, setter: setMonth1Units },
    { value: month2Units, setter: setMonth2Units },
    { value: month3Units, setter: setMonth3Units },
  ];

  return (
    <Card className="border-0 shadow-2xl shadow-primary/5 bg-card/70 backdrop-blur-xl overflow-hidden animate-fade-in-up max-w-3xl mx-auto">
      <div className="h-1.5 w-full animated-gradient" />

      {/* Modern Header with Tab Navigation */}
      <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-card to-secondary/5 px-8 pt-8 pb-0">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg shadow-primary/25">
            <Calendar className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black tracking-tight text-foreground">{t.step1Title}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">{t.step1Desc}</CardDescription>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-6 mt-4 relative">
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1</span>
              {t.billHistoryTab}
              {isHistoryValid && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-1" />}
            </span>
            {activeTab === 'history' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full animate-fade-in-up" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('household')}
            className={`pb-4 text-sm font-bold tracking-wide uppercase transition-colors relative ${activeTab === 'household' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
             <span className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${activeTab === 'household' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</span>
              {t.householdTab}
            </span>
            {activeTab === 'household' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full animate-fade-in-up" />
            )}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-8 min-h-[420px]">
        
        {/* ── TAB 1: HISTORY & ENTITLEMENT ── */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* History Block */}
              <div className="space-y-5 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black tracking-widest uppercase text-foreground">{t.recentConsumption}</h3>
                </div>
                
                <p className="text-[11px] text-muted-foreground font-medium leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/10">
                  {t.whyWeNeedThis}
                </p>

                <div className="space-y-4">
                  {monthLabels.map((label, idx) => (
                    <div key={label} className="group flex items-center justify-between gap-4 bg-background/50 border border-border/50 p-2.5 rounded-xl hover:border-primary/30 transition-colors">
                      <Label htmlFor={`month-${idx}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground pl-2 whitespace-nowrap">
                        {label}
                      </Label>
                      <div className="flex items-center bg-background rounded-lg border border-border/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 overflow-hidden">
                        <Input
                          id={`month-${idx}`}
                          type="number"
                          placeholder="0"
                          value={monthValues[idx].value}
                          onChange={e => monthValues[idx].setter(e.target.value)}
                          className="w-24 h-10 border-0 bg-transparent text-right font-black text-lg focus-visible:ring-0"
                        />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 bg-muted/30 h-full flex items-center border-l border-border/40">{t.units}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entitlement Block */}
              <div className="space-y-5 opacity-0 animate-fade-in-up animate-delay-100">
                <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-black tracking-widest uppercase text-foreground">{t.entitlementLimit}</h3>
                </div>
                
                <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-5 h-full flex flex-col justify-center">
                  <div className="space-y-1 text-center">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {t.fromYourBill}
                    </Label>
                    <div className="flex items-center justify-center gap-3">
                      <Input
                        type="number" min="0" max="200" step="1"
                        placeholder="e.g. 200"
                        value={entitlement}
                        onChange={e => setEntitlement(e.target.value)}
                        className="w-32 h-14 bg-background/80 border-emerald-500/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200 text-foreground text-2xl font-black text-center"
                      />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mt-2">{t.unitsPerMonth2}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
                    {[
                      { cls: 'text-emerald-600 dark:text-emerald-400', title: t.leEntitlement, sub: t.freeStatusShort },
                      { cls: 'text-amber-600 dark:text-amber-400', title: t.upTo200, sub: t.partialStatusShort },
                      { cls: 'text-red-600 dark:text-red-400', title: t.over200, sub: t.fullBillStatusShort },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className={`text-[10px] font-black ${s.cls}`}>{s.title}</div>
                        <div className="text-[9px] mt-0.5 opacity-70 font-medium uppercase tracking-wider">{s.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => setActiveTab('household')}
                className="h-12 px-8 rounded-xl bg-secondary hover:bg-secondary-hover text-secondary-foreground font-bold shadow-lg shadow-secondary/25 transition-all group"
              >
                {t.continueToHousehold} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* ── TAB 2: HOUSEHOLD ── */}
        {activeTab === 'household' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Baseload Block */}
              <div className="space-y-5 animate-fade-in-up">
                 <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
                  <Home className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-black tracking-widest uppercase text-foreground">{t.baseloadAppliances}</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {BASELOAD_INPUT_DEFS.map(item => (
                    <div key={item.key} className="bg-background/40 border border-border/50 rounded-xl p-3 flex flex-col items-center justify-center space-y-3 transition-colors hover:border-primary/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                          {(t as any)[item.labelKey]}
                        </Label>
                      </div>
                      
                      <div className="flex items-center justify-between bg-background border border-border/60 rounded-lg p-1 w-full max-w-[120px]">
                        <button 
                          onClick={() => updateBaseload(item.key, -1, item.min, item.max)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                          disabled={baseload[item.key] <= item.min}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-sm text-foreground">{baseload[item.key]}</span>
                        <button 
                          onClick={() => updateBaseload(item.key, 1, item.min, item.max)}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                          disabled={baseload[item.key] >= item.max}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Occupancy & People Block */}
              <div className="space-y-6">
                
                <div className="space-y-4 opacity-0 animate-fade-in-up animate-delay-100">
                  <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
                    <SlidersHorizontal className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-black tracking-widest uppercase text-foreground">{t.daysAtHome}</h3>
                  </div>

                  <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-5 space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="range" min="0" max="30" step="1"
                        value={daysHome}
                        onChange={e => setDaysHome(e.target.value)}
                        className="flex-1 accent-violet-500 h-1.5 bg-violet-500/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="w-16 text-center">
                        <span className="text-2xl font-black text-violet-600 dark:text-violet-400">{daysHome}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>0 {t.daysLabel}</span>
                      <span>30 {t.daysLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 opacity-0 animate-fade-in-up animate-delay-200">
                   <div className="flex items-center gap-2 mb-2 border-b border-border/40 pb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black tracking-widest uppercase text-foreground">{t.numberOfPeople}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between bg-background/60 border border-border/50 rounded-xl p-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.totalOccupants}</Label>
                    <div className="flex items-center bg-background border border-border/60 rounded-lg p-1 shadow-sm w-32 justify-between">
                      <button 
                        onClick={() => updatePeople(-1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={numberOfPeople <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-black text-lg text-foreground">{numberOfPeople}</span>
                      <button 
                        onClick={() => updatePeople(1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                        disabled={numberOfPeople >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="flex justify-between pt-4 border-t border-border/40">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('history')}
                className="text-muted-foreground hover:text-foreground"
              >
                ← {t.back}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isAllValid}
                className="h-12 px-10 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-black shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
              >
                {t.nextStep} ✓
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}