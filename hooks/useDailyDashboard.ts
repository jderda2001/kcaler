'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, addToTotals, emptyTotals, todayKey } from '@/lib/db';
import type { DailyTotals, Food, LogEntry, MealType, UserProfile } from '@/types';

export interface MealEntry {
  entry: LogEntry;
  food: Food;
  kcal: number;
}

export interface DailyDashboard {
  profile: UserProfile | undefined;
  date: string;
  totals: DailyTotals;
  byMeal: Record<MealType, { items: MealEntry[]; kcal: number }>;
  loading: boolean;
}

export function useDailyDashboard(date: string = todayKey()): DailyDashboard {
  const profile = useLiveQuery(() => db.profile.get('singleton'), []);
  const logs = useLiveQuery(() => db.logs.where('date').equals(date).toArray(), [date]);
  const allFoods = useLiveQuery(() => db.foods.toArray(), []);

  return useMemo<DailyDashboard>(() => {
    const empty: DailyDashboard = {
      profile,
      date,
      totals: emptyTotals(),
      byMeal: {
        breakfast: { items: [], kcal: 0 },
        lunch: { items: [], kcal: 0 },
        dinner: { items: [], kcal: 0 },
        snack: { items: [], kcal: 0 },
      },
      loading: logs === undefined || allFoods === undefined,
    };
    if (!logs || !allFoods) return empty;

    const foodMap = new Map<string, Food>();
    allFoods.forEach((f) => foodMap.set(f.id, f));

    let totals = emptyTotals();
    const byMeal = empty.byMeal;
    for (const e of logs) {
      const food = foodMap.get(e.food_id);
      if (!food) continue;
      totals = addToTotals(totals, food, e.quantity);
      const kcal = (food.kcal * e.quantity) / 100;
      byMeal[e.meal].items.push({ entry: e, food, kcal });
      byMeal[e.meal].kcal += kcal;
    }

    (Object.keys(byMeal) as MealType[]).forEach((m) => {
      byMeal[m].items.sort((a, b) => a.entry.created_at - b.entry.created_at);
    });

    return { profile, date, totals, byMeal, loading: false };
  }, [profile, logs, allFoods, date]);
}
