import Dexie, { type Table } from 'dexie';
import type { DailyTotals, Food, LogEntry, MealType, UserProfile } from '@/types';
import {
  queueFoodDelete,
  queueFoodUpsert,
  queueLogDelete,
  queueLogUpsert,
  queueProfile,
} from '@/lib/sync';

class AppDB extends Dexie {
  profile!: Table<UserProfile, string>;
  foods!: Table<Food, string>;
  logs!: Table<LogEntry, string>;

  constructor() {
    super('kcal-tracker');
    this.version(1).stores({
      profile: 'id',
      foods: 'id, name, category, is_custom, is_favorite, created_at',
      logs: 'id, date, meal, food_id, [date+meal]',
    });
    this.version(2).stores({
      profile: 'id',
      foods: 'id, name, category, is_custom, is_favorite, created_at',
      logs: 'id, date, meal, food_id, created_at, [date+meal]',
    });
    this.version(3).stores({
      profile: 'id',
      foods: 'id, name, category, is_custom, is_favorite, created_at, updated_at, deleted',
      logs: 'id, date, meal, food_id, created_at, updated_at, deleted, [date+meal]',
    });
  }
}

export const db = new AppDB();

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getProfile(): Promise<UserProfile | undefined> {
  return db.profile.get('singleton');
}

export async function saveProfile(
  profile: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<UserProfile, 'created_at'>>,
): Promise<void> {
  const now = Date.now();
  const existing = await db.profile.get('singleton');
  const next: UserProfile = {
    ...profile,
    id: 'singleton',
    created_at: existing?.created_at ?? profile.created_at ?? now,
    updated_at: now,
  };
  await db.profile.put(next);
  queueProfile(next);
}

export async function getDailyLog(date: string): Promise<LogEntry[]> {
  return db.logs.where('date').equals(date).toArray();
}

export function emptyTotals(): DailyTotals {
  return { kcal: 0, fat: 0, protein: 0, carbs: 0, fiber: 0, sugars: 0 };
}

export function addToTotals(totals: DailyTotals, food: Food, quantity: number): DailyTotals {
  const factor = quantity / 100;
  return {
    kcal: totals.kcal + food.kcal * factor,
    fat: totals.fat + food.fat * factor,
    protein: totals.protein + food.protein * factor,
    carbs: totals.carbs + food.carbs * factor,
    fiber: totals.fiber + food.fiber * factor,
    sugars: totals.sugars + (food.sugars ?? 0) * factor,
  };
}

export async function getDailyTotals(date: string): Promise<DailyTotals> {
  const entries = await getDailyLog(date);
  if (entries.length === 0) return emptyTotals();
  const foodIds = Array.from(new Set(entries.map((e) => e.food_id)));
  const foods = await db.foods.bulkGet(foodIds);
  const foodMap = new Map<string, Food>();
  foods.forEach((f) => {
    if (f) foodMap.set(f.id, f);
  });
  let totals = emptyTotals();
  for (const entry of entries) {
    const food = foodMap.get(entry.food_id);
    if (food) totals = addToTotals(totals, food, entry.quantity);
  }
  return totals;
}

export async function getDailyLogByMeal(
  date: string,
): Promise<Record<MealType, Array<{ entry: LogEntry; food: Food }>>> {
  const entries = await getDailyLog(date);
  const foodIds = Array.from(new Set(entries.map((e) => e.food_id)));
  const foods = await db.foods.bulkGet(foodIds);
  const foodMap = new Map<string, Food>();
  foods.forEach((f) => {
    if (f) foodMap.set(f.id, f);
  });
  const result: Record<MealType, Array<{ entry: LogEntry; food: Food }>> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  for (const entry of entries) {
    const food = foodMap.get(entry.food_id);
    if (food) result[entry.meal].push({ entry, food });
  }
  return result;
}

export async function toggleFavorite(foodId: string): Promise<void> {
  const food = await db.foods.get(foodId);
  if (!food) return;
  const now = Date.now();
  const next: Food = { ...food, is_favorite: !food.is_favorite, updated_at: now };
  await db.foods.put(next);
  if (next.is_custom) queueFoodUpsert(next);
}

export async function getRecentFoods(limit = 20): Promise<Food[]> {
  const recentLogs = await db.logs.orderBy('created_at').reverse().limit(200).toArray();
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const log of recentLogs) {
    if (!seen.has(log.food_id)) {
      seen.add(log.food_id);
      ids.push(log.food_id);
      if (ids.length >= limit) break;
    }
  }
  if (ids.length === 0) return [];
  const foods = await db.foods.bulkGet(ids);
  return foods.filter((f): f is Food => Boolean(f));
}

export async function getFavoriteFoods(): Promise<Food[]> {
  const all = await db.foods.toArray();
  return all
    .filter((f) => f.is_favorite)
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export async function searchFoods(query: string, limit = 50): Promise<Food[]> {
  const q = query.trim().toLowerCase();
  if (!q) {
    return db.foods.orderBy('name').limit(limit).toArray();
  }
  const all = await db.foods.toArray();
  const normalized = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  const nq = normalized(q);
  return all
    .filter((f) => normalized(f.name).includes(nq))
    .sort((a, b) => {
      const an = normalized(a.name);
      const bn = normalized(b.name);
      const aStarts = an.startsWith(nq) ? 0 : 1;
      const bStarts = bn.startsWith(nq) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.name.localeCompare(b.name, 'pl');
    })
    .slice(0, limit);
}

export async function addLogEntry(input: Omit<LogEntry, 'id' | 'created_at'>): Promise<string> {
  const now = Date.now();
  const entry: LogEntry = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  await db.logs.add(entry);
  queueLogUpsert(entry);
  return entry.id;
}

export async function deleteLogEntry(id: string): Promise<void> {
  await db.logs.delete(id);
  queueLogDelete(id);
}

export async function updateLogEntry(id: string, patch: Partial<LogEntry>): Promise<void> {
  const now = Date.now();
  await db.logs.update(id, { ...patch, updated_at: now });
  const updated = await db.logs.get(id);
  if (updated) queueLogUpsert(updated);
}

export async function addCustomFood(
  input: Omit<Food, 'id' | 'created_at' | 'is_custom' | 'is_favorite'> & {
    is_favorite?: boolean;
  },
): Promise<string> {
  const now = Date.now();
  const food: Food = {
    ...input,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    is_custom: true,
    is_favorite: input.is_favorite ?? false,
  };
  await db.foods.add(food);
  queueFoodUpsert(food);
  return food.id;
}

export async function getFood(id: string): Promise<Food | undefined> {
  return db.foods.get(id);
}

export async function deleteCustomFood(id: string): Promise<void> {
  const food = await db.foods.get(id);
  if (!food) return;
  await db.foods.delete(id);
  if (food.is_custom) queueFoodDelete(id);
}

export async function clearAllData(): Promise<void> {
  await db.delete();
  await db.open();
}

export async function copyLogs(fromDate: string, toDate: string): Promise<number> {
  const source = await getDailyLog(fromDate);
  if (source.length === 0) return 0;
  const now = Date.now();
  const copies: LogEntry[] = source.map((e, i) => ({
    id: crypto.randomUUID(),
    date: toDate,
    meal: e.meal,
    food_id: e.food_id,
    quantity: e.quantity,
    created_at: now + i,
    updated_at: now + i,
  }));
  await db.logs.bulkAdd(copies);
  copies.forEach(queueLogUpsert);
  return copies.length;
}

export function yesterdayKey(d: Date = new Date()): string {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return todayKey(y);
}
