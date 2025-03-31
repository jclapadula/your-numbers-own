import { sql, type Kysely } from "kysely";
import type { DB } from "../models";

export async function createUpdateTimestampFunction(
  db: Kysely<DB>,
  table: string
) {
  await db.executeQuery(
    sql
      .raw(
        `CREATE TRIGGER ${table}_updated_at 
    BEFORE UPDATE ON ${table} 
    FOR EACH ROW 
    EXECUTE PROCEDURE on_update_timestamp();`
      )
      .compile(db)
  );
}

export async function dropUpdateTimestampFunction(
  db: Kysely<DB>,
  table: string
) {
  await db.executeQuery(
    sql
      .raw(`DROP TRIGGER IF EXISTS ${table}_updated_at ON ${table};`)
      .compile(db)
  );
}
