import { NextResponse, type NextRequest } from 'next/server';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db';

export const runtime = 'nodejs';

type IsoString = string;

interface PullResponse {
  serverTime: IsoString;
  profile: ProfileDTO | null;
  foods: FoodDTO[];
  logs: LogEntryDTO[];
}

interface ProfileDTO {
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

interface FoodDTO {
  id: string;
  name: string;
  unit: 'g' | 'ml';
  kcal: number;
  fat: number;
  protein: number;
  carbs: number;
  fiber: number;
  sugars: number | null;
  saturated_fat: number | null;
  salt: number | null;
  is_custom: boolean;
  is_favorite: boolean;
  category: string;
  created_at: number;
  updated_at: number;
  deleted?: boolean;
}

interface LogEntryDTO {
  id: string;
  date: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  food_id: string;
  quantity: number;
  created_at: number;
  updated_at: number;
  deleted?: boolean;
}

interface PushBody {
  profile?: ProfileDTO | null;
  foods?: { upsert?: FoodDTO[]; deleteIds?: string[] };
  logs?: { upsert?: LogEntryDTO[]; deleteIds?: string[] };
}

function toMs(d: Date | string | number | null | undefined): number {
  if (!d) return 0;
  return new Date(d).getTime();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const since = req.nextUrl.searchParams.get('since');
  const sinceDate = since ? new Date(Number(since)) : null;

  try {
    const profileRows = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);
    const profile = profileRows[0] ?? null;

    const foodsQ = sinceDate
      ? and(eq(schema.foods.userId, userId), gt(schema.foods.updatedAt, sinceDate))
      : eq(schema.foods.userId, userId);
    const foodsRows = await db.select().from(schema.foods).where(foodsQ);

    const logsQ = sinceDate
      ? and(eq(schema.logEntries.userId, userId), gt(schema.logEntries.updatedAt, sinceDate))
      : eq(schema.logEntries.userId, userId);
    const logsRows = await db.select().from(schema.logEntries).where(logsQ);

    const payload: PullResponse = {
      serverTime: new Date().toISOString(),
      profile: profile
        ? {
            sex: profile.sex,
            age: profile.age,
            height_cm: profile.heightCm,
            weight_kg: profile.weightKg,
            activity: profile.activity,
            goal: profile.goal,
            kcal_goal: profile.kcalGoal,
            fat_g: profile.fatG,
            protein_g: profile.proteinG,
            carbs_g: profile.carbsG,
            diet_preset: profile.dietPreset,
            warn_high_sugar: profile.warnHighSugar,
            created_at: toMs(profile.createdAt),
            updated_at: toMs(profile.updatedAt),
          }
        : null,
      foods: foodsRows.map((f) => ({
        id: f.id,
        name: f.name,
        unit: f.unit,
        kcal: f.kcal,
        fat: f.fat,
        protein: f.protein,
        carbs: f.carbs,
        fiber: f.fiber,
        sugars: f.sugars,
        saturated_fat: f.saturatedFat,
        salt: f.salt,
        is_custom: f.isCustom,
        is_favorite: f.isFavorite,
        category: f.category,
        created_at: toMs(f.createdAt),
        updated_at: toMs(f.updatedAt),
        deleted: f.deleted,
      })),
      logs: logsRows.map((l) => ({
        id: l.id,
        date: l.date,
        meal: l.meal,
        food_id: l.foodId,
        quantity: l.quantity,
        created_at: toMs(l.createdAt),
        updated_at: toMs(l.updatedAt),
        deleted: l.deleted,
      })),
    };

    return NextResponse.json(payload);
  } catch (err) {
    console.error('sync GET error', err);
    return NextResponse.json({ error: 'Sync read failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: PushBody;
  try {
    body = (await req.json()) as PushBody;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const now = new Date();

  try {
    // Profile upsert
    if (body.profile) {
      const p = body.profile;
      await db
        .insert(schema.profiles)
        .values({
          userId,
          sex: p.sex,
          age: p.age,
          heightCm: p.height_cm,
          weightKg: p.weight_kg,
          activity: p.activity as never,
          goal: p.goal as never,
          kcalGoal: p.kcal_goal,
          fatG: p.fat_g,
          proteinG: p.protein_g,
          carbsG: p.carbs_g,
          dietPreset: p.diet_preset as never,
          warnHighSugar: p.warn_high_sugar,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.profiles.userId,
          set: {
            sex: p.sex,
            age: p.age,
            heightCm: p.height_cm,
            weightKg: p.weight_kg,
            activity: p.activity as never,
            goal: p.goal as never,
            kcalGoal: p.kcal_goal,
            fatG: p.fat_g,
            proteinG: p.protein_g,
            carbsG: p.carbs_g,
            dietPreset: p.diet_preset as never,
            warnHighSugar: p.warn_high_sugar,
            updatedAt: now,
          },
        });
    }

    // Foods upsert
    if (body.foods?.upsert && body.foods.upsert.length > 0) {
      const values = body.foods.upsert.map((f) => ({
        id: f.id,
        userId,
        name: f.name,
        unit: f.unit,
        kcal: f.kcal,
        fat: f.fat,
        protein: f.protein,
        carbs: f.carbs,
        fiber: f.fiber,
        sugars: f.sugars,
        saturatedFat: f.saturated_fat,
        salt: f.salt,
        isCustom: f.is_custom,
        isFavorite: f.is_favorite,
        category: f.category as never,
        createdAt: new Date(f.created_at || Date.now()),
        updatedAt: now,
        deleted: false,
      }));
      for (const v of values) {
        await db
          .insert(schema.foods)
          .values(v)
          .onConflictDoUpdate({
            target: schema.foods.id,
            set: {
              name: v.name,
              unit: v.unit,
              kcal: v.kcal,
              fat: v.fat,
              protein: v.protein,
              carbs: v.carbs,
              fiber: v.fiber,
              sugars: v.sugars,
              saturatedFat: v.saturatedFat,
              salt: v.salt,
              isCustom: v.isCustom,
              isFavorite: v.isFavorite,
              category: v.category,
              updatedAt: now,
              deleted: false,
            },
          });
      }
    }

    // Foods soft delete
    if (body.foods?.deleteIds && body.foods.deleteIds.length > 0) {
      await db
        .update(schema.foods)
        .set({ deleted: true, updatedAt: now })
        .where(
          and(
            eq(schema.foods.userId, userId),
            inArray(schema.foods.id, body.foods.deleteIds),
          ),
        );
    }

    // Logs upsert
    if (body.logs?.upsert && body.logs.upsert.length > 0) {
      const values = body.logs.upsert.map((l) => ({
        id: l.id,
        userId,
        date: l.date,
        meal: l.meal,
        foodId: l.food_id,
        quantity: l.quantity,
        createdAt: new Date(l.created_at || Date.now()),
        updatedAt: now,
        deleted: false,
      }));
      for (const v of values) {
        await db
          .insert(schema.logEntries)
          .values(v)
          .onConflictDoUpdate({
            target: schema.logEntries.id,
            set: {
              date: v.date,
              meal: v.meal,
              foodId: v.foodId,
              quantity: v.quantity,
              updatedAt: now,
              deleted: false,
            },
          });
      }
    }

    // Logs soft delete
    if (body.logs?.deleteIds && body.logs.deleteIds.length > 0) {
      await db
        .update(schema.logEntries)
        .set({ deleted: true, updatedAt: now })
        .where(
          and(
            eq(schema.logEntries.userId, userId),
            inArray(schema.logEntries.id, body.logs.deleteIds),
          ),
        );
    }

    return NextResponse.json({ ok: true, serverTime: now.toISOString() });
  } catch (err) {
    console.error('sync POST error', err);
    return NextResponse.json(
      { error: 'Sync write failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
