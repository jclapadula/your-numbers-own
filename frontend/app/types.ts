export type PayeeOrTransfer =
  | { type: "payee"; payeeId: string }
  | { type: "transfer"; destinationAccountId: string }
  | null;
