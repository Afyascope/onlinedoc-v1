import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
}

export function MetricCard({ title, value, icon, description, trend, className }: MetricCardProps) {
  return (
    <div className={cn(
      "group bg-white border border-border rounded-2xl p-6 shadow-sm transition-all duration-200",
      "hover:shadow-md hover:border-brand/20",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-500 font-secondary">{title}</p>
          <p className="text-3xl font-bold text-primary font-primary tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-neutral-400 font-secondary">{description}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs font-medium flex items-center gap-1 mt-1",
              trend.positive ? "text-green-600" : "text-red-500"
            )}>
              <span>{trend.positive ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand shrink-0 group-hover:bg-brand/10 transition-colors">
          {icon}
        </div>
      </div>
    </div>
  );
}
