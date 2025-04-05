import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  const updateTimestampFunction = sql`
    CREATE OR REPLACE FUNCTION on_update_timestamp()
    RETURNS trigger AS $$
    BEGIN
      NEW."updatedAt" = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql'`.compile(db);

  await db.executeQuery(updateTimestampFunction);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.executeQuery(
    sql`DROP FUNCTION IF EXISTS on_update_timestamp`.compile(db)
  );
}
