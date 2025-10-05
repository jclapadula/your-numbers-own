export const TransactionTableWidths = {
  selection: { width: "30px", minWidth: "30px" },
  date: { width: "130px" },
  payee: { minWidth: "100px" },
  category: { minWidth: "90px" },
  notes: { minWidth: "90px" },
  paymentDeposit: { width: "100px", textAlign: "right" as const },
  reconciled: { width: "30px" },
};

export const TransactionListHeader = ({
  selectedCount,
  totalCount,
  onSelectAll,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: (selected: boolean) => void;
}) => {
  return (
    <div className="flex flex-row [&>div]:px-2 [&>div]:py-1 text-sm">
      <div
        style={TransactionTableWidths.selection}
        className="flex items-center justify-center"
      >
        <input
          type="checkbox"
          checked={selectedCount > 0 && selectedCount === totalCount}
          onChange={(e) => onSelectAll(e.target.checked)}
        />
      </div>
      <div style={TransactionTableWidths.date}>Date</div>
      <div className="flex-auto basis-0" style={TransactionTableWidths.payee}>
        Payee
      </div>
      <div
        className="flex-auto basis-0"
        style={TransactionTableWidths.category}
      >
        Category
      </div>
      <div className="flex-auto basis-0" style={TransactionTableWidths.notes}>
        Notes
      </div>
      <div style={TransactionTableWidths.paymentDeposit}>Payment</div>
      <div style={TransactionTableWidths.paymentDeposit}>Deposit</div>
      <div
        style={TransactionTableWidths.reconciled}
        className="flex items-center justify-center"
      >
        ✓
      </div>
    </div>
  );
};
