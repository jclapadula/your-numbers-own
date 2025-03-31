import { Kysely, sql } from "kysely";
import {
  createUpdateTimestampFunction,
  dropUpdateTimestampFunction,
} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("accounts")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("userId", "uuid", (col) => col.notNull().references("users.id"))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await createUpdateTimestampFunction(db, "accounts");
}

export async function down(db: Kysely<any>): Promise<void> {
  await dropUpdateTimestampFunction(db, "accounts");

  await db.schema.dropTable("accounts").execute();
}
