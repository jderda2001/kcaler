import type { Food } from '@/types';

export function netCarbs(food: Food): number {
  return Math.max(0, food.carbs - food.fiber);
}

export function isHighSugar(food: Food): boolean {
  return (food.sugars ?? 0) > 5;
}

export function isKetoFriendly(food: Food): boolean {
  return netCarbs(food) <= 5;
}

export function scaleFood(food: Food, quantity: number) {
  const factor = quantity / 100;
  return {
    kcal: food.kcal * factor,
    fat: food.fat * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fiber: food.fiber * factor,
    sugars: (food.sugars ?? 0) * factor,
  };
}

export function formatKcal(n: number): string {
  return Math.round(n).toString();
}

export function formatGrams(n: number): string {
  if (n === 0) return '0';
  if (n < 10) {
    const rounded = Math.round(n * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  }
  return Math.round(n).toString();
}

export function formatPercent(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.max(0, Math.min(999, (value / goal) * 100));
}
