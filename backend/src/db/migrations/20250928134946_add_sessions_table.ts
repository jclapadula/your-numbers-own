import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("sessions")
    .addColumn("sid", "varchar(255)", (col) => col.primaryKey())
    .addColumn("sess", "json", (col) => col.notNull())
    .addColumn("expire", "timestamp", (col) => col.notNull())
    .execute();

  // Create index on expire for cleanup
  await db.schema
    .createIndex("sessions_expire_index")
    .on("sessions")
    .column("expire")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("sessions_expire_index").execute();
  await db.schema.dropTable("sessions").execute();
}
