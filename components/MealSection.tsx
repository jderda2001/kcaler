'use client';

import { Plus } from 'lucide-react';
import { MEAL_LABEL } from '@/lib/i18n';
import { formatKcal } from '@/lib/macros';
import type { MealType } from '@/types';
import type { MealEntry } from '@/hooks/useDailyDashboard';

interface Props {
  meal: MealType;
  items: MealEntry[];
  kcal: number;
  onAdd: (meal: MealType) => void;
  onTapEntry: (item: MealEntry) => void;
}

export function MealSection({ meal, items, kcal, onAdd, onTapEntry }: Props) {
  return (
    <section className="space-y-2">
      <header className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold tracking-tight">{MEAL_LABEL[meal]}</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {kcal > 0 ? `${formatKcal(kcal)} kcal` : '—'}
        </span>
      </header>

      <div className="border-border bg-background overflow-hidden rounded-xl border">
        {items.length === 0 ? (
          <div className="px-4 py-3">
            <p className="text-muted-foreground text-sm">Pusto — dodaj pierwszy produkt</p>
          </div>
        ) : (
          <ul className="divide-border divide-y">
            {items.map((it) => (
              <li key={it.entry.id}>
                <button
                  type="button"
                  onClick={() => onTapEntry(it)}
                  className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors active:bg-muted/60"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{it.food.name}</div>
                    <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {it.entry.quantity}
                      {it.food.unit}
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums">
                    {formatKcal(it.kcal)} kcal
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onAdd(meal)}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex w-full items-center justify-center gap-1.5 border-t px-4 py-2.5 text-xs font-medium transition-colors active:scale-[0.99]"
        >
          <Plus className="h-3.5 w-3.5" />
          Dodaj
        </button>
      </div>
    </section>
  );
}
