'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToTotals, emptyTotals, todayKey } from '@/lib/db';
import type { DailyTotals, Food } from '@/types';

export interface DaySummary {
  date: string;
  label: string;
  weekday: string;
  isToday: boolean;
  totals: DailyTotals;
}

const WEEKDAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useRecentDays(count = 7): { days: DaySummary[]; loading: boolean } {
  const today = todayKey();
  const firstDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1));
    return dateKey(d);
  }, [count]);

  const logs = useLiveQuery(
    () => db.logs.where('date').between(firstDate, today, true, true).toArray(),
    [firstDate, today],
  );
  const foods = useLiveQuery(() => db.foods.toArray(), []);

  return useMemo(() => {
    if (!logs || !foods) return { days: [], loading: true };

    const foodMap = new Map<string, Food>();
    foods.forEach((f) => foodMap.set(f.id, f));

    const days: DaySummary[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = dateKey(d);
      days.push({
        date: key,
        label: String(d.getDate()),
        weekday: WEEKDAY_SHORT[d.getDay()],
        isToday: key === today,
        totals: emptyTotals(),
      });
    }
    const byDate = new Map<string, DaySummary>();
    days.forEach((d) => byDate.set(d.date, d));

    for (const e of logs) {
      const food = foodMap.get(e.food_id);
      if (!food) continue;
      const day = byDate.get(e.date);
      if (!day) continue;
      day.totals = addToTotals(day.totals, food, e.quantity);
    }

    return { days, loading: false };
  }, [logs, foods, count, today]);
}
