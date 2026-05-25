'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioCard } from '@/components/ui/radio-card';
import { ToggleGroup } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { clearAllData, getProfile, saveProfile } from '@/lib/db';
import { calculateKcalGoal, macrosFromPercents, macrosFromPreset } from '@/lib/tdee';
import { ACTIVITY_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS } from '@/lib/diet-presets';
import type { ActivityLevel, DietPreset, Goal, Sex, UserProfile } from '@/types';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Edited fields
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('sedentary');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [kcalGoal, setKcalGoal] = useState('');
  const [carbPct, setCarbPct] = useState(50);
  const [proteinPct, setProteinPct] = useState(25);
  const [fatPct, setFatPct] = useState(25);
  const [preset, setPreset] = useState<DietPreset>('balanced');
  const [warnSugar, setWarnSugar] = useState(true);

  useEffect(() => {
    getProfile().then((p) => {
      if (!p) {
        router.replace('/onboarding');
        return;
      }
      setProfile(p);
      setSex(p.sex);
      setAge(String(p.age));
      setHeight(String(p.height_cm));
      setWeight(String(p.weight_kg));
      setActivity(p.activity);
      setGoal(p.goal);
      setKcalGoal(String(p.kcal_goal));
      const total = p.fat_g * 9 + (p.protein_g + p.carbs_g) * 4;
      if (total > 0) {
        setCarbPct(Math.round(((p.carbs_g * 4) / total) * 100));
        setProteinPct(Math.round(((p.protein_g * 4) / total) * 100));
        setFatPct(Math.round(((p.fat_g * 9) / total) * 100));
      }
      setPreset(p.diet_preset);
      setWarnSugar(p.warn_high_sugar);
    });
  }, [router]);

  function recomputeTDEE() {
    const ageN = Number(age);
    const heightN = Number(height);
    const weightN = Number(weight);
    if (!ageN || !heightN || !weightN) return;
    const k = calculateKcalGoal({
      sex,
      age: ageN,
      height_cm: heightN,
      weight_kg: weightN,
      activity,
      goal,
    });
    setKcalGoal(String(k));
  }

  function applyPreset(p: DietPreset) {
    setPreset(p);
    if (p === 'custom') return;
    const opt = DIET_OPTIONS.find((o) => o.value === p);
    if (!opt) return;
    setCarbPct(opt.carbs);
    setProteinPct(opt.protein);
    setFatPct(opt.fat);
  }

  function handleMacroChange(which: 'carbs' | 'protein' | 'fat', val: number) {
    setPreset('custom');
    if (which === 'carbs') {
      const remaining = 100 - val;
      const ratio = proteinPct + fatPct;
      if (ratio === 0) {
        setCarbPct(val);
        setProteinPct(Math.round(remaining / 2));
        setFatPct(Math.round(remaining / 2));
      } else {
        setCarbPct(val);
        setProteinPct(Math.round((proteinPct / ratio) * remaining));
        setFatPct(remaining - Math.round((proteinPct / ratio) * remaining));
      }
    } else if (which === 'protein') {
      const remaining = 100 - val;
      const ratio = carbPct + fatPct;
      if (ratio === 0) {
        setProteinPct(val);
        setCarbPct(Math.round(remaining / 2));
        setFatPct(Math.round(remaining / 2));
      } else {
        setProteinPct(val);
        setCarbPct(Math.round((carbPct / ratio) * remaining));
        setFatPct(remaining - Math.round((carbPct / ratio) * remaining));
      }
    } else {
      const remaining = 100 - val;
      const ratio = carbPct + proteinPct;
      if (ratio === 0) {
        setFatPct(val);
        setCarbPct(Math.round(remaining / 2));
        setProteinPct(Math.round(remaining / 2));
      } else {
        setFatPct(val);
        setCarbPct(Math.round((carbPct / ratio) * remaining));
        setProteinPct(remaining - Math.round((carbPct / ratio) * remaining));
      }
    }
  }

  const kcalN = Number(kcalGoal);
  const macros =
    Number.isFinite(kcalN) && kcalN > 0
      ? macrosFromPercents(kcalN, { carbs: carbPct, protein: proteinPct, fat: fatPct })
      : { carbs_g: 0, protein_g: 0, fat_g: 0 };

  async function save() {
    if (!profile) return;
    setSaving(true);
    try {
      await saveProfile({
        sex,
        age: Number(age),
        height_cm: Number(height),
        weight_kg: Number(weight),
        activity,
        goal,
        kcal_goal: kcalN,
        carbs_g: macros.carbs_g,
        protein_g: macros.protein_g,
        fat_g: macros.fat_g,
        diet_preset: preset,
        warn_high_sugar: warnSugar,
      });
      router.push('/');
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  async function doClear() {
    await clearAllData();
    router.replace('/onboarding');
  }

  if (!profile) return null;

  return (
    <div className="space-y-8 px-4 pt-6 pb-6">
      <header className="flex items-center gap-2">
        <Link
          href="/settings"
          aria-label="Wstecz"
          className="hover:bg-muted -ml-2 flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Personalizacja</h1>
      </header>

      <section className="space-y-3">
        <SectionTitle>Profil</SectionTitle>
        <div className="space-y-3">
          <div>
            <Label>Płeć</Label>
            <div className="mt-2">
              <ToggleGroup<Sex>
                options={[
                  { value: 'male', label: 'Mężczyzna' },
                  { value: 'female', label: 'Kobieta' },
                ]}
                value={sex}
                onChange={(v) => {
                  setSex(v);
                  setTimeout(recomputeTDEE, 0);
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Wiek">
              <Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} onBlur={recomputeTDEE} />
            </Field>
            <Field label="Wzrost">
              <Input type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} onBlur={recomputeTDEE} />
            </Field>
            <Field label="Waga">
              <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={recomputeTDEE} />
            </Field>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Aktywność i cel</SectionTitle>
        <div>
          <Label>Poziom aktywności</Label>
          <div className="mt-2">
            <Select
              value={activity}
              onValueChange={(v) => {
                setActivity(v as ActivityLevel);
                setTimeout(recomputeTDEE, 0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Cel</Label>
          <div className="mt-2">
            <ToggleGroup<Goal>
              options={GOAL_OPTIONS.map((g) => ({
                value: g.value,
                label: g.title,
                subtitle: g.subtitle,
              }))}
              value={goal}
              onChange={(v) => {
                setGoal(v);
                setTimeout(recomputeTDEE, 0);
              }}
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Cele dzienne</SectionTitle>
        <Field label="Kalorie (kcal)">
          <Input
            type="number"
            inputMode="numeric"
            value={kcalGoal}
            onChange={(e) => setKcalGoal(e.target.value)}
          />
        </Field>

        <div className="border-border bg-muted/40 rounded-xl border p-4">
          <p className="text-muted-foreground mb-3 text-xs uppercase tracking-wider">
            Rozkład makro
          </p>
          <MacroSlider
            label="Węglowodany"
            color="var(--color-carbs)"
            value={carbPct}
            onChange={(v) => handleMacroChange('carbs', v)}
            grams={macros.carbs_g}
          />
          <MacroSlider
            label="Białko"
            color="var(--color-protein)"
            value={proteinPct}
            onChange={(v) => handleMacroChange('protein', v)}
            grams={macros.protein_g}
          />
          <MacroSlider
            label="Tłuszcz"
            color="var(--color-fat)"
            value={fatPct}
            onChange={(v) => handleMacroChange('fat', v)}
            grams={macros.fat_g}
          />
          <div className="text-muted-foreground mt-2 flex justify-between text-xs tabular-nums">
            <span>Suma: {carbPct + proteinPct + fatPct}%</span>
            {carbPct + proteinPct + fatPct !== 100 && (
              <span className="text-[hsl(38_92%_50%)]">≠ 100%</span>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Plan żywieniowy</SectionTitle>
        <div className="space-y-2">
          {DIET_OPTIONS.map((o) => (
            <RadioCard
              key={o.value}
              selected={preset === o.value}
              title={o.title}
              description={`${o.carbs}% W · ${o.protein}% B · ${o.fat}% T`}
              onClick={() => applyPreset(o.value)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Ostrzeżenia</SectionTitle>
        <button
          type="button"
          onClick={() => setWarnSugar(!warnSugar)}
          className="border-border bg-background hover:bg-muted/40 flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors"
        >
          <div className="flex-1 pr-3">
            <p className="text-sm font-medium">Ostrzegaj przy wysokim cukrze</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Pokaż banner gdy produkt ma więcej niż 5 g cukru na 100 g
            </p>
          </div>
          <span
            className={cn(
              'relative inline-block h-6 w-10 shrink-0 rounded-full transition-colors',
              warnSugar ? 'bg-foreground' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'bg-background absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-sm transition-transform',
                warnSugar && 'translate-x-4',
              )}
            />
          </span>
        </button>
      </section>

      <section className="space-y-3">
        <SectionTitle>Dane</SectionTitle>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          className="border-border hover:bg-muted/40 flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors"
        >
          <Trash2 className="text-[hsl(0_84%_60%)] h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Wyczyść wszystkie dane</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Usuwa profil, jedzenie i historię. Nieodwracalne.
            </p>
          </div>
        </button>
      </section>

      <div className="sticky bottom-20 z-20 -mx-4 border-t border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Button size="lg" className="w-full" onClick={save} disabled={saving}>
          {saving ? 'Zapisuję...' : 'Zapisz zmiany'}
        </Button>
      </div>

      <Sheet open={confirmClear} onOpenChange={setConfirmClear}>
        <SheetContent onDismiss={() => setConfirmClear(false)}>
          <div className="px-5 pt-2 pb-6">
            <SheetTitle>Na pewno wyczyścić wszystko?</SheetTitle>
            <SheetDescription className="mt-2">
              Usuniemy profil, dodane produkty, ulubione i całą historię. Tej operacji nie da się
              cofnąć.
            </SheetDescription>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setConfirmClear(false)}
              >
                Anuluj
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={doClear}>
                Wyczyść
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function MacroSlider({
  label,
  color,
  value,
  onChange,
  grams,
}: {
  label: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
  grams: number;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {value}% · {grams}g
        </span>
      </div>
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={0}
        max={100}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      >
        <SliderPrimitive.Track className="bg-border relative h-1 w-full grow rounded-full">
          <SliderPrimitive.Range
            className="absolute h-full rounded-full"
            style={{ backgroundColor: color }}
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="bg-background block h-4 w-4 rounded-full border-2 shadow-sm focus:outline-none"
          style={{ borderColor: color }}
          aria-label={label}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
