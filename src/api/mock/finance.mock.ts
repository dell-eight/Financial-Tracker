import type { Account, Budget, DashboardSummary, SavingsGoal, Transaction } from '../../types/models';
import {
  SEED_ACCOUNTS,
  SEED_BUDGETS,
  SEED_DASHBOARD,
  SEED_GOALS,
  SEED_TRANSACTIONS,
} from '../../data/seed';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function mockGetTransactions(): Promise<Transaction[]> {
  await delay(400);
  return SEED_TRANSACTIONS;
}

export async function mockGetAccounts(): Promise<Account[]> {
  await delay(300);
  return SEED_ACCOUNTS;
}

export async function mockGetBudgets(): Promise<Budget[]> {
  await delay(350);
  return SEED_BUDGETS;
}

export async function mockGetDashboard(): Promise<DashboardSummary> {
  await delay(250);
  return SEED_DASHBOARD;
}

export async function mockGetSavingsGoals(): Promise<SavingsGoal[]> {
  await delay(320);
  return SEED_GOALS;
}
