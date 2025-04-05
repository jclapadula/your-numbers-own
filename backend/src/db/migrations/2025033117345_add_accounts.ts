import { Kysely, sql } from "kysely";
import {
  createUpdateTimestampFunction,
  dropUpdateTimestampFunction,
} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("budget")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("ownerId", "uuid", (col) => col.notNull().references("users.id"))
    .execute();

  await db.schema
    .createIndex("budget_ownerId_index")
    .on("budget")
    .column("ownerId")
    .execute();

  await db.schema
    .createTable("accounts")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("budgetId", "uuid", (col) =>
      col.notNull().references("budget.id")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createIndex("accounts_budgetId_index")
    .on("accounts")
    .column("budgetId")
    .execute();

  await createUpdateTimestampFunction(db, "accounts");
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdateTimestampFunction(db, "accounts");

  await db.schema.dropIndex("accounts_budgetId_index").execute();
  await db.schema.dropTable("accounts").execute();

  await db.schema.dropIndex("budget_ownerId_index").execute();
  await db.schema.dropTable("budget").execute();
}
