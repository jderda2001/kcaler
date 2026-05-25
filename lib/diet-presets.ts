import type { ActivityLevel, DietPreset, Goal } from '@/types';

export const ACTIVITY_OPTIONS: Array<{
  value: ActivityLevel;
  title: string;
  description: string;
}> = [
  { value: 'sedentary', title: 'Siedzący', description: 'Praca przy biurku, brak ćwiczeń' },
  { value: 'light', title: 'Lekko aktywny', description: '1–3 treningi w tygodniu' },
  { value: 'moderate', title: 'Umiarkowanie aktywny', description: '3–5 treningów w tygodniu' },
  { value: 'active', title: 'Aktywny', description: '6–7 treningów w tygodniu' },
  {
    value: 'very_active',
    title: 'Bardzo aktywny',
    description: 'Codzienne intensywne ćwiczenia lub praca fizyczna',
  },
];

export const GOAL_OPTIONS: Array<{
  value: Goal;
  title: string;
  subtitle: string;
}> = [
  { value: 'lose', title: 'Schudnąć', subtitle: '−500 kcal' },
  { value: 'maintain', title: 'Utrzymać wagę', subtitle: '±0 kcal' },
  { value: 'gain', title: 'Przytyć', subtitle: '+300 kcal' },
];

export const DIET_OPTIONS: Array<{
  value: DietPreset;
  title: string;
  description: string;
  carbs: number;
  protein: number;
  fat: number;
  recommended?: boolean;
}> = [
  {
    value: 'balanced',
    title: 'Zbilansowana',
    description: 'Klasyczny rozkład makro, dobry punkt startu',
    carbs: 50,
    protein: 25,
    fat: 25,
    recommended: true,
  },
  {
    value: 'low_carb',
    title: 'Niskowęglowodanowa',
    description: 'Mniej węglowodanów, więcej tłuszczu i białka',
    carbs: 30,
    protein: 30,
    fat: 40,
  },
  {
    value: 'keto',
    title: 'Keto',
    description: 'Bardzo niskie węglowodany, wysoki tłuszcz',
    carbs: 5,
    protein: 25,
    fat: 70,
  },
  {
    value: 'high_protein',
    title: 'Wysokobiałkowa',
    description: 'Pod budowę masy mięśniowej / regenerację',
    carbs: 35,
    protein: 35,
    fat: 30,
  },
  {
    value: 'custom',
    title: 'Własna',
    description: 'Ustawisz w ustawieniach',
    carbs: 50,
    protein: 25,
    fat: 25,
  },
];
