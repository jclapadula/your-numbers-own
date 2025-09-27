import { Kysely, sql } from "kysely";
import {
  createUpdateTimestampFunction,
  dropUpdateTimestampFunction,
} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  // Create table to store Plaid connected accounts
  await db.schema
    .createTable("plaid_accounts")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("budget_id", "uuid", (col) =>
      col.references("budgets.id").onDelete("cascade").notNull()
    )
    .addColumn("account_id", "uuid", (col) =>
      col.references("accounts.id").onDelete("cascade")
    )
    .addColumn("plaid_account_id", "text", (col) => col.notNull())
    .addColumn("plaid_item_id", "text", (col) => col.notNull())
    .addColumn("access_token", "text", (col) => col.notNull())
    .addColumn("next_cursor", "text")
    .addColumn("account_name", "text", (col) => col.notNull())
    .addColumn("account_type", "text", (col) => col.notNull())
    .addColumn("account_subtype", "text")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.defaultTo(sql`now()`).notNull()
    )
    .execute();

  await createUpdateTimestampFunction(db, "plaid_accounts");

  // Create unique index to prevent duplicate account connections
  await db.schema
    .createIndex("idx_plaid_accounts_unique")
    .on("plaid_accounts")
    .columns(["plaid_account_id", "budget_id"])
    .unique()
    .execute();

  await db.schema
    .createIndex("idx_plaid_accounts_account_id")
    .on("plaid_accounts")
    .column("account_id")
    .execute();

  // Add Plaid-specific fields to transactions table
  await db.schema
    .alterTable("transactions")
    .addColumn("plaid_transaction_id", "text")
    .addColumn("plaid_account_id", "text")
    .addColumn("merchant_name", "text")
    .execute();

  // Create index for Plaid transaction ID lookups
  await db.schema
    .createIndex("idx_transactions_plaid_id")
    .on("transactions")
    .columns(["plaid_transaction_id", "plaid_account_id"])
    .unique()
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove Plaid-specific columns from transactions
  await db.schema
    .alterTable("transactions")
    .dropColumn("plaid_transaction_id")
    .dropColumn("plaid_account_id")
    .dropColumn("merchant_name")
    .execute();

  await dropUpdateTimestampFunction(db, "plaid_accounts");

  // Drop plaid accounts table
  await db.schema.dropTable("plaid_accounts").execute();
}
