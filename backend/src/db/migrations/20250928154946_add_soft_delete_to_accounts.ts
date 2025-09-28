import { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("accounts")
    .addColumn("deletedAt", "timestamp")
    .execute();

  await db.schema
    .createIndex("accounts_deletedAt_index")
    .on("accounts")
    .column("deletedAt")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropIndex("accounts_deletedAt_index")
    .execute();

  await db.schema
    .alterTable("accounts")
    .dropColumn("deletedAt")
    .execute();
}
