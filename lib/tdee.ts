import type { ActivityLevel, DietPreset, Goal, Sex } from '@/types';

export interface BiometricInput {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
}

export interface TdeeInput extends BiometricInput {
  activity: ActivityLevel;
  goal: Goal;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function calculateBMR(p: BiometricInput): number {
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age;
  return p.sex === 'male' ? base + 5 : base - 161;
}

export function calculateTDEE(p: TdeeInput): number {
  return calculateBMR(p) * ACTIVITY_MULTIPLIERS[p.activity];
}

export function calculateKcalGoal(p: TdeeInput): number {
  return Math.round(calculateTDEE(p) + GOAL_ADJUSTMENTS[p.goal]);
}

export interface MacroGrams {
  carbs_g: number;
  protein_g: number;
  fat_g: number;
}

export function macrosFromPreset(kcal: number, preset: DietPreset): MacroGrams {
  const splits: Record<DietPreset, [number, number, number]> = {
    balanced: [0.5, 0.25, 0.25],
    low_carb: [0.3, 0.3, 0.4],
    keto: [0.05, 0.25, 0.7],
    high_protein: [0.35, 0.35, 0.3],
    custom: [0.5, 0.25, 0.25],
  };
  const [c, p, f] = splits[preset];
  return {
    carbs_g: Math.round((kcal * c) / 4),
    protein_g: Math.round((kcal * p) / 4),
    fat_g: Math.round((kcal * f) / 9),
  };
}

export function macrosFromPercents(
  kcal: number,
  pct: { carbs: number; protein: number; fat: number },
): MacroGrams {
  return {
    carbs_g: Math.round((kcal * (pct.carbs / 100)) / 4),
    protein_g: Math.round((kcal * (pct.protein / 100)) / 4),
    fat_g: Math.round((kcal * (pct.fat / 100)) / 9),
  };
}
