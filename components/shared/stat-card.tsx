import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  accent?: 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

const accentStyles = {
  primary: 'bg-primary/10 border-primary/20 text-primary',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  destructive: 'bg-destructive/10 border-destructive/20 text-destructive',
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  accent = 'primary',
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'glass-panel border-border/50 hover:border-border transition-all duration-300 hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl border',
              accentStyles[accent]
            )}
          >
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-2 mt-4">
            <span
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend >= 0 ? 'text-success' : 'text-destructive'
              )}
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
