import { Pool, types } from "pg";
import {
  Kysely,
  PostgresDialect,
  HandleEmptyInListsPlugin,
  replaceWithNoncontingentExpression,
} from "kysely";
import type { DB } from "./models";
import { env } from "bun";

const int8TypeId = 20;
// Map int8 to number.
types.setTypeParser(int8TypeId, (val: string) => {
  return parseInt(val, 10);
});

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_URL,
  }),
});

export const db = new Kysely<DB>({
  dialect,
  plugins: [
    new HandleEmptyInListsPlugin({
      strategy: replaceWithNoncontingentExpression,
    }),
  ],
});
