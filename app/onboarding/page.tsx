'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioCard } from '@/components/ui/radio-card';
import { ToggleGroup } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { saveProfile, getProfile } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import { calculateKcalGoal, macrosFromPreset } from '@/lib/tdee';
import { ACTIVITY_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS } from '@/lib/diet-presets';
import type { ActivityLevel, DietPreset, Goal, Sex } from '@/types';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);

  const [sex, setSex] = useState<Sex | undefined>();
  const [age, setAge] = useState<string>('');
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [activity, setActivity] = useState<ActivityLevel | undefined>();
  const [goal, setGoal] = useState<Goal | undefined>();
  const [preset, setPreset] = useState<DietPreset>('balanced');

  useEffect(() => {
    let alive = true;
    getProfile().then((p) => {
      if (!alive) return;
      if (p) router.replace('/');
      else setChecked(true);
    });
    return () => {
      alive = false;
    };
  }, [router]);

  const ageN = Number(age);
  const heightN = Number(height);
  const weightN = Number(weight);

  const step1Valid =
    sex !== undefined &&
    Number.isFinite(ageN) && ageN > 0 && ageN < 120 &&
    Number.isFinite(heightN) && heightN > 60 && heightN < 260 &&
    Number.isFinite(weightN) && weightN > 20 && weightN < 400;

  const step2Valid = activity !== undefined && goal !== undefined;

  const preview = useMemo(() => {
    if (!step1Valid || !step2Valid) return null;
    const kcal = calculateKcalGoal({
      sex: sex!,
      age: ageN,
      height_cm: heightN,
      weight_kg: weightN,
      activity: activity!,
      goal: goal!,
    });
    const macros = macrosFromPreset(kcal, preset);
    return { kcal, ...macros };
  }, [step1Valid, step2Valid, sex, ageN, heightN, weightN, activity, goal, preset]);

  async function finish() {
    if (!preview || !sex || !activity || !goal) return;
    setSaving(true);
    try {
      await seedDatabase();
      await saveProfile({
        sex,
        age: ageN,
        height_cm: heightN,
        weight_kg: weightN,
        activity,
        goal,
        diet_preset: preset,
        kcal_goal: preview.kcal,
        carbs_g: preview.carbs_g,
        protein_g: preview.protein_g,
        fat_g: preview.fat_g,
        warn_high_sugar: true,
      });
      router.replace('/');
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  }

  if (!checked) {
    return <div className="flex min-h-dvh items-center justify-center" />;
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-6 pb-6">
      <header className="mb-6 flex items-center justify-between">
        <button
          type="button"
          aria-label="Wstecz"
          onClick={() => (step > 1 ? setStep((step - 1) as Step) : null)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
            step > 1 ? 'text-foreground hover:bg-muted' : 'text-transparent',
          )}
          disabled={step === 1}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                'bg-border h-1.5 overflow-hidden rounded-full transition-all duration-300',
                i === step ? 'w-10' : 'w-6',
              )}
            >
              <span
                className={cn(
                  'bg-foreground block h-full origin-left transition-transform duration-300',
                  i <= step ? 'scale-x-100' : 'scale-x-0',
                )}
              />
            </span>
          ))}
        </div>
        <div className="w-9" />
      </header>

      <div key={step} className="flex-1 step-in">
        {step === 1 && (
          <Step1
            sex={sex}
            setSex={setSex}
            age={age}
            setAge={setAge}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
          />
        )}
        {step === 2 && (
          <Step2
            activity={activity}
            setActivity={setActivity}
            goal={goal}
            setGoal={setGoal}
          />
        )}
        {step === 3 && <Step3 preset={preset} setPreset={setPreset} preview={preview} />}
      </div>

      <div className="pt-6">
        {step === 1 && (
          <Button
            size="lg"
            className="w-full"
            disabled={!step1Valid}
            onClick={() => setStep(2)}
          >
            Dalej
          </Button>
        )}
        {step === 2 && (
          <Button
            size="lg"
            className="w-full"
            disabled={!step2Valid}
            onClick={() => setStep(3)}
          >
            Dalej
          </Button>
        )}
        {step === 3 && (
          <Button
            size="lg"
            className="w-full"
            disabled={!preview || saving}
            onClick={finish}
          >
            {saving ? 'Zapisuję...' : 'Zaczynamy'}
          </Button>
        )}
      </div>
    </div>
  );
}

function Step1(props: {
  sex: Sex | undefined;
  setSex: (s: Sex) => void;
  age: string;
  setAge: (v: string) => void;
  height: string;
  setHeight: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Powiedz nam coś o sobie</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Potrzebujemy tych danych żeby policzyć twoje dzienne zapotrzebowanie.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Płeć</Label>
        <ToggleGroup<Sex>
          options={[
            { value: 'male', label: 'Mężczyzna' },
            { value: 'female', label: 'Kobieta' },
          ]}
          value={props.sex}
          onChange={props.setSex}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="age">Wiek</Label>
          <Input
            id="age"
            type="number"
            inputMode="numeric"
            placeholder="30"
            value={props.age}
            onChange={(e) => props.setAge(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Wzrost (cm)</Label>
          <Input
            id="height"
            type="number"
            inputMode="numeric"
            placeholder="178"
            value={props.height}
            onChange={(e) => props.setHeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Waga (kg)</Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="75"
            value={props.weight}
            onChange={(e) => props.setWeight(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function Step2(props: {
  activity: ActivityLevel | undefined;
  setActivity: (a: ActivityLevel) => void;
  goal: Goal | undefined;
  setGoal: (g: Goal) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aktywność i cel</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Wybierz to, co najbardziej pasuje do twojego trybu dnia.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Poziom aktywności</Label>
        <div className="space-y-2">
          {ACTIVITY_OPTIONS.map((opt) => (
            <RadioCard
              key={opt.value}
              selected={props.activity === opt.value}
              title={opt.title}
              description={opt.description}
              onClick={() => props.setActivity(opt.value)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cel</Label>
        <ToggleGroup<Goal>
          options={GOAL_OPTIONS.map((g) => ({
            value: g.value,
            label: g.title,
            subtitle: g.subtitle,
          }))}
          value={props.goal}
          onChange={props.setGoal}
        />
      </div>
    </div>
  );
}

function Step3(props: {
  preset: DietPreset;
  setPreset: (p: DietPreset) => void;
  preview: { kcal: number; carbs_g: number; protein_g: number; fat_g: number } | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan żywieniowy</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Wybierz rozkład makro. Zawsze możesz zmienić go później w ustawieniach.
        </p>
      </div>

      <div className="space-y-2">
        {DIET_OPTIONS.map((opt) => (
          <RadioCard
            key={opt.value}
            selected={props.preset === opt.value}
            title={opt.title}
            description={
              <span>
                {opt.description}
                <br />
                <span className="text-foreground/70 font-medium">
                  {opt.carbs}% W · {opt.protein}% B · {opt.fat}% T
                </span>
              </span>
            }
            badge={
              opt.recommended ? (
                <span className="bg-foreground/5 text-foreground rounded-md px-1.5 py-0.5 text-[10px] font-medium">
                  Rekomendowane
                </span>
              ) : null
            }
            onClick={() => props.setPreset(opt.value)}
          />
        ))}
      </div>

      {props.preview && (
        <div
          key={`${props.preview.kcal}-${props.preset}`}
          className="border-foreground/20 bg-foreground/[0.02] value-fade rounded-xl border p-4"
        >
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            Twój dzienny cel
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            {props.preview.kcal}{' '}
            <span className="text-muted-foreground text-base font-normal">kcal</span>
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm tabular-nums">
            <PreviewStat label="Tłuszcz" value={props.preview.fat_g} color="var(--color-fat)" />
            <PreviewStat label="Białko" value={props.preview.protein_g} color="var(--color-protein)" />
            <PreviewStat label="Węgle" value={props.preview.carbs_g} color="var(--color-carbs)" />
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-foreground text-base font-semibold tabular-nums">{value}g</span>
      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
