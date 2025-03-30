import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("users")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("externalId", "text", (col) => col.notNull().unique())
    .execute();

  await db.schema
    .createIndex("users_externalId_index")
    .on("users")
    .column("externalId")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("users_externalId_index").execute();

  await db.schema.dropTable("users").execute();
}
