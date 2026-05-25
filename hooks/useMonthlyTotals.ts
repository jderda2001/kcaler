'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToTotals, emptyTotals } from '@/lib/db';
import type { DailyTotals, Food, LogEntry } from '@/types';

export interface DayBucket {
  date: string;
  totals: DailyTotals;
  count: number;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useMonthlyTotals(year: number, month: number): {
  buckets: Map<string, DayBucket>;
  loading: boolean;
} {
  const first = useMemo(() => dateKey(new Date(year, month, 1)), [year, month]);
  const lastInclusive = useMemo(() => {
    const d = new Date(year, month + 1, 0);
    return dateKey(d);
  }, [year, month]);

  const logs = useLiveQuery(
    () => db.logs.where('date').between(first, lastInclusive, true, true).toArray(),
    [first, lastInclusive],
  );
  const foods = useLiveQuery(() => db.foods.toArray(), []);

  return useMemo(() => {
    if (!logs || !foods) {
      return { buckets: new Map(), loading: true };
    }
    const foodMap = new Map<string, Food>();
    foods.forEach((f) => foodMap.set(f.id, f));

    const buckets = new Map<string, DayBucket>();
    for (const e of logs as LogEntry[]) {
      const food = foodMap.get(e.food_id);
      if (!food) continue;
      let bucket = buckets.get(e.date);
      if (!bucket) {
        bucket = { date: e.date, totals: emptyTotals(), count: 0 };
        buckets.set(e.date, bucket);
      }
      bucket.totals = addToTotals(bucket.totals, food, e.quantity);
      bucket.count += 1;
    }
    return { buckets, loading: false };
  }, [logs, foods]);
}
