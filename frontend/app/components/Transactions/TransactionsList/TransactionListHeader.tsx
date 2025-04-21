export const TransactionTableWidths = {
  date: { maxWidth: "110px" },
};

export const TransactionListHeader = () => {
  return (
    <thead>
      <tr>
        <th style={TransactionTableWidths.date}>Date</th>
        <th>Payee</th>
        <th>Category</th>
        <th>Notes</th>
        <th>Payment</th>
        <th>Deposit</th>
        <th>Reconciled</th>
      </tr>
    </thead>
  );
};
