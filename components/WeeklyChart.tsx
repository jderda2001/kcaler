'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useRecentDays } from '@/hooks/useRecentDays';
import { db } from '@/lib/db';
import { formatKcal } from '@/lib/macros';
import { cn } from '@/lib/utils';

interface Props {
  onDayClick?: (date: string) => void;
}

export function WeeklyChart({ onDayClick }: Props) {
  const profile = useLiveQuery(() => db.profile.get('singleton'), []);
  const { days } = useRecentDays(7);
  const goal = profile?.kcal_goal ?? 2000;

  const max = Math.max(goal * 1.1, ...days.map((d) => d.totals.kcal));
  const avgKcal =
    days.length > 0
      ? days.reduce((s, d) => s + d.totals.kcal, 0) / days.filter((d) => d.totals.kcal > 0).length
      : 0;
  const validAvg = Number.isFinite(avgKcal) ? Math.round(avgKcal) : 0;

  return (
    <div className="border-border bg-background space-y-3 rounded-xl border p-4">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Ostatnie 7 dni</h3>
        <p className="text-muted-foreground text-xs tabular-nums">
          {validAvg > 0 ? `średnio ${validAvg} kcal` : ''}
        </p>
      </header>

      <div className="relative h-32">
        <div
          className="border-foreground/20 absolute left-0 right-0 border-t border-dashed"
          style={{ top: `${(1 - goal / max) * 100}%` }}
          aria-hidden
        />
        <div
          className="text-muted-foreground absolute -translate-y-2.5 text-[9px] tabular-nums"
          style={{ top: `${(1 - goal / max) * 100}%`, right: 0 }}
        >
          cel
        </div>
        <div className="flex h-full items-end gap-2">
          {days.map((d) => {
            const kcal = d.totals.kcal;
            const pct = max > 0 ? kcal / max : 0;
            const overshoot = kcal > goal;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => onDayClick?.(d.date)}
                disabled={kcal === 0}
                className="group flex flex-1 flex-col items-center justify-end gap-1.5 disabled:cursor-default"
              >
                <span
                  className={cn(
                    'w-full origin-bottom rounded-md transition-all duration-500 ease-out',
                    kcal === 0
                      ? 'bg-border/60 h-1'
                      : overshoot
                        ? 'bg-[hsl(0_70%_45%)]'
                        : d.isToday
                          ? 'bg-foreground'
                          : 'bg-foreground/30 group-hover:bg-foreground/50',
                  )}
                  style={{
                    height: kcal === 0 ? '4px' : `${Math.max(4, pct * 100)}%`,
                  }}
                  aria-label={`${d.label}: ${formatKcal(kcal)} kcal`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        {days.map((d) => (
          <div key={d.date} className="flex-1 text-center">
            <p
              className={cn(
                'text-[10px] uppercase tracking-wider',
                d.isToday ? 'text-foreground font-semibold' : 'text-muted-foreground',
              )}
            >
              {d.weekday}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
