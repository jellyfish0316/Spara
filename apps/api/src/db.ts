import { getDb } from '@spara/db';

export const db = getDb(process.env.DATABASE_URL!);