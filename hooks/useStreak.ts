'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToTotals, emptyTotals, todayKey } from '@/lib/db';
import type { Food } from '@/types';

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function useStreak(): { streak: number; loading: boolean } {
  // Look back 60 days max for streak calculation
  const today = todayKey();
  const firstDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return dateKey(d);
  }, []);

  const logs = useLiveQuery(
    () => db.logs.where('date').between(firstDate, today, true, true).toArray(),
    [firstDate, today],
  );
  const foods = useLiveQuery(() => db.foods.toArray(), []);

  return useMemo(() => {
    if (!logs || !foods) return { streak: 0, loading: true };

    const foodMap = new Map<string, Food>();
    foods.forEach((f) => foodMap.set(f.id, f));

    const kcalByDate = new Map<string, number>();
    for (const e of logs) {
      const food = foodMap.get(e.food_id);
      if (!food) continue;
      const prev = kcalByDate.get(e.date) ?? 0;
      kcalByDate.set(e.date, prev + (food.kcal * e.quantity) / 100);
    }

    const todayHas = (kcalByDate.get(today) ?? 0) > 0;
    let streak = 0;
    const start = new Date();
    if (!todayHas) start.setDate(start.getDate() - 1); // forgive today if empty

    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() - i);
      const key = dateKey(d);
      if ((kcalByDate.get(key) ?? 0) > 0) {
        streak++;
      } else {
        break;
      }
    }

    return { streak, loading: false };
  }, [logs, foods, today]);
}
