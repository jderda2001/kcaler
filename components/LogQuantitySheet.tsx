'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { addLogEntry, todayKey } from '@/lib/db';
import { mealForHour, MEAL_LABEL, MEAL_LABEL_GENITIVE } from '@/lib/i18n';
import { formatGrams, formatKcal, isHighSugar, scaleFood } from '@/lib/macros';
import { CATEGORY_COLOR } from '@/lib/categories';
import { useToast } from '@/components/Toaster';
import type { Food, MealType } from '@/types';

interface Props {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMeal?: MealType;
  /** Date in 'YYYY-MM-DD' format. Defaults to today. */
  date?: string;
  onSaved?: () => void;
  warnHighSugar?: boolean;
}

const PRESET_QUANTITIES = [50, 100, 150, 200, 250];

type SaveState = 'idle' | 'saving' | 'done';

export function LogQuantitySheet({
  food,
  open,
  onOpenChange,
  initialMeal,
  date,
  onSaved,
  warnHighSugar,
}: Props) {
  const [quantity, setQuantity] = useState<number>(100);
  const [meal, setMeal] = useState<MealType>(initialMeal ?? 'breakfast');
  const [state, setState] = useState<SaveState>('idle');
  const { toast } = useToast();

  useEffect(() => {
    if (open && food) {
      setQuantity(100);
      setMeal(initialMeal ?? mealForHour(new Date().getHours()));
      setState('idle');
    }
  }, [open, food, initialMeal]);

  const scaled = useMemo(() => (food ? scaleFood(food, quantity) : null), [food, quantity]);
  const sugarWarn = food && warnHighSugar ? isHighSugar(food) : false;

  async function save() {
    if (!food || state !== 'idle') return;
    setState('saving');
    try {
      await addLogEntry({
        date: date ?? todayKey(),
        meal,
        food_id: food.id,
        quantity,
      });
      const kcal = food.kcal * (quantity / 100);
      setState('done');
      // brief checkmark moment, then close + toast
      setTimeout(() => {
        toast(`+${Math.round(kcal)} kcal · ${food.name}`);
        onSaved?.();
        onOpenChange(false);
      }, 350);
    } catch (e) {
      console.error(e);
      setState('idle');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="pb-6" onDismiss={() => onOpenChange(false)}>
        <div className="px-5 pt-2">
          {food && (
            <>
              <div className="mb-1">
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLOR[food.category] }}
                  />
                  <div className="min-w-0 flex-1">
                    <SheetTitle>{food.name}</SheetTitle>
                    <SheetDescription>
                      {Math.round(food.kcal)} kcal · 100{food.unit} · {formatGrams(food.fat)}T · {formatGrams(food.protein)}B · {formatGrams(food.carbs)}W
                    </SheetDescription>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-foreground text-sm font-medium">
                  Ilość ({food.unit})
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={2000}
                    value={quantity}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v)) setQuantity(Math.max(0, Math.min(2000, v)));
                    }}
                    className="w-24 text-center text-lg font-semibold tabular-nums"
                  />
                  <span className="text-muted-foreground text-sm">{food.unit}</span>
                </div>

                <Slider.Root
                  className="relative mt-4 flex h-5 w-full touch-none select-none items-center"
                  min={0}
                  max={500}
                  step={5}
                  value={[Math.min(500, quantity)]}
                  onValueChange={([v]) => setQuantity(v)}
                >
                  <Slider.Track className="bg-border relative h-1 w-full grow rounded-full">
                    <Slider.Range className="bg-foreground absolute h-full rounded-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="bg-background border-foreground block h-5 w-5 rounded-full border-2 shadow-sm focus:outline-none"
                    aria-label="Ilość"
                  />
                </Slider.Root>

                <div className="mt-3 flex flex-wrap gap-2">
                  {PRESET_QUANTITIES.map((q) => {
                    const matches = Math.abs(quantity - q) < 5;
                    return (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setQuantity(q)}
                        className={cn(
                          'min-h-[36px] rounded-lg border px-3 text-xs font-medium transition-all active:scale-[0.97]',
                          matches
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                        )}
                      >
                        {q}
                        {food.unit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5">
                <label className="text-foreground text-sm font-medium">Posiłek</label>
                <div className="mt-2">
                  <ToggleGroup<MealType>
                    options={[
                      { value: 'breakfast', label: 'Śniadanie' },
                      { value: 'lunch', label: 'Obiad' },
                      { value: 'dinner', label: 'Kolacja' },
                      { value: 'snack', label: 'Przekąska' },
                    ]}
                    value={meal}
                    onChange={setMeal}
                  />
                </div>
              </div>

              {sugarWarn && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-[hsl(38_92%_50%)]/30 bg-[hsl(38_92%_50%)]/5 p-3">
                  <AlertCircle className="text-[hsl(38_92%_50%)] mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-foreground text-xs">
                    Ten produkt ma dużo cukru ({food.sugars}g/100). Sprawdź czy mieści się w planie.
                  </p>
                </div>
              )}

              {scaled && (
                <div className="border-border bg-muted/40 mt-5 grid grid-cols-4 overflow-hidden rounded-xl border">
                  <Stat label="kcal" value={formatKcal(scaled.kcal)} accent fadeKey={quantity} />
                  <Stat label="T" value={formatGrams(scaled.fat) + 'g'} color="var(--color-fat)" fadeKey={quantity} />
                  <Stat label="B" value={formatGrams(scaled.protein) + 'g'} color="var(--color-protein)" fadeKey={quantity} />
                  <Stat label="W" value={formatGrams(scaled.carbs) + 'g'} color="var(--color-carbs)" fadeKey={quantity} />
                </div>
              )}

              <Button
                size="lg"
                className="mt-5 w-full"
                onClick={save}
                disabled={quantity <= 0 || state !== 'idle'}
              >
                {state === 'saving' && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {state === 'done' && <Check className="h-4 w-4" />}
                {state === 'idle' && `Dodaj do ${MEAL_LABEL_GENITIVE[meal]}`}
                {state === 'saving' && 'Zapisuję...'}
                {state === 'done' && 'Dodano'}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  accent = false,
  color,
  fadeKey,
}: {
  label: string;
  value: string;
  accent?: boolean;
  color?: string;
  fadeKey?: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3">
      <span
        key={value}
        className={cn(
          'tabular-nums value-fade',
          accent
            ? 'text-foreground text-lg font-semibold'
            : 'text-foreground text-sm font-medium',
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          'mt-0.5 text-[10px] font-medium uppercase tracking-wider',
          color ? '' : 'text-muted-foreground',
        )}
        style={color ? { color } : undefined}
      >
        {label}
      </span>
    </div>
  );
}
