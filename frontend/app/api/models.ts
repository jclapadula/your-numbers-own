export type CreateAccount = {
  name: string;
};

export type BudgetAccount = {
  id: string;
  name: string;
};

export type Transaction = {
  id: string;
  date: Date;
  accountId: string;
  amount: string;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
}[];

export type CreateTransaction = {
  date: Date;
  accountId: string;
  amount: string;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
};

export type UpdateTransaction = Partial<{
  date: Date;
  amount: string;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
}>;
