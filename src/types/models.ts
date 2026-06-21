import type { CategoryKey } from '../theme';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  currency: string;
  memberSince: string;
}

export interface Account {
  id: string;
  institutionName: string;
  maskedNumber: string;
  type: 'checking' | 'savings' | 'credit';
  balance: number;
  gradientIndex: number;
}

export interface Transaction {
  id: string;
  merchant: string;
  category: CategoryKey;
  categoryLabel: string;
  categoryIcon: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  date: string;
  time: string;
  note?: string;
  accountId?:      string;
  accountName?:    string;
  counterpartName?: string;
}

export interface Budget {
  id: string;
  category: CategoryKey;
  label: string;
  icon: string;
  color: string;
  limit: number;
  spent: number;
  month: number;
  year: number;
}

export interface DashboardSummary {
  totalBalance: number;
  liquidBalance: number;  // bank account balances only (cash available for emergencies)
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  savingsRate3m: number;  // 90-day rolling savings rate % (used for health scoring)
  income90d: number;      // raw 90-day income total; annualized as × 4 for debt ratio
  balanceDelta: number;
  balanceDeltaPct: number;
  totalAssets: number;
  totalDebts: number;
  investmentValue: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
  priority: number;
}

export type AssetCategory = 'cash' | 'investment' | 'real_estate' | 'vehicle' | 'other';

export interface AssetItem {
  id:       string;
  name:     string;
  category: AssetCategory;
  balance:  number;
  icon:     string;
  color:    string;
  note?:    string;
}

export type DebtCategory = 'credit_card' | 'personal_loan' | 'mortgage' | 'auto_loan' | 'student_loan';

export interface DebtItem {
  id:             string;
  name:           string;
  category:       DebtCategory;
  balance:        number;
  originalAmount: number;
  interestRate:   number;
  monthlyPayment: number;
  icon:           string;
  color:          string;
}

export type AssetType = 'stock' | 'etf' | 'fund' | 'bond' | 'crypto';

export interface InvestmentHolding {
  id:              string;
  accountId:       string;
  symbol:          string;
  name:            string;
  assetType:       AssetType;
  shares:          number;
  avgCostPerShare: number;
  currentPrice:    number;
  color:           string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type NotificationType = 'budget_warning' | 'budget_over';

export interface AppNotification {
  id:         string;
  type:       NotificationType;
  title:      string;
  body:       string;
  data:       Record<string, unknown> | null;
  dedupeKey:  string | null;
  readAt:     string | null;   // ISO timestamptz, null = unread
  createdAt:  string;
}
