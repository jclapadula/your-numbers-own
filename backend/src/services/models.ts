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
  date: Date;
  accountId: string;
  amount: number;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
};

export type CreateTransaction = {
  date: Date;
  accountId: string;
  amount: number;
  categoryId: string | null;
  isReconciled: boolean;
  notes: string | null;
  payeeId: string | null;
};

export type UpdateTransaction = Partial<{
  date: Date;
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

export type CategoryGroup = {
  id: string;
  name: string;
  position: number;
  isIncome: boolean;
};

export type Category = {
  id: string;
  name: string;
  position: number;
  groupId: string;
  isIncome: boolean;
};

export type MonthOfYear = {
  year: number;
  month: number;
};

export type MonthlyBudget = {
  spendCategories: {
    categoryId: string;
    categoryName: string;
    assignedAmount: number;
    spent: number;
    balance: number;
  }[];
  incomeCategories: {
    categoryId: string;
    categoryName: string;
    balance: number;
  }[];
  monthOfYear: MonthOfYear;
  lastMonthCarryOver: number;
};

export enum PlaidAccountType {
  DEPOSITORY = "depository",
  CREDIT = "credit",
  LOAN = "loan",
  INVESTMENT = "investment",
  PAYROLL = "payroll",
  OTHER = "other"
}

// Depository subtypes
export enum PlaidDepositorySubtype {
  CASH_MANAGEMENT = "cash management",
  CD = "cd",
  CHECKING = "checking",
  EBT = "ebt",
  HSA = "hsa",
  MONEY_MARKET = "money market",
  PAYPAL = "paypal",
  PREPAID = "prepaid",
  SAVINGS = "savings"
}

// Credit subtypes
export enum PlaidCreditSubtype {
  CREDIT_CARD = "credit card",
  PAYPAL = "paypal"
}

// Loan subtypes
export enum PlaidLoanSubtype {
  AUTO = "auto",
  BUSINESS = "business",
  COMMERCIAL = "commercial",
  CONSTRUCTION = "construction",
  CONSUMER = "consumer",
  HOME_EQUITY = "home equity",
  LINE_OF_CREDIT = "line of credit",
  LOAN = "loan",
  MORTGAGE = "mortgage",
  OTHER = "other",
  OVERDRAFT = "overdraft",
  STUDENT = "student"
}

// Investment subtypes
export enum PlaidInvestmentSubtype {
  PLAN_401A = "401a",
  PLAN_401K = "401k",
  PLAN_403B = "403b",
  PLAN_457B = "457b",
  PLAN_529 = "529",
  BROKERAGE = "brokerage",
  CASH_ISA = "cash isa",
  CRYPTO_EXCHANGE = "crypto exchange",
  EDUCATION_SAVINGS_ACCOUNT = "education savings account",
  FIXED_ANNUITY = "fixed annuity",
  GIC = "gic",
  HEALTH_REIMBURSEMENT_ARRANGEMENT = "health reimbursement arrangement",
  HSA = "hsa",
  IRA = "ira",
  ISA = "isa",
  KEOGH = "keogh",
  LIF = "lif",
  LIRA = "lira",
  LRIF = "lrif",
  LRSP = "lrsp",
  NON_CUSTODIAL_WALLET = "non-custodial wallet",
  NON_TAXABLE_BROKERAGE_ACCOUNT = "non-taxable brokerage account",
  OTHER = "other",
  PENSION = "pension",
  PRIF = "prif",
  PROFIT_SHARING_PLAN = "profit sharing plan",
  RDSP = "rdsp",
  RESP = "resp",
  RETIREMENT = "retirement",
  RLIF = "rlif",
  ROTH = "roth",
  ROTH_401K = "roth 401k",
  RRIF = "rrif",
  RRSP = "rrsp",
  SARSEP = "sarsep",
  SEP_IRA = "sep ira",
  SIMPLE_IRA = "simple ira",
  SIPP = "sipp",
  STOCK_PLAN = "stock plan",
  TFSA = "tfsa",
  THRIFT_SAVINGS_PLAN = "thrift savings plan",
  TRUST = "trust",
  UGMA = "ugma",
  UTMA = "utma",
  VARIABLE_ANNUITY = "variable annuity"
}

// Payroll subtypes
export enum PlaidPayrollSubtype {
  PAYROLL = "payroll"
}

// Other subtypes
export enum PlaidOtherSubtype {
  OTHER = "other"
}

// Union type for all possible subtypes
export type PlaidAccountSubtype =
  | PlaidDepositorySubtype
  | PlaidCreditSubtype
  | PlaidLoanSubtype
  | PlaidInvestmentSubtype
  | PlaidPayrollSubtype
  | PlaidOtherSubtype;

export type PlaidLinkToken = {
  link_token: string;
};

export type PlaidAccountLinkRequest = {
  public_token: string;
  account_id: string;
};

export type PlaidLinkedAccount = {
  plaid_account_id: string;
  account_name: string;
  account_type: PlaidAccountType;
  account_subtype: PlaidAccountSubtype | null;
};

export type PlaidAccountLinkResponse = {
  success: boolean;
  linked_account: PlaidLinkedAccount;
};

export type PlaidAccount = {
  id: string;
  accountId: string;
  plaidAccountId: string;
  plaidItemId: string;
  accessToken: string;
  accountName: string;
  accountType: PlaidAccountType;
  accountSubtype: PlaidAccountSubtype | null;
};

export type PlaidAccountsResponse = {
  accounts: PlaidAccount[];
};

export type PlaidSyncRequest = {
  start_date?: string;
  end_date?: string;
};

export type PlaidSyncResponse = {
  success: boolean;
  message: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
};
