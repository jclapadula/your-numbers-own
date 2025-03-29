import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull().unique())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  db.schema.dropTable("users").execute();
}
