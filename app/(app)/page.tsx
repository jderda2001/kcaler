'use client';

import { useEffect, useState } from 'react';
import { Flame, Plus, UtensilsCrossed } from 'lucide-react';
import { MacroRing } from '@/components/MacroRing';
import { MealSection } from '@/components/MealSection';
import { FoodSearchSheet } from '@/components/FoodSearchSheet';
import { QuickAddStrip } from '@/components/QuickAddStrip';
import { CopyYesterdayButton } from '@/components/CopyYesterdayButton';
import { LogEntryDetailSheet } from '@/components/LogEntryDetailSheet';
import type { MealEntry } from '@/hooks/useDailyDashboard';
import { useDailyDashboard } from '@/hooks/useDailyDashboard';
import { useStreak } from '@/hooks/useStreak';
import { MEAL_LABEL, MEAL_ORDER, mealForHour } from '@/lib/i18n';
import { formatGrams, formatKcal } from '@/lib/macros';
import { cn } from '@/lib/utils';
import type { MealType } from '@/types';

export default function DashboardPage() {
  const dash = useDailyDashboard();
  const { streak } = useStreak();
  const [open, setOpen] = useState(false);
  const [initialMeal, setInitialMeal] = useState<MealType | undefined>();
  const [pulse, setPulse] = useState(false);
  const [tappedEntry, setTappedEntry] = useState<MealEntry | null>(null);

  const profile = dash.profile;
  const kcalGoal = profile?.kcal_goal ?? 2000;
  const remaining = kcalGoal - dash.totals.kcal;
  const isEmpty = dash.totals.kcal === 0;
  const overshoot = remaining < 0;

  useEffect(() => {
    if (isEmpty && !dash.loading) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 2400);
      return () => clearTimeout(t);
    }
    setPulse(false);
  }, [isEmpty, dash.loading]);

  function openAdd(meal?: MealType) {
    setInitialMeal(meal);
    setOpen(true);
    setPulse(false);
  }

  const nextMealNow = mealForHour(new Date().getHours());
  const visibleMeals = isEmpty ? [] : MEAL_ORDER.filter((m) => dash.byMeal[m].items.length > 0);

  return (
    <div className="space-y-6 px-4 pt-6 pb-6">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dziś</h1>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <span
              className="flex items-center gap-1 rounded-full bg-[hsl(15_85%_55%)]/10 px-2 py-0.5 text-[11px] font-semibold text-[hsl(15_75%_45%)] tabular-nums"
              title={`${streak} dni z rzędu z wpisami`}
            >
              <Flame className="h-3 w-3 fill-[hsl(15_85%_55%)]" />
              {streak}
            </span>
          )}
          <p className="text-muted-foreground text-xs tabular-nums">
            {new Date().toLocaleDateString('pl-PL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </header>

      <div className="flex flex-col items-center pt-2">
        <MacroRing
          size={240}
          stroke={14}
          value={dash.totals.kcal}
          goal={kcalGoal}
          color="var(--color-kcal)"
          ariaLabel="Postęp kalorii"
        >
          {isEmpty ? (
            <>
              <UtensilsCrossed
                className="text-muted-foreground/60 h-9 w-9"
                strokeWidth={1.5}
              />
              <span className="text-foreground mt-3 text-base font-medium">
                Co dziś zjadłeś?
              </span>
              <span className="text-muted-foreground mt-1 text-xs tabular-nums">
                cel: {kcalGoal} kcal
              </span>
            </>
          ) : (
            <>
              <span className="text-foreground text-4xl font-semibold tabular-nums">
                {formatKcal(dash.totals.kcal)}
              </span>
              <span className="text-muted-foreground mt-1 text-sm tabular-nums">
                z {kcalGoal} kcal
              </span>
              <span
                className={cn(
                  'mt-2 text-xs tabular-nums',
                  overshoot ? 'text-[hsl(0_70%_45%)]' : 'text-muted-foreground',
                )}
              >
                {overshoot
                  ? `Przekroczono o ${formatKcal(-remaining)} kcal`
                  : `Zostało ${formatKcal(remaining)} kcal`}
              </span>
            </>
          )}
        </MacroRing>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MacroPanel
          label="Tłuszcz"
          value={dash.totals.fat}
          goal={profile?.fat_g ?? 0}
          color="var(--color-fat)"
        />
        <MacroPanel
          label="Białko"
          value={dash.totals.protein}
          goal={profile?.protein_g ?? 0}
          color="var(--color-protein)"
        />
        <MacroPanel
          label="Węgle"
          value={dash.totals.carbs}
          goal={profile?.carbs_g ?? 0}
          color="var(--color-carbs)"
        />
      </div>

      {isEmpty ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => openAdd(nextMealNow)}
            className="border-border hover:border-foreground/40 hover:bg-muted/40 group flex w-full items-center justify-between rounded-xl border border-dashed p-5 text-left transition-all active:scale-[0.99]"
          >
            <div>
              <p className="text-sm font-semibold">
                Zacznij od {MEAL_LABEL[nextMealNow].toLowerCase()}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Stuknij, żeby dodać pierwszy produkt
              </p>
            </div>
            <span className="bg-foreground text-background flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform group-active:scale-95">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </span>
          </button>
          <CopyYesterdayButton />
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <QuickAddStrip />
          {visibleMeals.map((m) => (
            <MealSection
              key={m}
              meal={m}
              items={dash.byMeal[m].items}
              kcal={dash.byMeal[m].kcal}
              onAdd={openAdd}
              onTapEntry={setTappedEntry}
            />
          ))}
          {visibleMeals.length < 4 && (
            <button
              type="button"
              onClick={() => openAdd()}
              className="border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition-colors active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              Dodaj kolejny posiłek
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label="Dodaj jedzenie"
        onClick={() => openAdd()}
        className={cn(
          'bg-foreground text-background fixed bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95',
          pulse && 'fab-pulse',
        )}
        style={{ right: 'max(1rem, calc((100vw - 28rem) / 2 + 1rem))' }}
      >
        <Plus className="h-6 w-6" strokeWidth={2.25} />
      </button>

      <FoodSearchSheet
        open={open}
        onOpenChange={setOpen}
        initialMeal={initialMeal}
        onLogged={() => setOpen(false)}
      />

      <LogEntryDetailSheet
        entry={tappedEntry?.entry ?? null}
        food={tappedEntry?.food ?? null}
        open={Boolean(tappedEntry)}
        onOpenChange={(o) => !o && setTappedEntry(null)}
      />
    </div>
  );
}

function MacroPanel({
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
  const isEmpty = value === 0;
  return (
    <div className="border-border bg-background flex flex-col items-center rounded-xl border p-3">
      <MacroRing size={56} stroke={5} value={value} goal={goal} color={color}>
        <span
          className={cn(
            'text-[10px] font-semibold tabular-nums',
            isEmpty ? 'text-muted-foreground/60' : 'text-foreground',
          )}
        >
          {Math.round(pct * 100)}%
        </span>
      </MacroRing>
      <p className="mt-2 text-xs font-medium">{label}</p>
      <p className="text-muted-foreground mt-0.5 text-[10px] tabular-nums">
        {formatGrams(value)} / {goal}g
      </p>
    </div>
  );
}
