interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
}

export function MetricGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: 1 | 2 | 3 | 4 }) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={`grid ${cols[columns]} gap-4`}>
      {children}
    </div>
  );
}

export function ContentGrid({ children, columns = 2 }: { children: React.ReactNode; columns?: 1 | 2 | 3 }) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 lg:grid-cols-2",
    3: "grid-cols-1 lg:grid-cols-3",
  };
  return (
    <div className={`grid ${cols[columns]} gap-6`}>
      {children}
    </div>
  );
}
