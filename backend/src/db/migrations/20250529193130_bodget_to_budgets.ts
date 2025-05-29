import { Kysely, sql } from "kysely";
import {} from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("budget").renameTo("budgets").execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable("budgets").renameTo("budget").execute();
}
