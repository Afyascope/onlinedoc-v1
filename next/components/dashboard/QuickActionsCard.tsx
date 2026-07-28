import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

interface QuickAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface QuickActionsCardProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function QuickActionsCard({ title = "Quick Actions", actions, columns = 4, className }: QuickActionsCardProps) {
  return (
    <div className={cn("bg-white border border-border rounded-2xl p-6 shadow-sm", className)}>
      <SectionHeader title={title} />
      <div className={cn(
        "grid gap-3",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand bg-brand/5 hover:bg-brand/10 rounded-xl transition-all duration-200"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
