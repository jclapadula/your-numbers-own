import type { Insertable, Kysely } from "kysely";
import _ from "lodash";
import { createHash } from "node:crypto";
import type { DB, Payees } from "../db/models";
import { accountBalanceService } from "./accountBalanceService";
import { balanceUpdater } from "./balanceUpdater";
import { budgetsService } from "./budgetsService";
import type { ImportConfig, ImportCsvResponse } from "./models";
import { toZonedDate } from "./ZonedDate";

type ParsedRow = {
  date: Date;
  dateISO: string;
  amountCents: number;
  payeeName: string | null;
  notes: string | null;
  hash: string;
};

class ImportRowParseError extends Error {
  constructor(
    rowNumber: number,
    row: string[],
    field: "date" | "amount",
    value: string,
  ) {
    const preview = row.join(" | ");
    super(
      `Row ${rowNumber}: could not parse ${field} — "${value}". Row: [${preview}]`,
    );
    this.name = "ImportRowParseError";
  }
}

function parseDateFromParts(
  year: number,
  month: number,
  day: number,
): Date | null {
  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isValid ? date : null;
}

function parseISODateOnlyString(datePart: string): Date | null {
  const parts = datePart.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [year, month, day] = parts as [number, number, number];
  return parseDateFromParts(year, month, day);
}

function parseISODatetime(value: string, timezone: string): Date | null {
  const datePart = value.slice(0, 10);
  const timePart = value.slice(11);
  const hasExplicitTimezone = /Z$|[+-]\d{2}(:\d{2})?$/.test(timePart);

  if (!hasExplicitTimezone) {
    // No timezone: the date part is the correct date in the budget timezone
    return parseISODateOnlyString(datePart);
  }

  // Has timezone: parse the full datetime, then extract the date in the budget timezone
  const utcDate = new Date(value);
  if (isNaN(utcDate.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(utcDate);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return parseDateFromParts(year, month, day);
}

function parseDate(
  value: string,
  format: "EU" | "US" | "ISO",
  timezone: string,
): Date | null {
  const trimmed = value.trim();

  if (
    format === "ISO" &&
    (trimmed.includes("T") || /^\d{4}-\d{2}-\d{2} /.test(trimmed))
  ) {
    return parseISODatetime(trimmed.replace(" ", "T"), timezone);
  }

  const parts = trimmed.split(/[/\-.]/);
  if (parts.length !== 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n))) return null;
  const [a, b, c] = nums as [number, number, number];

  let day: number, month: number, year: number;
  if (format === "EU") {
    [day, month, year] = [a, b, c];
  } else if (format === "ISO") {
    [year, month, day] = [a, b, c];
  } else {
    [month, day, year] = [a, b, c];
  }

  return parseDateFromParts(year, month, day);
}

function parseAmount(raw: string): number | null {
  let str = raw.trim();
  if (!str) return null;

  // Handle accounting format: (1,234.56) → negative
  const isNegative = str.startsWith("(") && str.endsWith(")");
  if (isNegative) str = str.slice(1, -1);

  // Strip currency symbols and whitespace — keep digits, period, comma, minus
  str = str.replace(/[^\d.,-]/g, "");
  if (!str) return null;

  const lastComma = str.lastIndexOf(",");
  const lastPeriod = str.lastIndexOf(".");

  let normalized: string;
  if (lastComma > lastPeriod) {
    // European: 1.234,56 → comma is decimal separator
    normalized = str.replace(/\./g, "").replace(",", ".");
  } else if (lastPeriod > lastComma) {
    // US: 1,234.56 → period is decimal separator
    normalized = str.replace(/,/g, "");
  } else if (lastComma !== -1 && lastPeriod === -1) {
    // Only commas present: detect thousands vs decimal
    const afterComma = str.slice(lastComma + 1);
    normalized =
      afterComma.length === 3
        ? str.replace(/,/g, "") // thousands separator: 1,234
        : str.replace(",", "."); // decimal separator: 1,23
  } else {
    normalized = str; // integer or already clean
  }

  const value = parseFloat(normalized);
  if (isNaN(value)) return null;
  return isNegative ? -Math.abs(value) : value;
}

function toDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function computeHash(
  accountId: string,
  dateISO: string,
  amountCents: number,
  payeeName: string,
  notes: string,
  occurrence: number,
): string {
  return createHash("sha256")
    .update(
      `${accountId}:${dateISO}:${amountCents}:${payeeName}:${notes}:${occurrence}`,
    )
    .digest("hex");
}

function parseRowAmount(row: string[], config: ImportConfig): number | null {
  if (config.singleAmountColumn) {
    if (config.amountColumn === null) return null;
    const value = parseAmount(row[config.amountColumn] ?? "");
    if (value === null) return null;
    return Math.round(value * 100);
  }

  let debitValue: number | null = null;
  let creditValue: number | null = null;

  if (config.debitColumn !== null) {
    const v = parseAmount(row[config.debitColumn] ?? "");
    if (v !== null && v !== 0) debitValue = v;
  }
  if (config.creditColumn !== null) {
    const v = parseAmount(row[config.creditColumn] ?? "");
    if (v !== null && v !== 0) creditValue = v;
  }

  if (debitValue !== null) return Math.round(-Math.abs(debitValue) * 100);
  if (creditValue !== null) return Math.round(Math.abs(creditValue) * 100);
  return null;
}

function parseRows(
  rows: string[][],
  config: ImportConfig,
  accountId: string,
  timezone: string,
): ParsedRow[] {
  const dataRows = config.firstRowIsData ? rows : rows.slice(1);
  const occurrenceCounter = new Map<string, number>();
  const parsed: ParsedRow[] = [];

  for (const [rowIndex, row] of dataRows.entries()) {
    const rowNumber = rowIndex + (config.firstRowIsData ? 1 : 2);

    if (config.dateColumn === null) {
      throw new ImportRowParseError(rowNumber, row, "date", "");
    }

    const rawDate = row[config.dateColumn] ?? "";
    const date = parseDate(rawDate, config.dateFormat, timezone);
    if (!date) {
      throw new ImportRowParseError(rowNumber, row, "date", rawDate);
    }

    const amountCents = parseRowAmount(row, config);
    if (amountCents === null) {
      const rawAmount = config.singleAmountColumn
        ? (row[config.amountColumn ?? 0] ?? "")
        : `debit: ${row[config.debitColumn ?? 0] ?? ""}, credit: ${row[config.creditColumn ?? 0] ?? ""}`;
      throw new ImportRowParseError(rowNumber, row, "amount", rawAmount);
    }

    const payeeName =
      config.payeeColumn !== null ? (row[config.payeeColumn] ?? null) : null;
    const notes =
      config.notesColumn !== null ? (row[config.notesColumn] ?? null) : null;

    const dateISO = toDateISO(date);
    const occurrenceKey = `${dateISO}:${amountCents}:${payeeName ?? ""}:${notes ?? ""}`;
    const occurrence = occurrenceCounter.get(occurrenceKey) ?? 0;
    occurrenceCounter.set(occurrenceKey, occurrence + 1);

    const hash = computeHash(
      accountId,
      dateISO,
      amountCents,
      payeeName ?? "",
      notes ?? "",
      occurrence,
    );

    parsed.push({ date, dateISO, amountCents, payeeName, notes, hash });
  }

  return parsed;
}

async function updateAccountAndMonthlyBalances(
  db: Kysely<DB>,
  budgetId: string,
  accountId: string,
  modifiedTransactions: { categoryId: string | null; date: Date }[],
  timezone: string,
) {
  if (!modifiedTransactions.length) return;

  const modifiedCategories = _(modifiedTransactions)
    .groupBy((tx) => tx.categoryId)
    .map((group) => ({
      categoryId: group[0]!.categoryId,
      maxDate: new Date(Math.max(...group.map((tx) => tx.date.getTime()))),
      minDate: new Date(Math.min(...group.map((tx) => tx.date.getTime()))),
    }))
    .value();
  const categoriesWithDateLimits = modifiedCategories.flatMap(
    ({ categoryId, maxDate, minDate }) => [
      { categoryId, date: toZonedDate(maxDate, timezone) },
      { categoryId, date: toZonedDate(minDate, timezone) },
    ],
  );

  await accountBalanceService.updateAccountBalance(
    db,
    budgetId,
    accountId,
    categoriesWithDateLimits,
  );

  const categoriesForBalanceUpdater = categoriesWithDateLimits.map(
    ({ categoryId, date }) => ({ date, categories: [categoryId] }),
  );
  await balanceUpdater.updateMonthlyBalances(
    db,
    budgetId,
    categoriesForBalanceUpdater,
  );
}

async function createMissingPayees(
  db: Kysely<DB>,
  budgetId: string,
  payeeNames: Set<string>,
) {
  if (!payeeNames.size) return;

  const existingPayees = new Set(
    (
      await db
        .selectFrom("payees")
        .select("name")
        .where("name", "in", [...payeeNames])
        .where("budgetId", "=", budgetId)
        .execute()
    ).map(({ name }) => name),
  );

  const payeesToCreate = [...payeeNames].filter(
    (name) => !existingPayees.has(name),
  );
  if (!payeesToCreate.length) return;

  await db
    .insertInto("payees")
    .values(
      payeesToCreate.map(
        (name) =>
          ({
            budgetId,
            name,
          }) satisfies Insertable<Payees>,
      ),
    )
    .execute();
}

async function getPayeeIdByName(
  db: Kysely<DB>,
  budgetId: string,
  payeeNames: Set<string>,
): Promise<Map<string, string>> {
  if (!payeeNames.size) return new Map();

  const payees = await db
    .selectFrom("payees")
    .select(["id", "name"])
    .where("name", "in", [...payeeNames])
    .where("budgetId", "=", budgetId)
    .execute();

  return new Map(payees.map(({ id, name }) => [name, id]));
}

async function fetchExistingTransactionsByHash(
  db: Kysely<DB>,
  accountId: string,
  hashes: string[],
): Promise<Map<string, { id: string; amount: number }>> {
  const existing = await db
    .selectFrom("transactions")
    .select(["id", "amount", "csv_row_hash"])
    .where("accountId", "=", accountId)
    .where("csv_row_hash", "in", hashes)
    .execute();

  return new Map(
    existing.map((t) => [t.csv_row_hash!, { id: t.id, amount: t.amount }]),
  );
}

function collectUniquePayeeNames(parsed: ParsedRow[]): Set<string> {
  return new Set(
    parsed
      .map((r) => r.payeeName)
      .filter((n): n is string => n !== null && n.trim() !== ""),
  );
}

async function upsertParsedRows(
  trx: Kysely<DB>,
  accountId: string,
  parsed: ParsedRow[],
  existingByHash: Map<string, { id: string; amount: number }>,
  payeeIdByName: Map<string, string>,
): Promise<{
  modifiedTransactions: { categoryId: string | null; date: Date }[];
  imported: number;
  updated: number;
  skipped: number;
}> {
  const modifiedTransactions: { categoryId: string | null; date: Date }[] = [];
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of parsed) {
    const existing = existingByHash.get(row.hash);

    if (existing) {
      const isUserZeroed = Number(existing.amount) === 0;
      const isSameAmount = Number(existing.amount) === row.amountCents;
      if (isUserZeroed || isSameAmount) {
        skipped++;
      } else {
        await trx
          .updateTable("transactions")
          .set({ amount: row.amountCents })
          .where("id", "=", existing.id)
          .execute();
        modifiedTransactions.push({ categoryId: null, date: row.date });
        updated++;
      }
    } else {
      const payeeId = row.payeeName
        ? (payeeIdByName.get(row.payeeName) ?? null)
        : null;

      await trx
        .insertInto("transactions")
        .values({
          accountId,
          date: row.date,
          amount: row.amountCents,
          categoryId: null,
          isReconciled: false,
          notes: row.notes,
          payeeId,
          csv_row_hash: row.hash,
        })
        .execute();

      modifiedTransactions.push({ categoryId: null, date: row.date });
      imported++;
    }
  }

  return { modifiedTransactions, imported, updated, skipped };
}

export namespace importTransactionsService {
  export const importTransactions = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    config: ImportConfig,
    rows: string[][],
  ): Promise<ImportCsvResponse> => {
    const timezone = await budgetsService.getBudgetTimezone(budgetId);
    const parsed = parseRows(rows, config, accountId, timezone);

    if (!parsed.length) {
      return { imported: 0, updated: 0, skipped: 0 };
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    await db
      .transaction()
      .setIsolationLevel("serializable")
      .execute(async (trx) => {
        const existingByHash = await fetchExistingTransactionsByHash(
          trx,
          accountId,
          parsed.map((r: ParsedRow) => r.hash),
        );

        const uniquePayeeNames = collectUniquePayeeNames(parsed);
        await createMissingPayees(trx, budgetId, uniquePayeeNames);
        const payeeIdByName = await getPayeeIdByName(
          trx,
          budgetId,
          uniquePayeeNames,
        );

        const result = await upsertParsedRows(
          trx,
          accountId,
          parsed,
          existingByHash,
          payeeIdByName,
        );

        ({ imported, updated, skipped } = result);

        await updateAccountAndMonthlyBalances(
          trx,
          budgetId,
          accountId,
          result.modifiedTransactions,
          timezone,
        );
      });

    return { imported, updated, skipped };
  };
}
