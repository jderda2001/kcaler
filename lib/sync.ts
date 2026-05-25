'use client';

import { db } from '@/lib/db';
import type { Food, LogEntry, UserProfile } from '@/types';

const LAST_SYNC_KEY = 'kcal:last-sync-ms';
const SYNC_STATUS_KEY = 'kcal:sync-status'; // 'idle' | 'syncing' | 'error' | 'offline'

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

type Listener = (status: SyncStatus, lastSync: number | null) => void;
const listeners = new Set<Listener>();
let currentStatus: SyncStatus = 'idle';

function readLastSync(): number | null {
  if (typeof localStorage === 'undefined') return null;
  const v = localStorage.getItem(LAST_SYNC_KEY);
  return v ? Number(v) : null;
}

function setLastSync(ms: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LAST_SYNC_KEY, String(ms));
}

function setStatus(s: SyncStatus): void {
  currentStatus = s;
  if (typeof localStorage !== 'undefined') localStorage.setItem(SYNC_STATUS_KEY, s);
  const ls = readLastSync();
  listeners.forEach((l) => l(s, ls));
}

export function subscribeSyncStatus(fn: Listener): () => void {
  listeners.add(fn);
  fn(currentStatus, readLastSync());
  return () => listeners.delete(fn);
}

interface PullResponse {
  serverTime: string;
  profile: ServerProfile | null;
  foods: ServerFood[];
  logs: ServerLog[];
}

interface ServerProfile {
  sex: 'male' | 'female';
  age: number;
  height_cm: number;
  weight_kg: number;
  activity: string;
  goal: string;
  kcal_goal: number;
  fat_g: number;
  protein_g: number;
  carbs_g: number;
  diet_preset: string;
  warn_high_sugar: boolean;
  created_at: number;
  updated_at: number;
}

type ServerFood = Food & { deleted?: boolean };
type ServerLog = LogEntry & { deleted?: boolean };

/**
 * Pull all user data from server.
 * Merges into local IndexedDB (server wins for items with newer updated_at).
 */
export async function syncDown(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setStatus('offline');
    return;
  }
  setStatus('syncing');
  try {
    const res = await fetch('/api/sync', { credentials: 'include' });
    if (res.status === 401) {
      setStatus('idle');
      return; // not logged in
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as PullResponse;

    if (data.profile) {
      const localProfile = await db.profile.get('singleton');
      const serverUpdated = data.profile.updated_at;
      const localUpdated = localProfile?.updated_at ?? 0;
      if (serverUpdated >= localUpdated) {
        const merged: UserProfile = {
          id: 'singleton',
          sex: data.profile.sex,
          age: data.profile.age,
          height_cm: data.profile.height_cm,
          weight_kg: data.profile.weight_kg,
          activity: data.profile.activity as UserProfile['activity'],
          goal: data.profile.goal as UserProfile['goal'],
          kcal_goal: data.profile.kcal_goal,
          fat_g: data.profile.fat_g,
          protein_g: data.profile.protein_g,
          carbs_g: data.profile.carbs_g,
          diet_preset: data.profile.diet_preset as UserProfile['diet_preset'],
          warn_high_sugar: data.profile.warn_high_sugar,
          created_at: data.profile.created_at || Date.now(),
          updated_at: serverUpdated,
        };
        await db.profile.put(merged);
      }
    }

    for (const f of data.foods) {
      if (f.deleted) {
        await db.foods.delete(f.id);
        continue;
      }
      const existing = await db.foods.get(f.id);
      const localUpdated = existing?.updated_at ?? 0;
      if ((f.updated_at ?? 0) >= localUpdated) {
        await db.foods.put({
          id: f.id,
          name: f.name,
          unit: f.unit,
          kcal: f.kcal,
          fat: f.fat,
          protein: f.protein,
          carbs: f.carbs,
          fiber: f.fiber,
          sugars: f.sugars ?? null,
          saturated_fat: f.saturated_fat ?? null,
          salt: f.salt ?? null,
          is_custom: f.is_custom,
          is_favorite: f.is_favorite,
          category: f.category,
          created_at: f.created_at || Date.now(),
          updated_at: f.updated_at ?? Date.now(),
        });
      }
    }

    for (const l of data.logs) {
      if (l.deleted) {
        await db.logs.delete(l.id);
        continue;
      }
      const existing = await db.logs.get(l.id);
      const localUpdated = existing?.updated_at ?? 0;
      if ((l.updated_at ?? 0) >= localUpdated) {
        await db.logs.put({
          id: l.id,
          date: l.date,
          meal: l.meal,
          food_id: l.food_id,
          quantity: l.quantity,
          created_at: l.created_at || Date.now(),
          updated_at: l.updated_at ?? Date.now(),
        });
      }
    }

    setLastSync(Date.parse(data.serverTime));
    setStatus('idle');
  } catch (err) {
    console.warn('syncDown failed', err);
    setStatus('error');
  }
}

interface PushBody {
  profile?: ServerProfile | null;
  foods?: { upsert?: Food[]; deleteIds?: string[] };
  logs?: { upsert?: LogEntry[]; deleteIds?: string[] };
}

async function pushBatch(body: PushBody): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.status === 401) return; // logged out — silently skip
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('pushBatch failed', err);
    // For MVP we don't retry — Phase 2 will add a retry queue
  }
}

/**
 * Full upward sync — pushes everything custom locally to server.
 * Use after first login to claim local data.
 */
export async function syncUp(): Promise<void> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  setStatus('syncing');
  try {
    const profile = await db.profile.get('singleton');
    const allFoods = await db.foods.toArray();
    const customFoods = allFoods.filter((f) => f.is_custom);
    const allLogs = await db.logs.toArray();

    const profileDTO: ServerProfile | null = profile
      ? {
          sex: profile.sex,
          age: profile.age,
          height_cm: profile.height_cm,
          weight_kg: profile.weight_kg,
          activity: profile.activity,
          goal: profile.goal,
          kcal_goal: profile.kcal_goal,
          fat_g: profile.fat_g,
          protein_g: profile.protein_g,
          carbs_g: profile.carbs_g,
          diet_preset: profile.diet_preset,
          warn_high_sugar: profile.warn_high_sugar,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
      : null;

    await pushBatch({
      profile: profileDTO,
      foods: { upsert: customFoods },
      logs: { upsert: allLogs },
    });
    setLastSync(Date.now());
    setStatus('idle');
  } catch (err) {
    console.warn('syncUp failed', err);
    setStatus('error');
  }
}

// ----- Incremental push helpers (fire-and-forget after each local mutation) -----

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const pendingFoods = new Map<string, Food>();
const pendingFoodDeletes = new Set<string>();
const pendingLogs = new Map<string, LogEntry>();
const pendingLogDeletes = new Set<string>();
let pendingProfile: ServerProfile | null | undefined;

function flushSoon(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void flush(), 600);
}

async function flush(): Promise<void> {
  if (
    !pendingProfile &&
    pendingFoods.size === 0 &&
    pendingFoodDeletes.size === 0 &&
    pendingLogs.size === 0 &&
    pendingLogDeletes.size === 0
  ) {
    return;
  }
  const body: PushBody = {};
  if (pendingProfile !== undefined) body.profile = pendingProfile;
  if (pendingFoods.size > 0 || pendingFoodDeletes.size > 0) {
    body.foods = {
      upsert: pendingFoods.size > 0 ? Array.from(pendingFoods.values()) : undefined,
      deleteIds: pendingFoodDeletes.size > 0 ? Array.from(pendingFoodDeletes) : undefined,
    };
  }
  if (pendingLogs.size > 0 || pendingLogDeletes.size > 0) {
    body.logs = {
      upsert: pendingLogs.size > 0 ? Array.from(pendingLogs.values()) : undefined,
      deleteIds: pendingLogDeletes.size > 0 ? Array.from(pendingLogDeletes) : undefined,
    };
  }
  pendingProfile = undefined;
  pendingFoods.clear();
  pendingFoodDeletes.clear();
  pendingLogs.clear();
  pendingLogDeletes.clear();

  setStatus('syncing');
  await pushBatch(body);
  setLastSync(Date.now());
  setStatus('idle');
}

export function queueProfile(profile: UserProfile): void {
  pendingProfile = {
    sex: profile.sex,
    age: profile.age,
    height_cm: profile.height_cm,
    weight_kg: profile.weight_kg,
    activity: profile.activity,
    goal: profile.goal,
    kcal_goal: profile.kcal_goal,
    fat_g: profile.fat_g,
    protein_g: profile.protein_g,
    carbs_g: profile.carbs_g,
    diet_preset: profile.diet_preset,
    warn_high_sugar: profile.warn_high_sugar,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
  flushSoon();
}

export function queueFoodUpsert(food: Food): void {
  if (!food.is_custom) return; // never sync seed
  pendingFoods.set(food.id, food);
  pendingFoodDeletes.delete(food.id);
  flushSoon();
}

export function queueFoodDelete(id: string): void {
  pendingFoodDeletes.add(id);
  pendingFoods.delete(id);
  flushSoon();
}

export function queueLogUpsert(log: LogEntry): void {
  pendingLogs.set(log.id, log);
  pendingLogDeletes.delete(log.id);
  flushSoon();
}

export function queueLogDelete(id: string): void {
  pendingLogDeletes.add(id);
  pendingLogs.delete(id);
  flushSoon();
}

export function getLastSync(): number | null {
  return readLastSync();
}

export function getStatus(): SyncStatus {
  return currentStatus;
}
