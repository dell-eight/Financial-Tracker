import type { NavigatorScreenParams } from '@react-navigation/native';

// ── Shared filter state (passed between TransactionList ↔ FilterSheet) ─────────
export type FilterState = {
  type?:      'all' | 'income' | 'expense' | 'transfer';
  period?:    'week' | 'month' | 'year';
  minAmount?: number;
  maxAmount?: number;
  accountId?:   string;
  accountName?: string;
};

// ── Auth stack ─────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome:        undefined;
  SignUp:         undefined;
  Login:          undefined;
  ForgotPassword: undefined;
};

// ── Home stack ─────────────────────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeMain:          undefined;
  HealthScoreDetail: undefined;
  Search:            undefined;
  Notifications:     undefined;
  Profile:           undefined;
  EditProfile:       undefined;
  DataExport:        undefined;
  SecuritySettings:  undefined;
  CurrencyPicker:    undefined;
  HelpSupport:       undefined;
  PrivacyPolicy:     undefined;
  TermsOfService:    undefined;
  SetupPIN:          undefined;
  ChangePIN:         undefined;
  TransactionDetail: { id: string; type: 'expense' | 'income' | 'transfer' };
};

// ── Transactions stack ─────────────────────────────────────────────────────────
export type TransactionsStackParamList = {
  TransactionList:   FilterState | undefined;
  TransactionDetail: { id: string; type: 'expense' | 'income' | 'transfer' };
  AddExpense:        undefined;
  AddIncome:         undefined;
  AddTransfer:       undefined;
  Filter:            { current?: FilterState } | undefined;
  BulkEdit:          undefined;
};

// ── Budget stack ───────────────────────────────────────────────────────────────
export type BudgetStackParamList = {
  BudgetOverview:       undefined;
  BudgetSetupWizard:    undefined;
  CategoryBudgetDetail: { categoryId: string };
  BudgetHistory:        undefined;
  AlertSettings:        undefined;
};

// ── Wealth stack ───────────────────────────────────────────────────────────────
export type WealthStackParamList = {
  WealthMain:              undefined;
  GoalDetail:              { goalId: string };
  CreateGoal:              undefined;
  AddContribution:         { goalId: string };
  GoalAchieved:            { goalId: string };
  InvestmentAccountDetail: { accountId: string };
  HoldingDetail:           { holdingId: string };
  AddHolding:              { accountId: string };
  LogTransaction:          { holdingId: string };
  Allocation:              undefined;
  AssetsDetail:            undefined;
  DebtsDetail:             undefined;
  AccountTransactions: {
    accountId:       string;
    accountName:     string;
    accountBalance:  number;
    isDebt:          boolean;
    accountIcon:     string;
    accountCategory: string;
  };
  TransactionDetail: { id: string; type: 'expense' | 'income' | 'transfer' };
};

// ── Analytics stack ────────────────────────────────────────────────────────────
export type AnalyticsStackParamList = {
  AnalyticsHome:   undefined;
  SpendingTrends:  undefined;
  IncomeAnalysis:  undefined;
  NetWorthGrowth:  undefined;
  Forecast:        undefined;
};

// ── Main tab bar ───────────────────────────────────────────────────────────────
export type MainTabParamList = {
  Home:         NavigatorScreenParams<HomeStackParamList>;
  Transactions: NavigatorScreenParams<TransactionsStackParamList>;
  Budget:       NavigatorScreenParams<BudgetStackParamList>;
  Wealth:       NavigatorScreenParams<WealthStackParamList>;
  Analytics:    NavigatorScreenParams<AnalyticsStackParamList>;
};

// ── Root ───────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Auth:          NavigatorScreenParams<AuthStackParamList>;
  Main:          NavigatorScreenParams<MainTabParamList>;
  QuickAddSheet: undefined;
};

// ── Global typed navigation helpers ───────────────────────────────────────────
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
