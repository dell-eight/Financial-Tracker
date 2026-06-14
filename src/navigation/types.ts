import type { NavigatorScreenParams } from '@react-navigation/native';

// ── Shared filter state (passed between TransactionList ↔ FilterSheet) ─────────
export type FilterState = {
  type?:      'all' | 'income' | 'expense';
  period?:    'week' | 'month' | 'year';
  minAmount?: number;
  maxAmount?: number;
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
  DataExport:        undefined;
  SecuritySettings:  undefined;
  CurrencyPicker:    undefined;
  TransactionDetail: { id: string; type: 'expense' | 'income' };
};

// ── Transactions stack ─────────────────────────────────────────────────────────
export type TransactionsStackParamList = {
  TransactionList:   FilterState | undefined;
  TransactionDetail: { id: string; type: 'expense' | 'income' };
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
};

// ── Analytics stack ────────────────────────────────────────────────────────────
export type AnalyticsStackParamList = {
  AnalyticsHome:  undefined;
  SpendingTrends: undefined;
  IncomeAnalysis: undefined;
  NetWorthGrowth: undefined;
  Forecast:       undefined;
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
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
