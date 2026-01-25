import * as path from "path";
import { Pool, type QueryResult } from "pg";
import { promises as fs } from "fs";
import {
  Kysely,
  Migrator,
  PostgresDialect,
  FileMigrationProvider,
  sql,
} from "kysely";

export const buildMigrator = () => {
  const db = new Kysely<unknown>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      // This needs to be an absolute path.
      migrationFolder: path.join(__dirname, "../migrations"),
    }),
  });
  return { db, migrator };
};

async function migrateToLatest() {
  const { migrator, db } = buildMigrator();

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
}

const migrateDown = async () => {
  const { migrator, db } = buildMigrator();
  const { error, results } = await migrator.migrateDown();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
};

const migrateUp = async () => {
  const { migrator, db } = buildMigrator();
  const { error, results } = await migrator.migrateUp();

  results?.forEach((it) => {
    if (it.status === "Success") {
      console.log(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      console.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    console.error("failed to migrate");
    console.error(error);
    process.exit(1);
  }

  await db.destroy();
};

const arg = Bun.argv[2];

if (arg === "up") {
  migrateUp();
} else if (arg === "down") {
  migrateDown();
} else if (arg === "latest") {
  migrateToLatest();
} else {
  console.error("Invalid argument. Use 'up', 'down' or 'latest'");
  process.exit(1);
}
