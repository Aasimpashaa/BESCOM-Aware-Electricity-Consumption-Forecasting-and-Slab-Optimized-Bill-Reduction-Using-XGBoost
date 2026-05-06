import { Zap, ArrowRight } from 'lucide-react';
import { Recommendation } from '../types';

interface RecommendationsListProps {
  recommendations: Recommendation[];
  correctedUnits: number;
  estimatedBill: number;
  billBreakdown: any;
  entitlement: number;
  usageData: any;
  applianceData: any;
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground mb-0.5">AI-Powered</p>
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-none">
            Optimization Action Plan
          </h3>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-border/80 to-transparent" />
        <div className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
          {recommendations.length} Actions
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((reco, i) => {
          const isHigh = reco.priority === 'high';
          return (
            <div
              key={i}
              className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-border/40 rounded-2xl p-5 transition-all duration-300 shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {/* Top accent */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] ${isHigh ? 'bg-gradient-to-r from-red-400 to-pink-500' : 'bg-gradient-to-r from-primary to-secondary'}`} />

              {/* Glow */}
              <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-[0.08] group-hover:opacity-[0.15] transition-opacity ${isHigh ? 'bg-red-500' : 'bg-primary'}`} />

              <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.12em] ${
                      isHigh ? 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {reco.priority || 'High'} Priority
                    </span>
                    <Zap className={`w-4 h-4 ${isHigh ? 'text-red-400' : 'text-primary'}`} />
                  </div>

                  <h4 className="text-base font-black leading-tight text-foreground tracking-tight">
                    {reco.appliance}
                  </h4>

                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {reco.action}
                  </p>
                </div>

                {/* Savings footer */}
                <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    <span>−{reco.unitsSaved > 0 ? reco.unitsSaved : Math.abs(reco.unitsSaved || 0)}</span>
                    <span>units</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}