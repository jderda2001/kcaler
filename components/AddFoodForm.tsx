'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible } from '@/components/ui/collapsible';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addCustomFood } from '@/lib/db';
import type { Food, FoodCategory, Unit } from '@/types';

export interface AddFoodInitialValues {
  name?: string;
  unit?: Unit;
  kcal?: number | null;
  fat?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fiber?: number | null;
  sugars?: number | null;
  saturated_fat?: number | null;
  salt?: number | null;
  category?: FoodCategory;
}

interface Props {
  initial?: AddFoodInitialValues;
  badge?: React.ReactNode;
  onSaved?: (food: Food) => void;
  onCancel?: () => void;
}

const CATEGORY_OPTIONS: Array<{ value: FoodCategory; label: string }> = [
  { value: 'pieczywo', label: 'Pieczywo' },
  { value: 'nabial', label: 'Nabiał' },
  { value: 'jaja', label: 'Jaja' },
  { value: 'mieso', label: 'Mięso i wędliny' },
  { value: 'ryby', label: 'Ryby i owoce morza' },
  { value: 'warzywa', label: 'Warzywa' },
  { value: 'owoce', label: 'Owoce' },
  { value: 'zboza', label: 'Zboża i kasze' },
  { value: 'straczkowe', label: 'Strączkowe' },
  { value: 'orzechy', label: 'Orzechy i nasiona' },
  { value: 'tluszcze', label: 'Tłuszcze i oleje' },
  { value: 'slodycze', label: 'Słodycze i przekąski' },
  { value: 'napoje', label: 'Napoje' },
  { value: 'fast_food', label: 'Fast food' },
  { value: 'gotowe', label: 'Gotowe dania' },
  { value: 'inne', label: 'Inne' },
];

function toStr(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '';
  return String(v);
}

function n(v: string): number {
  const x = Number(v.replace(',', '.'));
  return Number.isFinite(x) && x >= 0 ? x : 0;
}

export function AddFoodForm({ initial, badge, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'g');
  const [category, setCategory] = useState<FoodCategory>(initial?.category ?? 'inne');
  const [kcal, setKcal] = useState(toStr(initial?.kcal));
  const [fat, setFat] = useState(toStr(initial?.fat));
  const [protein, setProtein] = useState(toStr(initial?.protein));
  const [carbs, setCarbs] = useState(toStr(initial?.carbs));
  const [fiber, setFiber] = useState(toStr(initial?.fiber));
  const [sugars, setSugars] = useState(toStr(initial?.sugars));
  const [salt, setSalt] = useState(toStr(initial?.salt));
  const [saving, setSaving] = useState(false);

  const hasName = name.trim().length > 1;
  const hasKcal = Number.isFinite(Number(kcal.replace(',', '.'))) && kcal.trim() !== '';
  const valid = hasName && hasKcal;
  const macroFilled = fat || protein || carbs;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      const sugarsVal = sugars.trim() ? n(sugars) : null;
      const saltVal = salt.trim() ? n(salt) : null;
      const id = await addCustomFood({
        name: name.trim(),
        unit,
        category,
        kcal: n(kcal),
        fat: n(fat),
        protein: n(protein),
        carbs: n(carbs),
        fiber: n(fiber),
        sugars: sugarsVal,
        salt: saltVal,
        saturated_fat: initial?.saturated_fat ?? null,
      });
      const created: Food = {
        id,
        name: name.trim(),
        unit,
        category,
        kcal: n(kcal),
        fat: n(fat),
        protein: n(protein),
        carbs: n(carbs),
        fiber: n(fiber),
        sugars: sugarsVal,
        salt: saltVal,
        saturated_fat: initial?.saturated_fat ?? null,
        is_custom: true,
        is_favorite: false,
        created_at: Date.now(),
      };
      onSaved?.(created);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 px-4 pb-6 pt-2">
      {badge && <div>{badge}</div>}

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="food-name">
            Nazwa <span className="text-[hsl(0_84%_60%)]">*</span>
          </Label>
          <Input
            id="food-name"
            placeholder="np. Pasta tahini"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus={!initial?.name}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Jednostka</Label>
            <ToggleGroup<Unit>
              options={[
                { value: 'g', label: 'g' },
                { value: 'ml', label: 'ml' },
              ]}
              value={unit}
              onChange={setUnit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat">Kategoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FoodCategory)}>
              <SelectTrigger id="cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kcal">
            Kalorie (na 100 {unit}) <span className="text-[hsl(0_84%_60%)]">*</span>
          </Label>
          <div className="relative">
            <Input
              id="kcal"
              type="number"
              inputMode="decimal"
              step="1"
              placeholder="np. 250"
              value={kcal}
              onChange={(e) => setKcal(e.target.value)}
            />
            <span className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm">
              kcal
            </span>
          </div>
        </div>
      </div>

      <Collapsible
        title="Makroskładniki"
        defaultOpen={!initial?.kcal}
        badge={
          macroFilled ? (
            <span className="bg-foreground/10 text-foreground rounded-md px-1.5 py-0.5 text-[10px]">
              wypełnione
            </span>
          ) : null
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Tłuszcz (g)" value={fat} onChange={setFat} />
          <NumberField label="Białko (g)" value={protein} onChange={setProtein} />
          <NumberField label="Węglowodany (g)" value={carbs} onChange={setCarbs} />
          <NumberField label="Błonnik (g)" value={fiber} onChange={setFiber} />
        </div>
      </Collapsible>

      <Collapsible
        title="Dodatkowe"
        defaultOpen={Boolean(initial?.sugars ?? initial?.salt)}
      >
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Cukry (g)" value={sugars} onChange={setSugars} />
          <NumberField label="Sól (g)" value={salt} onChange={setSalt} />
        </div>
      </Collapsible>

      {!valid && (
        <p className="text-muted-foreground text-center text-xs">
          {!hasName ? 'Podaj nazwę produktu' : 'Podaj wartość kalorii'}
        </p>
      )}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={onCancel}
            disabled={saving}
          >
            Anuluj
          </Button>
        )}
        <Button
          size="lg"
          className="flex-1"
          disabled={!valid || saving}
          onClick={save}
        >
          {saving ? 'Zapisuję...' : 'Zapisz produkt'}
        </Button>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        step="0.1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
