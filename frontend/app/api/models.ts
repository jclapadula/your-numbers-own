export type CreateAccount = {
  name: string;
};

export type BudgetAccount = {
  id: string;
  name: string;
  balance: bigint;
};

export type Transaction = {
  id: string;
  date: string;
  accountId: string;
  amount: number;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
};

export type CreateTransaction = {
  date: string;
  accountId: string;
  amount: number;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
};

export type UpdateTransaction = Partial<{
  date: string;
  amount: number;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
}>;

export type Payee = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
};
