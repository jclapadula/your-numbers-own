import { Kysely, sql } from "kysely";
import { createUpdateTimestampFunction, dropUpdateTimestampFunction } from "../scripts/utils";

export async function up(db: Kysely<any>): Promise<void> {

  // Drop the external ID index since we're removing it
  await db.schema.dropIndex("users_externalId_index").execute();

  // Remove the externalId column
  await db.schema.alterTable("users").dropColumn("externalId").execute();

  // Add passwordHash column
  await db.schema
    .alterTable("users")
    .addColumn("passwordHash", "text", (col) => col.notNull())
    .execute();

  // Add timestamps
  await db.schema
    .alterTable("users")
    .addColumn("createdAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("updatedAt", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  // Create email index
  await db.schema
    .createIndex("users_email_index")
    .on("users")
    .column("email")
    .execute();

  // Add updatedAt trigger
  await createUpdateTimestampFunction(db, "users");
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop trigger
  await dropUpdateTimestampFunction(db, "users");

  // Drop email index
  await db.schema.dropIndex("users_email_index").execute();

  // Remove new columns
  await db.schema.alterTable("users").dropColumn("updatedAt").execute();
  await db.schema.alterTable("users").dropColumn("createdAt").execute();
  await db.schema.alterTable("users").dropColumn("passwordHash").execute();

  // Add back externalId column
  await db.schema
    .alterTable("users")
    .addColumn("externalId", "text", (col) => col.notNull().unique())
    .execute();

  // Recreate the external ID index
  await db.schema
    .createIndex("users_externalId_index")
    .on("users")
    .column("externalId")
    .execute();
}
