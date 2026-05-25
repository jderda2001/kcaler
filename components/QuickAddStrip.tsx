'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { addLogEntry, db, getRecentFoods, todayKey } from '@/lib/db';
import { CATEGORY_COLOR } from '@/lib/categories';
import { mealForHour, MEAL_LABEL_GENITIVE } from '@/lib/i18n';
import { useToast } from '@/components/Toaster';
import { cn } from '@/lib/utils';
import type { Food } from '@/types';

interface Props {
  limit?: number;
}

export function QuickAddStrip({ limit = 4 }: Props) {
  const allFoods = useLiveQuery(() => db.foods.toArray(), []);
  const [recent, setRecent] = useState<Food[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getRecentFoods(limit).then(setRecent);
  }, [allFoods, limit]);

  if (recent.length === 0) return null;

  async function quickAdd(food: Food) {
    setAdding(food.id);
    const meal = mealForHour(new Date().getHours());
    try {
      await addLogEntry({
        date: todayKey(),
        meal,
        food_id: food.id,
        quantity: 100,
      });
      toast(`+${Math.round(food.kcal)} kcal · ${food.name}`, { duration: 1600 });
    } catch (e) {
      console.error(e);
      toast('Nie udało się dodać', { type: 'error' });
    } finally {
      setTimeout(() => setAdding(null), 250);
    }
  }

  return (
    <div className="-mx-4 px-4">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Zap className="text-muted-foreground h-3.5 w-3.5" />
        <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wider">
          Szybkie dodawanie
        </p>
      </div>
      <div
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1"
        style={{ scrollbarWidth: 'none' }}
      >
        {recent.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => quickAdd(f)}
            disabled={adding === f.id}
            className={cn(
              'group border-border bg-background hover:border-foreground/30 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 transition-all active:scale-[0.97]',
              adding === f.id && 'opacity-50',
            )}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLOR[f.category] }}
            />
            <span className="text-foreground max-w-[110px] truncate text-xs font-medium">
              {f.name}
            </span>
            <span className="text-muted-foreground text-[10px] tabular-nums">
              {Math.round(f.kcal)} kcal
            </span>
          </button>
        ))}
      </div>
      <p className="text-muted-foreground mt-1.5 px-1 text-[10px]">
        Dodaje 100{recent[0]?.unit ?? 'g'} do {MEAL_LABEL_GENITIVE[mealForHour(new Date().getHours())]}
      </p>
    </div>
  );
}
