import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TYPE file_import_job_status AS ENUM (
      'pending',
      'processing',
      'completed',
      'failed'
    )
  `.execute(db);

  await db.schema
    .createTable("file_import_jobs")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("accountId", "uuid", (col) =>
      col.notNull().references("accounts.id"),
    )
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budgets.id"),
    )
    .addColumn("status", sql`file_import_job_status`, (col) =>
      col.notNull().defaultTo(sql`'pending'::file_import_job_status`),
    )
    .addColumn("file_bytes", "bytea")
    .addColumn("openai_file_id", "text")
    .addColumn("openai_raw_response", "jsonb")
    .addColumn("imported", "integer")
    .addColumn("updated", "integer")
    .addColumn("skipped", "integer")
    .addColumn("error", "text")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("file_import_jobs").execute();
  await sql`DROP TYPE IF EXISTS file_import_job_status`.execute(db);
}
