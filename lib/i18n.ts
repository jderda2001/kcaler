import type { MealType } from '@/types';

export const T = {
  add: 'Dodaj',
  save: 'Zapisz',
  cancel: 'Anuluj',
  delete: 'Usuń',
  edit: 'Edytuj',
  back: 'Wstecz',
  next: 'Dalej',
  done: 'Gotowe',

  kcal: 'kcal',
  fat: 'Tłuszcz',
  protein: 'Białko',
  carbs: 'Węglowodany',
  fiber: 'Błonnik',
  sugars: 'Cukry',

  breakfast: 'Śniadanie',
  lunch: 'Obiad',
  dinner: 'Kolacja',
  snack: 'Przekąska',

  nav_today: 'Dziś',
  nav_add: 'Dodaj',
  nav_history: 'Historia',
  nav_settings: 'Ustawienia',

  no_meals_today: 'Pusty dzień — zacznij od śniadania',
  empty_meal: 'Pusto',

  search_placeholder: 'Szukaj produktu...',
  scan_label: 'Skanuj etykietę',
  add_custom: 'Dodaj własny',
  favorites: 'Ulubione',
  recent: 'Ostatnie',
  all: 'Wszystkie',

  analyzing: 'Analizuję etykietę...',
  scan_failed: 'Nie udało się odczytać etykiety. Spróbuj ponownie albo wpisz ręcznie.',
  confidence_high: 'Wysoka pewność',
  confidence_medium: 'Średnia pewność',
  confidence_low: 'Niska pewność — sprawdź wartości',
} as const;

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: T.breakfast,
  lunch: T.lunch,
  dinner: T.dinner,
  snack: T.snack,
};

// Genitive/locative case for "Dodaj do ___" phrasing
export const MEAL_LABEL_GENITIVE: Record<MealType, string> = {
  breakfast: 'śniadania',
  lunch: 'obiadu',
  dinner: 'kolacji',
  snack: 'przekąski',
};

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function mealForHour(hour: number): MealType {
  if (hour < 10) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
