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
  type: 'income' | 'expense';
  date: string;
  time: string;
  note?: string;
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
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
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
