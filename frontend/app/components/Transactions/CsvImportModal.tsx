import { useState, useRef } from "react";
import { Modal } from "../Common/Modal";

type Step = "select-file" | "configure";

type ImportConfig = {
  firstRowIsData: boolean;
  dateColumn: number | null;
  dateFormat: "EU" | "US" | "ISO";
  singleAmountColumn: boolean;
  amountColumn: number | null;
  debitColumn: number | null;
  creditColumn: number | null;
  payeeColumn: number | null;
  notesColumn: number | null;
};

type CsvImportModalProps = {
  onClose: () => void;
};

function getColumnLabels(rows: string[][], firstRowIsData: boolean): string[] {
  if (rows.length === 0) return [];
  const columnCount = rows[0].length;
  if (!firstRowIsData) {
    return rows[0];
  }
  return Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
}

function getColumnSampleValue(
  rows: string[][],
  colIndex: number,
  firstRowIsData: boolean
): string | null {
  const sampleRow = firstRowIsData ? rows[0] : rows[1];
  return sampleRow?.[colIndex] ?? null;
}

type ColumnSelectProps = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  rows: string[][];
  firstRowIsData: boolean;
  optional?: boolean;
};

const ColumnSelect = ({
  label,
  value,
  onChange,
  rows,
  firstRowIsData,
  optional,
}: ColumnSelectProps) => {
  const columnLabels = getColumnLabels(rows, firstRowIsData);

  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">
        {label}
        {optional && (
          <span className="text-base-content/50 font-normal ml-1">
            (optional)
          </span>
        )}
      </legend>
      <select
        className="select select-bordered w-full"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
      >
        <option value="">(none)</option>
        {columnLabels.map((colLabel, i) => {
          const sample = getColumnSampleValue(rows, i, firstRowIsData);
          const displayLabel = firstRowIsData
            ? `${colLabel}${sample ? ` – "${sample}"` : ""}`
            : colLabel;
          return (
            <option key={i} value={i}>
              {displayLabel}
            </option>
          );
        })}
      </select>
    </fieldset>
  );
};

function parseDate(value: string, format: "EU" | "US" | "ISO"): Date | null {
  const parts = value.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map(Number);
  if ([a, b, c].some(isNaN)) return null;

  let day: number, month: number, year: number;
  if (format === "EU") {
    [day, month, year] = [a, b, c];
  } else if (format === "ISO") {
    [year, month, day] = [a, b, c];
  } else {
    [month, day, year] = [a, b, c];
  }

  const date = new Date(year, month - 1, day);
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;
  return isValid ? date : null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

type PreviewRow = {
  rawDate: string;
  parsedDate: string | null;
  payee: string | null;
  notes: string | null;
  payment: number | null;
  deposit: number | null;
};

function buildPreviewRow(
  row: string[],
  config: ImportConfig
): PreviewRow {
  const rawDate =
    config.dateColumn !== null ? (row[config.dateColumn] ?? "") : "";

  const parsedDateObj = rawDate
    ? parseDate(rawDate, config.dateFormat)
    : null;
  const parsedDate = parsedDateObj ? formatDate(parsedDateObj) : null;

  const payee =
    config.payeeColumn !== null ? (row[config.payeeColumn] ?? null) : null;
  const notes =
    config.notesColumn !== null ? (row[config.notesColumn] ?? null) : null;

  let payment: number | null = null;
  let deposit: number | null = null;

  if (config.singleAmountColumn && config.amountColumn !== null) {
    const raw = row[config.amountColumn] ?? "";
    const value = parseFloat(raw.replace(/[, ]/g, ""));
    if (!isNaN(value)) {
      if (value < 0) {
        payment = Math.abs(value);
      } else {
        deposit = value;
      }
    }
  } else if (!config.singleAmountColumn) {
    if (config.debitColumn !== null) {
      const raw = row[config.debitColumn] ?? "";
      const value = parseFloat(raw.replace(/[, ]/g, ""));
      if (!isNaN(value) && value !== 0) payment = Math.abs(value);
    }
    if (config.creditColumn !== null) {
      const raw = row[config.creditColumn] ?? "";
      const value = parseFloat(raw.replace(/[, ]/g, ""));
      if (!isNaN(value) && value !== 0) deposit = Math.abs(value);
    }
  }

  return { rawDate, parsedDate, payee, notes, payment, deposit };
}

const PreviewSection = ({
  rows,
  config,
}: {
  rows: string[][];
  config: ImportConfig;
}) => {
  const [expanded, setExpanded] = useState(true);
  const dataRows = config.firstRowIsData ? rows : rows.slice(1);
  const hasRows = dataRows.length > 0;

  return (
    <div>
      <button
        className="flex items-center gap-1 text-sm font-semibold text-base-content/70 hover:text-base-content transition-colors mb-1"
        onClick={() => setExpanded((v) => !v)}
        disabled={!hasRows}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`size-3.5 transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Preview
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          {hasRows && <ImportPreview rows={rows} config={config} />}
        </div>
      </div>
    </div>
  );
};

const ImportPreview = ({
  rows,
  config,
}: {
  rows: string[][];
  config: ImportConfig;
}) => {
  const dataRows = config.firstRowIsData ? rows : rows.slice(1);
  const previewRows = dataRows.slice(0, 5).map((r) => buildPreviewRow(r, config));

  if (previewRows.length === 0) return null;

  return (
    <div className="mt-2">
      <p className="text-sm font-semibold mb-1">Preview</p>
      <div className="overflow-x-auto rounded border border-base-content/10">
        <table className="table table-xs w-full">
          <thead>
            <tr>
              <th>Date</th>
              {config.payeeColumn !== null && <th>Payee</th>}
              {config.notesColumn !== null && <th>Notes</th>}
              <th className="text-right">Payment</th>
              <th className="text-right">Deposit</th>
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i}>
                <td>
                  {row.parsedDate ? (
                    row.parsedDate
                  ) : row.rawDate ? (
                    <span className="text-warning">{row.rawDate}</span>
                  ) : (
                    <span className="text-base-content/30">—</span>
                  )}
                </td>
                {config.payeeColumn !== null && (
                  <td>
                    {row.payee || (
                      <span className="text-base-content/30">—</span>
                    )}
                  </td>
                )}
                {config.notesColumn !== null && (
                  <td>
                    {row.notes || (
                      <span className="text-base-content/30">—</span>
                    )}
                  </td>
                )}
                <td className="text-right">
                  {row.payment != null ? (
                    row.payment.toFixed(2)
                  ) : (
                    <span className="text-base-content/30">—</span>
                  )}
                </td>
                <td className="text-right">
                  {row.deposit != null ? (
                    row.deposit.toFixed(2)
                  ) : (
                    <span className="text-base-content/30">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CsvImportModal = ({ onClose }: CsvImportModalProps) => {
  const [step, setStep] = useState<Step>("select-file");
  const [rows, setRows] = useState<string[][]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<ImportConfig>({
    firstRowIsData: false,
    dateColumn: null,
    dateFormat: "EU",
    singleAmountColumn: true,
    amountColumn: null,
    debitColumn: null,
    creditColumn: null,
    payeeColumn: null,
    notesColumn: null,
  });

  const updateConfig = <K extends keyof ImportConfig>(
    key: K,
    value: ImportConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsParsing(true);

    try {
      const text = await file.text();
      const Papa = await import("papaparse");
      const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
      if (result.errors.length > 0 && result.data.length === 0) {
        setFileError("Could not parse the CSV file. Please check the format.");
        return;
      }
      setRows(result.data);
      setStep("configure");
    } catch {
      setFileError("Failed to read the file.");
    } finally {
      setIsParsing(false);
    }
  };

  const isImportReady = (() => {
    if (config.dateColumn === null) return false;
    if (config.singleAmountColumn) return config.amountColumn !== null;
    return config.debitColumn !== null || config.creditColumn !== null;
  })();

  const handleImport = () => {
    console.log("CSV Import config:", config);
    console.log("CSV rows:", rows);
    onClose();
  };

  if (step === "select-file") {
    return (
      <Modal title="Import transactions" onClose={onClose}>
        <div className="flex flex-col gap-3">
          <p className="text-sm text-base-content/70">
            Select a CSV file to import transactions.
          </p>
          <div
            className="border-2 border-dashed border-base-content/20 rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-10 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <span className="text-sm text-base-content/60">
              Click to select a CSV file
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {isParsing && (
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              <span className="loading loading-spinner loading-xs" />
              Parsing file…
            </div>
          )}
          {fileError && (
            <div className="alert alert-error text-sm">{fileError}</div>
          )}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Configure import"
      onClose={onClose}
      onBack={() => setStep("select-file")}
      onSave={handleImport}
      onSaveDisabled={!isImportReady}
      saveButtonText="Import"
    >
      <div className="flex flex-col max-h-[65vh]">
        {/* Scrollable config form */}
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 min-h-0 pb-2">
          {/* First row */}
          <fieldset className="fieldset">
            <label className="fieldset-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={config.firstRowIsData}
                onChange={(e) =>
                  updateConfig("firstRowIsData", e.target.checked)
                }
              />
              <span>First row is data (no header row)</span>
            </label>
          </fieldset>

          {/* Date config */}
          <ColumnSelect
            label="Date column"
            value={config.dateColumn}
            onChange={(v) => updateConfig("dateColumn", v)}
            rows={rows}
            firstRowIsData={config.firstRowIsData}
          />

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Date format</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm"
                  name="dateFormat"
                  checked={config.dateFormat === "EU"}
                  onChange={() => updateConfig("dateFormat", "EU")}
                />
                <span className="text-sm">EU (DD/MM/YYYY)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm"
                  name="dateFormat"
                  checked={config.dateFormat === "US"}
                  onChange={() => updateConfig("dateFormat", "US")}
                />
                <span className="text-sm">US (MM/DD/YYYY)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  className="radio radio-sm"
                  name="dateFormat"
                  checked={config.dateFormat === "ISO"}
                  onChange={() => updateConfig("dateFormat", "ISO")}
                />
                <span className="text-sm">ISO (YYYY-MM-DD)</span>
              </label>
            </div>
          </fieldset>

          {/* Amount config */}
          <fieldset className="fieldset">
            <label className="fieldset-label flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-sm"
                checked={config.singleAmountColumn}
                onChange={(e) =>
                  updateConfig("singleAmountColumn", e.target.checked)
                }
              />
              <span>Credit and debit are a single column</span>
            </label>
          </fieldset>

          {config.singleAmountColumn ? (
            <ColumnSelect
              label="Amount column"
              value={config.amountColumn}
              onChange={(v) => updateConfig("amountColumn", v)}
              rows={rows}
              firstRowIsData={config.firstRowIsData}
            />
          ) : (
            <>
              <ColumnSelect
                label="Debit column (payment)"
                value={config.debitColumn}
                onChange={(v) => updateConfig("debitColumn", v)}
                rows={rows}
                firstRowIsData={config.firstRowIsData}
              />
              <ColumnSelect
                label="Credit column (deposit)"
                value={config.creditColumn}
                onChange={(v) => updateConfig("creditColumn", v)}
                rows={rows}
                firstRowIsData={config.firstRowIsData}
              />
            </>
          )}

          {/* Optional columns */}
          <ColumnSelect
            label="Payee column"
            value={config.payeeColumn}
            onChange={(v) => updateConfig("payeeColumn", v)}
            rows={rows}
            firstRowIsData={config.firstRowIsData}
            optional
          />

          <ColumnSelect
            label="Description column"
            value={config.notesColumn}
            onChange={(v) => updateConfig("notesColumn", v)}
            rows={rows}
            firstRowIsData={config.firstRowIsData}
            optional
          />
        </div>

        {/* Sticky preview — always visible at the bottom */}
        <div className="shrink-0 border-t border-base-content/10 pt-3">
          <PreviewSection rows={rows} config={config} />
        </div>
      </div>
    </Modal>
  );
};
