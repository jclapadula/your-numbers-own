export const TransactionTableWidths = {
  date: { width: "130px" },
  paymentDeposit: { width: "100px" },
  reconciled: { width: "30px" },
};

export const TransactionListHeader = () => {
  return (
    <div className="flex flex-row [&>div]:px-2 [&>div]:py-1 text-sm">
      <div style={TransactionTableWidths.date}>Date</div>
      <div className="flex-auto basis-0">Payee</div>
      <div className="flex-auto basis-0">Category</div>
      <div className="flex-auto basis-0">Notes</div>
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
