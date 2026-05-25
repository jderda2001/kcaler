import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ===== Auth.js tables =====
// Standard NextAuth tables for Drizzle adapter

export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  // Password hash for credentials-based auth (nullable for OAuth-only users)
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

// ===== Domain tables =====

export const sexEnum = pgEnum('sex', ['male', 'female']);
export const activityEnum = pgEnum('activity_level', [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
]);
export const goalEnum = pgEnum('goal', ['lose', 'maintain', 'gain']);
export const dietPresetEnum = pgEnum('diet_preset', [
  'balanced',
  'low_carb',
  'keto',
  'high_protein',
  'custom',
]);
export const unitEnum = pgEnum('unit', ['g', 'ml']);
export const mealEnum = pgEnum('meal_type', ['breakfast', 'lunch', 'dinner', 'snack']);
export const foodCategoryEnum = pgEnum('food_category', [
  'pieczywo',
  'nabial',
  'jaja',
  'mieso',
  'ryby',
  'warzywa',
  'owoce',
  'zboza',
  'straczkowe',
  'orzechy',
  'tluszcze',
  'slodycze',
  'napoje',
  'fast_food',
  'gotowe',
  'inne',
]);

export const profiles = pgTable('profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  sex: sexEnum('sex').notNull(),
  age: integer('age').notNull(),
  heightCm: doublePrecision('height_cm').notNull(),
  weightKg: doublePrecision('weight_kg').notNull(),
  activity: activityEnum('activity').notNull(),
  goal: goalEnum('goal').notNull(),
  kcalGoal: integer('kcal_goal').notNull(),
  fatG: integer('fat_g').notNull(),
  proteinG: integer('protein_g').notNull(),
  carbsG: integer('carbs_g').notNull(),
  dietPreset: dietPresetEnum('diet_preset').notNull(),
  warnHighSugar: boolean('warn_high_sugar').notNull().default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Foods: global seed (user_id NULL) + per-user custom
export const foods = pgTable('foods', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  unit: unitEnum('unit').notNull(),
  kcal: doublePrecision('kcal').notNull(),
  fat: doublePrecision('fat').notNull(),
  protein: doublePrecision('protein').notNull(),
  carbs: doublePrecision('carbs').notNull(),
  fiber: doublePrecision('fiber').notNull().default(0),
  sugars: doublePrecision('sugars'),
  saturatedFat: doublePrecision('saturated_fat'),
  salt: doublePrecision('salt'),
  isCustom: boolean('is_custom').notNull().default(false),
  isFavorite: boolean('is_favorite').notNull().default(false),
  category: foodCategoryEnum('category').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const logEntries = pgTable('log_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // 'YYYY-MM-DD'
  meal: mealEnum('meal').notNull(),
  foodId: uuid('food_id')
    .notNull()
    .references(() => foods.id, { onDelete: 'cascade' }),
  quantity: doublePrecision('quantity').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
