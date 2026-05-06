import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Zap, IndianRupee, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: 'rupee' | 'zap' | 'trend-up' | 'trend-down';
}

const iconStyles: Record<string, { color: string; bg: string; gradFrom: string; gradTo: string; glow: string }> = {
  rupee: {
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 ring-1 ring-emerald-500/25',
    gradFrom: 'from-emerald-400', gradTo: 'to-teal-500',
    glow: 'shadow-emerald-500/20',
  },
  zap: {
    color: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/10 ring-1 ring-amber-500/25',
    gradFrom: 'from-amber-400', gradTo: 'to-orange-500',
    glow: 'shadow-amber-500/20',
  },
  'trend-up': {
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10 ring-1 ring-red-500/25',
    gradFrom: 'from-red-400', gradTo: 'to-pink-500',
    glow: 'shadow-red-500/20',
  },
  'trend-down': {
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 ring-1 ring-emerald-500/25',
    gradFrom: 'from-green-400', gradTo: 'to-emerald-500',
    glow: 'shadow-emerald-500/20',
  },
};

export function MetricCard({ title, value, description, trend, trendValue, icon }: MetricCardProps) {
  const IconComponent =
    icon === 'rupee' ? IndianRupee :
    icon === 'zap' ? Zap :
    icon === 'trend-up' ? TrendingUp :
    TrendingDown;

  const style = iconStyles[icon];

  return (
    <Card className={`group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-xl shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:${style.glow}`}>
      {/* Gradient accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${style.gradFrom} ${style.gradTo}`} />

      {/* Ambient glow orb */}
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.14] bg-gradient-to-br ${style.gradFrom} ${style.gradTo}`} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 relative z-10">
        <CardTitle className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`rounded-xl p-2.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${style.bg}`}>
          <IconComponent className={`h-4 w-4 ${style.color}`} />
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pb-5">
        <div className="text-3xl font-black tracking-tighter text-foreground leading-none">
          {value}
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground leading-tight">
          {description}
        </p>

        {trend && trendValue && (
          <div className={`mt-4 flex items-center gap-1.5 w-fit rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-tight ${
            trend === 'up'   ? 'bg-red-500/10 text-red-500 dark:text-red-400' :
            trend === 'down' ? 'bg-emerald-500/10 text-emerald-500' :
                               'bg-muted text-muted-foreground'
          }`}>
            {trend === 'up'   ? <TrendingUp className="h-3 w-3" /> :
             trend === 'down' ? <TrendingDown className="h-3 w-3" /> :
                                <Minus className="h-3 w-3" />}
            {trendValue}
          </div>
        )}
      </CardContent>
    </Card>
  );
}