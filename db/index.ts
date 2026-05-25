import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Avoid throwing at import-time during build; throw lazily on first use
  console.warn('[db] DATABASE_URL is not set. Server-side DB queries will fail.');
}

const client = connectionString
  ? postgres(connectionString, { prepare: false, max: 5 })
  : (postgres('postgres://noop:noop@localhost/noop', { max: 1 }) as ReturnType<typeof postgres>);

export const db = drizzle(client, { schema });
export { schema };
