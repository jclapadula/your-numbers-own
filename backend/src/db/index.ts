// import { Database } from './types.ts' // this is the Database interface we defined earlier
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import type { DB } from "./models";
import { env } from "bun";

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

export const db = new Kysely<DB>({
  dialect,
});
