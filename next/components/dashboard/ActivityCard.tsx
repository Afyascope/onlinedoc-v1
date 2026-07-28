import { cn } from "@/lib/utils";
import { SectionHeader } from "./SectionHeader";

interface ActivityCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ActivityCard({ title, children, action, className }: ActivityCardProps) {
  return (
    <div className={cn(
      "bg-white border border-border rounded-2xl p-6 shadow-sm",
      className
    )}>
      <SectionHeader title={title} action={action} />
      {children}
    </div>
  );
}
