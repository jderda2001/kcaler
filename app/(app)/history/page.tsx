'use client';

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthlyTotals } from '@/hooks/useMonthlyTotals';
import { db } from '@/lib/db';
import { cn } from '@/lib/utils';
import { formatKcal } from '@/lib/macros';
import { DayDetailSheet } from '@/components/DayDetailSheet';
import { WeeklyChart } from '@/components/WeeklyChart';

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];

const WEEKDAY_HEAD = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(d: Date): number {
  const wd = d.getDay();
  return wd === 0 ? 6 : wd - 1;
}

export default function HistoryPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const profile = useLiveQuery(() => db.profile.get('singleton'), []);
  const kcalGoal = profile?.kcal_goal ?? 2000;

  const { buckets } = useMonthlyTotals(year, month);

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = startOfWeekMonday(first);
    const lastDay = new Date(year, month + 1, 0).getDate();
    const arr: Array<{ date: string; day: number } | null> = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(year, month, d);
      arr.push({ date: dateKey(dt), day: d });
    }
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else setMonth(month + 1);
  }

  const todayKey = dateKey(now);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="space-y-6 px-4 pt-6 pb-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Historia</h1>
      </header>

      <WeeklyChart onDayClick={(d) => setSelected(d)} />

      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Poprzedni miesiąc"
          onClick={prevMonth}
          className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold tabular-nums">
          {MONTH_NAMES[month]} {year}
        </p>
        <button
          type="button"
          aria-label="Następny miesiąc"
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div>
        <div className="text-muted-foreground mb-2 grid grid-cols-7 text-center text-[10px] font-medium uppercase tracking-wider">
          {WEEKDAY_HEAD.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d, i) => {
            if (!d) return <div key={`empty-${i}`} className="aspect-square" />;
            const bucket = buckets.get(d.date);
            const kcal = bucket?.totals.kcal ?? 0;
            const pct = kcalGoal > 0 ? Math.min(1, kcal / kcalGoal) : 0;
            const isFuture = d.date > todayKey;
            const isToday = d.date === todayKey;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => !isFuture && setSelected(d.date)}
                disabled={isFuture}
                className={cn(
                  'border-border relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-lg border p-1.5 text-left transition-all active:scale-[0.96]',
                  isFuture ? 'opacity-30' : 'hover:border-foreground/30',
                  isToday && 'border-foreground',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums',
                    isToday && 'text-foreground',
                  )}
                >
                  {d.day}
                </span>
                {kcal > 0 && (
                  <span className="text-muted-foreground text-[9px] tabular-nums">
                    {formatKcal(kcal)}
                  </span>
                )}
                <div className="bg-border absolute inset-x-1 bottom-1 h-1 overflow-hidden rounded-full">
                  <div
                    className="bg-foreground h-full transition-all"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-border bg-muted/40 flex items-center gap-3 rounded-xl border p-3">
        <div className="flex items-center gap-1.5">
          <span className="bg-border h-2 w-6 rounded-full" />
          <span className="text-muted-foreground text-xs">0%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="bg-foreground h-2 w-6 rounded-full" />
          <span className="text-muted-foreground text-xs">100% celu</span>
        </div>
      </div>

      <DayDetailSheet
        date={selected}
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}
