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
  isIncome: boolean;
};

export type MonthOfYear = {
  month: number;
  year: number;
};

export type MonthlyBudget = {
  spendCategories: {
    categoryId: string;
    categoryName: string;
    assignedAmount: number;
    balance: number;
    previousBalance: number;
    spent: number;
  }[];
  incomeCategories: {
    categoryId: string;
    categoryName: string;
    balance: number;
    previousBalance: number;
  }[];
  monthOfYear: MonthOfYear;
};
