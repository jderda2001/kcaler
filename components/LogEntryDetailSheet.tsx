'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { Check, Trash2 } from 'lucide-react';
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
import { deleteLogEntry, updateLogEntry } from '@/lib/db';
import { MEAL_LABEL_GENITIVE } from '@/lib/i18n';
import { formatGrams, formatKcal, scaleFood } from '@/lib/macros';
import { CATEGORY_COLOR, CATEGORY_LABEL } from '@/lib/categories';
import { useToast } from '@/components/Toaster';
import type { Food, LogEntry, MealType } from '@/types';

interface Props {
  entry: LogEntry | null;
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
  onUpdated?: () => void;
}

const PRESET_QUANTITIES = [50, 100, 150, 200, 250];

type DeleteState = 'idle' | 'confirm';

export function LogEntryDetailSheet({
  entry,
  food,
  open,
  onOpenChange,
  onDeleted,
  onUpdated,
}: Props) {
  const [quantity, setQuantity] = useState<number>(100);
  const [meal, setMeal] = useState<MealType>('breakfast');
  const [saving, setSaving] = useState(false);
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');
  const { toast } = useToast();

  useEffect(() => {
    if (open && entry) {
      setQuantity(entry.quantity);
      setMeal(entry.meal);
      setSaving(false);
      setDeleteState('idle');
    } else if (!open) {
      // ensure inner confirm doesn't linger when outer closes externally
      setDeleteState('idle');
    }
  }, [open, entry]);

  const dirty = entry && (quantity !== entry.quantity || meal !== entry.meal);
  const scaled = useMemo(
    () => (food ? scaleFood(food, quantity) : null),
    [food, quantity],
  );

  async function saveChanges() {
    if (!entry || !dirty || !food) return;
    setSaving(true);
    try {
      await updateLogEntry(entry.id, { quantity, meal });
      onUpdated?.();
      onOpenChange(false);
      toast('Zapisano zmiany');
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entry || !food) return;
    const foodName = food.name; // capture before parent re-renders with null props
    try {
      await deleteLogEntry(entry.id);
      setDeleteState('idle');
      onDeleted?.();
      onOpenChange(false);
      toast(`Usunięto ${foodName}`, { type: 'info' });
    } catch (e) {
      console.error(e);
      setDeleteState('idle');
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="pb-6" onDismiss={() => onOpenChange(false)}>
        <div className="px-5 pt-2">
          {food && entry && (
            <>
              <div className="mb-3 flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[food.category] }}
                />
                <div className="min-w-0 flex-1">
                  <SheetTitle>{food.name}</SheetTitle>
                  <SheetDescription>
                    {CATEGORY_LABEL[food.category]} · {Math.round(food.kcal)} kcal / 100
                    {food.unit}
                  </SheetDescription>
                </div>
              </div>

              {scaled && (
                <div className="border-border bg-muted/40 mb-5 grid grid-cols-4 overflow-hidden rounded-xl border">
                  <Stat label="kcal" value={formatKcal(scaled.kcal)} accent fadeKey={quantity} />
                  <Stat
                    label="T"
                    value={formatGrams(scaled.fat) + 'g'}
                    color="var(--color-fat)"
                    fadeKey={quantity}
                  />
                  <Stat
                    label="B"
                    value={formatGrams(scaled.protein) + 'g'}
                    color="var(--color-protein)"
                    fadeKey={quantity}
                  />
                  <Stat
                    label="W"
                    value={formatGrams(scaled.carbs) + 'g'}
                    color="var(--color-carbs)"
                    fadeKey={quantity}
                  />
                </div>
              )}

              <div>
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

              <div className="mt-6 flex gap-2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="flex-1 text-[hsl(0_84%_60%)]"
                  onClick={() => setDeleteState('confirm')}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                  Usuń
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={saveChanges}
                  disabled={!dirty || saving}
                >
                  {saving ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {dirty ? (saving ? 'Zapisuję...' : `Zapisz do ${MEAL_LABEL_GENITIVE[meal]}`) : 'Bez zmian'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>

      <Sheet open={deleteState === 'confirm'} onOpenChange={(o) => !o && setDeleteState('idle')}>
        <SheetContent onDismiss={() => setDeleteState('idle')}>
          <div className="px-5 pt-2 pb-6">
            <SheetTitle>Usunąć ten wpis?</SheetTitle>
            <SheetDescription className="mt-2">
              {food?.name} · {entry?.quantity}
              {food?.unit} zniknie z dnia. Tej operacji nie cofniesz.
            </SheetDescription>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setDeleteState('idle')}
              >
                Anuluj
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="flex-1"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Usuń
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
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
