"use client";

interface Stats {
  label: string;
  value: string;
  max: string;
  percentage: number;
}

interface StatsRowProps {
  statsData: Stats[];
  isLoadingStats: boolean;
}

export function StatsRow({ statsData, isLoadingStats }: StatsRowProps) {
  return (
    <div className="w-full bg-card border-b border-border">
      {isLoadingStats ? (
        <div className="flex justify-around py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-full mb-2" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-around py-4 text-center">
          {statsData.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                {/* Progress Circle */}
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                    <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${stat.percentage} ${100 - stat.percentage}`} className="text-blue-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {stat.percentage}%
                  </div>
                </div>
                <div className="text-xl font-semibold">{stat.value}</div>
                {stat.max && <p className="text-sm text-muted-foreground">/{stat.max}</p>}
              </div>
              <p className="text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}