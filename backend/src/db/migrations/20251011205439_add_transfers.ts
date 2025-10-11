import { Kysely, sql } from "kysely";
import {
  createUpdateTimestampFunction,
  dropUpdateTimestampFunction,
} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("transfers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("fromAccountId", "uuid", (col) =>
      col.references("accounts.id").notNull()
    )
    .addColumn("toAccountId", "uuid", (col) =>
      col.references("accounts.id").notNull()
    )
    .addColumn("createdAt", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addCheckConstraint(
      "from_to_is_different",
      sql`"fromAccountId" <> "toAccountId"`
    )
    .execute();

  await createUpdateTimestampFunction(db, "transfers");

  await db.schema
    .alterTable("transactions")
    .addColumn("transferId", "uuid", (col) => col.references("transfers.id"))
    .execute();

  await db.schema
    .createIndex("idx_transactions_transferId")
    .on("transactions")
    .column("transferId")
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("idx_transactions_transferId").execute();

  await db.schema.alterTable("transactions").dropColumn("transferId").execute();

  await dropUpdateTimestampFunction(db, "transfers");

  await db.schema.dropTable("transfers").execute();
}
