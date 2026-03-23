import { formatISO, parseISO } from "date-fns";
import type { Kysely } from "kysely";
import OpenAI from "openai";
import { config } from "../config";
import type { DB } from "../db/models";
import { budgetsService } from "./budgetsService";
import {
  computeHash,
  importTransactionsService,
  type ParsedRow,
} from "./importTransactionsService";
import {
  FILE_IMPORT_JOB_STATUS,
  type FileImportJobStatusResponse,
} from "./models";

type OpenAiTransaction = {
  amount: number;
  payee: string | null;
  description: string | null;
  date: string;
};

type OpenAiPdfResponse = {
  transactions: OpenAiTransaction[];
  observations?: string;
};

function createOpenAiClient(): OpenAI {
  return new OpenAI({ apiKey: config.openaiApiKey });
}

function convertOpenAiTransactionsToParsedRows(
  transactions: OpenAiTransaction[],
  accountId: string,
): ParsedRow[] {
  const occurrenceCounter = new Map<string, number>();
  const parsed: ParsedRow[] = [];

  for (const tx of transactions) {
    const date = parseISO(tx.date);
    if (!date) continue;

    const amountCents = Math.round(tx.amount * 100);
    const payeeName = tx.payee?.trim() || null;
    const dateISO = formatISO(date, { representation: "date" });

    // Exclude description from hash — it's less reliable in AI-parsed files
    const occurrenceKey = `${dateISO}:${amountCents}:${payeeName ?? ""}`;
    const occurrence = occurrenceCounter.get(occurrenceKey) ?? 0;
    occurrenceCounter.set(occurrenceKey, occurrence + 1);

    const hash = computeHash(
      accountId,
      dateISO,
      amountCents,
      payeeName ?? "",
      "",
      occurrence,
    );

    parsed.push({
      date,
      dateISO,
      amountCents,
      payeeName,
      notes: tx.description?.trim() || null,
      hash,
    });
  }

  return parsed;
}

async function processJob(db: Kysely<DB>, jobId: string): Promise<void> {
  const job = await db
    .selectFrom("file_import_jobs")
    .select(["accountId", "budgetId", "file_bytes"])
    .where("id", "=", jobId)
    .executeTakeFirst();

  if (!job || !job.file_bytes) {
    throw new Error("Job not found or file_bytes missing");
  }

  await db
    .updateTable("file_import_jobs")
    .set({ status: FILE_IMPORT_JOB_STATUS.PROCESSING })
    .where("id", "=", jobId)
    .execute();

  const openai = createOpenAiClient();

  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  const uploadedFile = await openai.files.create({
    file: new File([job.file_bytes], "import_file"),
    purpose: "user_data",
    expires_after: {
      anchor: "created_at",
      seconds: sevenDaysInSeconds,
    },
  });

  await db
    .updateTable("file_import_jobs")
    .set({ file_bytes: null, openai_file_id: uploadedFile.id })
    .where("id", "=", jobId)
    .execute();

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    prompt: { id: config.openaiPromptId },
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_file",
            file_id: uploadedFile.id,
          },
        ],
      },
    ],
  });

  const rawText =
    response.output_text ??
    (response as any).output?.[0]?.content?.[0]?.text ??
    "";

  const openAiResponse: OpenAiPdfResponse = JSON.parse(rawText);

  await db
    .updateTable("file_import_jobs")
    .set({ openai_raw_response: openAiResponse })
    .where("id", "=", jobId)
    .execute();

  const parsed = convertOpenAiTransactionsToParsedRows(
    openAiResponse.transactions ?? [],
    job.accountId,
  );

  const timezone = await budgetsService.getBudgetTimezone(job.budgetId);
  const result = await importTransactionsService.importParsedRows(
    db,
    job.budgetId,
    job.accountId,
    parsed,
    timezone,
  );

  await db
    .updateTable("file_import_jobs")
    .set({
      status: FILE_IMPORT_JOB_STATUS.COMPLETED,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
    })
    .where("id", "=", jobId)
    .execute();
}

export namespace fileImportService {
  export const startImportJob = async (
    db: Kysely<DB>,
    budgetId: string,
    accountId: string,
    fileBuffer: Buffer,
  ): Promise<string> => {
    const job = await db
      .insertInto("file_import_jobs")
      .values({
        accountId,
        budgetId,
        file_bytes: fileBuffer,
        status: FILE_IMPORT_JOB_STATUS.PENDING,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    processJob(db, job.id).catch((err) => {
      console.error(`File import job ${job.id} failed:`, err);
      db.updateTable("file_import_jobs")
        .set({
          status: FILE_IMPORT_JOB_STATUS.FAILED,
          error: err instanceof Error ? err.message : String(err),
        })
        .where("id", "=", job.id)
        .execute()
        .catch((updateErr) =>
          console.error(
            `Failed to update job ${job.id} status to failed:`,
            updateErr,
          ),
        );
    });

    return job.id;
  };

  export const getJobStatus = async (
    db: Kysely<DB>,
    jobId: string,
    accountId: string,
  ): Promise<FileImportJobStatusResponse | null> => {
    const job = await db
      .selectFrom("file_import_jobs")
      .select(["status", "imported", "updated", "skipped", "error"])
      .where("id", "=", jobId)
      .where("accountId", "=", accountId)
      .executeTakeFirst();

    if (!job) return null;

    return {
      status: job.status as FileImportJobStatusResponse["status"],
      imported: job.imported,
      updated: job.updated,
      skipped: job.skipped,
      error: job.error,
    };
  };
}
