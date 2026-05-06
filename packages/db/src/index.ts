import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';

type Schema = typeof schema;
let _db: ReturnType<typeof drizzle<Schema>> | null = null;

export function getDb(connectionString: string) {
  if (!_db) {
    const client = postgres(connectionString, { max: 10 });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export type Db = ReturnType<typeof getDb>;
