export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type DietPreset = 'balanced' | 'low_carb' | 'keto' | 'high_protein' | 'custom';
export type Unit = 'g' | 'ml';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodCategory =
  | 'pieczywo'
  | 'nabial'
  | 'jaja'
  | 'mieso'
  | 'ryby'
  | 'warzywa'
  | 'owoce'
  | 'zboza'
  | 'straczkowe'
  | 'orzechy'
  | 'tluszcze'
  | 'slodycze'
  | 'napoje'
  | 'fast_food'
  | 'gotowe'
  | 'inne';

export interface UserProfile {
  id: 'singleton';
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: ActivityLevel;
  goal: Goal;
  kcal_goal: number;
  fat_g: number;
  protein_g: number;
  carbs_g: number;
  diet_preset: DietPreset;
  warn_high_sugar: boolean;
  created_at: number;
  updated_at: number;
}

export interface Food {
  id: string;
  name: string;
  unit: Unit;
  kcal: number;
  fat: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugars?: number | null;
  saturated_fat?: number | null;
  salt?: number | null;
  is_custom: boolean;
  is_favorite: boolean;
  category: FoodCategory;
  created_at: number;
}

export interface LogEntry {
  id: string;
  date: string;
  meal: MealType;
  food_id: string;
  quantity: number;
  created_at: number;
}

export interface DailyTotals {
  kcal: number;
  fat: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugars: number;
}

export interface LogEntryWithFood extends LogEntry {
  food: Food;
  totals: DailyTotals;
}
