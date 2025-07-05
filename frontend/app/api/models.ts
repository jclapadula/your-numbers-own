export type CreateAccount = {
  name: string;
};

export type BudgetAccount = {
  id: string;
  name: string;
  balance: number;
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
  position: number;
  groupId: string;
};

export type CategoryGroup = {
  id: string;
  name: string;
  position: number;
};

export type MonthOfYear = {
  month: number;
  year: number;
};

export type MonthlyBudget = {
  monthCategories: {
    categoryId: string | null;
    categoryName: string;
    assignedAmount: number;
    balance: number;
    previousBalance: number;
  }[];
  monthOfYear: MonthOfYear;
};
