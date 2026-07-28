import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  icon,
  description,
  className,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-white border border-border rounded-2xl p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 font-secondary">{title}</p>
          <p className="text-3xl font-bold text-primary mt-1 font-primary">{value}</p>
          {description && (
            <p className="text-xs text-neutral-400 mt-1">{description}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
          {icon}
        </div>
      </div>
    </div>
  );
}
