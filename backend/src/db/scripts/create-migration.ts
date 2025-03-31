import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("Please provide a migration name");
  process.exit(1);
}

const templatePath = join(
  process.cwd(),
  "src",
  "db",
  "migrations",
  "0_template.ts"
);
const migrationsDir = join(process.cwd(), "src", "db", "migrations");

// Read template file
const templateContent = readFileSync(templatePath, "utf-8");

// Create timestamp
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/[:-]/g, "") // Remove colons and hyphens
  .replace(/\..+/, "") // Remove milliseconds
  .replace(/T/, "") // Replace T with a space
  .slice(0, 14); // Get YYYYMMDDHHmmss

// Create new migration file name
const newFileName = `${timestamp}_${migrationName}.ts`;
const newFilePath = join(migrationsDir, newFileName);

// Write new migration file
writeFileSync(newFilePath, templateContent);

console.log(`Created new migration: ${newFileName}`);
