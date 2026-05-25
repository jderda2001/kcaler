'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { MacroRing } from '@/components/MacroRing';
import { FoodSearchSheet } from '@/components/FoodSearchSheet';
import { LogEntryDetailSheet } from '@/components/LogEntryDetailSheet';
import { useDailyDashboard, type MealEntry } from '@/hooks/useDailyDashboard';
import { MEAL_LABEL, MEAL_ORDER, mealForHour } from '@/lib/i18n';
import { formatGrams, formatKcal } from '@/lib/macros';
import { todayKey } from '@/lib/db';
import type { MealType } from '@/types';

interface Props {
  date: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function DayDetailSheet({ date, open, onOpenChange }: Props) {
  const dash = useDailyDashboard(date ?? '');
  const profile = dash.profile;
  const kcalGoal = profile?.kcal_goal ?? 2000;

  const [addOpen, setAddOpen] = useState(false);
  const [initialMeal, setInitialMeal] = useState<MealType | undefined>();
  const [tapped, setTapped] = useState<MealEntry | null>(null);

  // Reset internal state when date changes / sheet closes
  useEffect(() => {
    if (!open) {
      setAddOpen(false);
      setTapped(null);
    }
  }, [open]);

  function openAdd(meal?: MealType) {
    setInitialMeal(meal ?? mealForHour(new Date().getHours()));
    setAddOpen(true);
  }

  const isToday = date === todayKey();
  const hasData = dash.totals.kcal > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="full" className="flex flex-col p-0">
        <div className="border-border flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="min-w-0 flex-1 pr-12">
            <SheetTitle className="truncate capitalize">
              {date ? formatDate(date) : ''}
            </SheetTitle>
            <SheetDescription className="sr-only">
              Podgląd dnia: kalorie, makro i posiłki.
            </SheetDescription>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          <div className="flex flex-col items-center">
            <MacroRing
              size={200}
              stroke={12}
              value={dash.totals.kcal}
              goal={kcalGoal}
              color="var(--color-kcal)"
              ariaLabel="Postęp kalorii"
            >
              <span className="text-foreground text-3xl font-semibold tabular-nums">
                {formatKcal(dash.totals.kcal)}
              </span>
              <span className="text-muted-foreground mt-1 text-xs tabular-nums">
                z {kcalGoal} kcal
              </span>
            </MacroRing>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat
              label="Tłuszcz"
              value={dash.totals.fat}
              goal={profile?.fat_g ?? 0}
              color="var(--color-fat)"
            />
            <MiniStat
              label="Białko"
              value={dash.totals.protein}
              goal={profile?.protein_g ?? 0}
              color="var(--color-protein)"
            />
            <MiniStat
              label="Węgle"
              value={dash.totals.carbs}
              goal={profile?.carbs_g ?? 0}
              color="var(--color-carbs)"
            />
          </div>

          {!hasData && (
            <button
              type="button"
              onClick={() => openAdd()}
              className="border-border hover:border-foreground/40 hover:bg-muted/40 group flex w-full items-center justify-between rounded-xl border border-dashed p-5 text-left transition-all active:scale-[0.99]"
            >
              <div>
                <p className="text-sm font-semibold">
                  {isToday ? 'Pusty dzień' : 'Nic nie zostało zapisane'}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Dodaj wpisy, nawet jeśli to dzień wstecz
                </p>
              </div>
              <span className="bg-foreground text-background flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-active:scale-95">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
              </span>
            </button>
          )}

          <div className="space-y-3">
            {MEAL_ORDER.map((m: MealType) => {
              const sec = dash.byMeal[m];
              return (
                <section
                  key={m}
                  className="border-border bg-background overflow-hidden rounded-xl border"
                >
                  <header className="border-border flex items-center justify-between border-b px-4 py-2.5">
                    <h2 className="text-sm font-semibold">{MEAL_LABEL[m]}</h2>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {sec.kcal > 0 ? `${formatKcal(sec.kcal)} kcal` : '—'}
                    </span>
                  </header>
                  {sec.items.length === 0 ? (
                    <p className="text-muted-foreground px-4 py-3 text-sm">Pusto</p>
                  ) : (
                    <ul className="divide-border divide-y">
                      {sec.items.map((it) => (
                        <li key={it.entry.id}>
                          <button
                            type="button"
                            onClick={() => setTapped(it)}
                            className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors active:bg-muted/60"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm">{it.food.name}</div>
                              <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                                {it.entry.quantity}
                                {it.food.unit}
                              </div>
                            </div>
                            <span className="text-sm tabular-nums">
                              {formatKcal(it.kcal)} kcal
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => openAdd(m)}
                    className="border-border text-muted-foreground hover:text-foreground hover:bg-muted flex w-full items-center justify-center gap-1.5 border-t px-4 py-2.5 text-xs font-medium transition-colors active:scale-[0.99]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Dodaj
                  </button>
                </section>
              );
            })}
          </div>
        </div>

        <FoodSearchSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          initialMeal={initialMeal}
          date={date ?? undefined}
          onLogged={() => setAddOpen(false)}
        />

        <LogEntryDetailSheet
          entry={tapped?.entry ?? null}
          food={tapped?.food ?? null}
          open={Boolean(tapped)}
          onOpenChange={(o) => !o && setTapped(null)}
        />
      </SheetContent>
    </Sheet>
  );
}

function MiniStat({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  return (
    <div className="border-border bg-background flex flex-col items-center rounded-xl border p-3">
      <MacroRing size={48} stroke={4} value={value} goal={goal} color={color}>
        <span className="text-[9px] font-semibold tabular-nums">{Math.round(pct * 100)}%</span>
      </MacroRing>
      <p className="mt-1.5 text-xs font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
        {formatGrams(value)} / {goal}g
      </p>
    </div>
  );
}
