/**
 * Custom Hooks for Supabase Services
 * Provides easy-to-use React hooks for database operations
 */

import { useCallback, useState, useEffect } from 'react';
import * as authService from '../services/auth.service';
import * as expensesService from '../services/expenses.service';
import * as incomeService from '../services/income.service';
import * as savingsService from '../services/savings.service';
import * as investmentsService from '../services/investments.service';
import * as dashboardService from '../services/dashboard.service';
import * as networthService from '../services/networth.service';
import type {
  User,
  Expense,
  ExpenseCategory,
  IncomeRecord,
  IncomeSource,
  SavingsGoal,
  InvestmentAccount,
  InvestmentHolding,
  AssetAccount,
  DebtAccount,
  DashboardSummary,
  CreateExpenseRequest,
  CreateSavingsGoalRequest,
} from '../types/supabase';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAsyncActions<T> {
  refetch: () => Promise<void>;
  reset: () => void;
}

/**
 * Generic async hook for data fetching
 */
function useAsync<T>(
  asyncFunction: () => Promise<{ [key: string]: unknown; error: string | null }>,
  immediate: boolean = true
): UseAsyncState<T> & UseAsyncActions<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFunction();
      if (result.error) {
        setState({ data: null, loading: false, error: result.error });
      } else {
        // Extract the first non-error key as the data
        const dataKey = Object.keys(result).find((k) => k !== 'error');
        const data = (dataKey ? result[dataKey] : null) as T | null;
        setState({ data, loading: false, error: null });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, [refetch, immediate]);

  return { ...state, refetch, reset };
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { profile } = await authService.getUserProfile(user?.id || '');
      setUser(profile);
      setLoading(false);
    };

    const unsubscribe = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe?.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await authService.signIn({ email, password });
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  return { signIn, loading, error };
}

export function useSignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const result = await authService.signUp({ email, password });
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
    return result;
  }, []);

  return { signUp, loading, error };
}

// ============================================================================
// EXPENSES HOOKS
// ============================================================================

export function useExpenseCategories(userId: string) {
  return useAsync<ExpenseCategory[]>(
    () => expensesService.getExpenseCategories(userId),
    !!userId
  );
}

export function useExpenses(userId: string) {
  return useAsync<Expense[]>(() => expensesService.getExpenses(userId), !!userId);
}

export function useCreateExpense(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = useCallback(
    async (expense: CreateExpenseRequest) => {
      setLoading(true);
      setError(null);
      const result = await expensesService.createExpense(userId, expense);
      if (result.error) {
        setError(result.error);
      }
      setLoading(false);
      return result;
    },
    [userId]
  );

  return { createExpense, loading, error };
}

// ============================================================================
// INCOME HOOKS
// ============================================================================

export function useIncomeSources(userId: string) {
  return useAsync<IncomeSource[]>(
    () => incomeService.getIncomeSources(userId),
    !!userId
  );
}

export function useIncomeRecords(userId: string) {
  return useAsync<IncomeRecord[]>(
    () => incomeService.getIncomeRecords(userId),
    !!userId
  );
}

export function useMonthlyCashFlow(userId: string) {
  return useAsync(
    () => incomeService.getMonthlyCashFlow(userId),
    !!userId
  );
}

// ============================================================================
// SAVINGS GOALS HOOKS
// ============================================================================

export function useSavingsGoals(userId: string, activeOnly: boolean = false) {
  return useAsync<SavingsGoal[]>(
    () => savingsService.getSavingsGoals(userId, activeOnly),
    !!userId
  );
}

export function useSavingsGoalProgress(userId: string) {
  return useAsync(
    () => savingsService.getSavingsGoalProgress(userId),
    !!userId
  );
}

export function useCreateSavingsGoal(userId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGoal = useCallback(
    async (goal: CreateSavingsGoalRequest) => {
      setLoading(true);
      setError(null);
      const result = await savingsService.createSavingsGoal(userId, goal);
      if (result.error) {
        setError(result.error);
      }
      setLoading(false);
      return result;
    },
    [userId]
  );

  return { createGoal, loading, error };
}

// ============================================================================
// INVESTMENTS HOOKS
// ============================================================================

export function useInvestmentAccounts(userId: string) {
  return useAsync<InvestmentAccount[]>(
    () => investmentsService.getInvestmentAccounts(userId),
    !!userId
  );
}

export function useInvestmentHoldings(userId: string) {
  return useAsync<InvestmentHolding[]>(
    () => investmentsService.getInvestmentHoldings(userId),
    !!userId
  );
}

export function usePortfolioAllocation(userId: string) {
  return useAsync(
    () => investmentsService.getPortfolioAllocation(userId),
    !!userId
  );
}

export function usePortfolioValue(userId: string) {
  return useAsync(
    () => investmentsService.getPortfolioValue(userId),
    !!userId
  );
}

// ============================================================================
// NET WORTH HOOKS
// ============================================================================

export function useNetWorthSnapshots(userId: string, months: number = 24) {
  return useAsync(
    () => networthService.getNetWorthSnapshots(userId, months),
    !!userId
  );
}

export function useAssetAccounts(userId: string) {
  return useAsync<AssetAccount[]>(
    () => networthService.getAssetAccounts(userId),
    !!userId
  );
}

export function useDebtAccounts(userId: string) {
  return useAsync<DebtAccount[]>(
    () => networthService.getDebtAccounts(userId),
    !!userId
  );
}

export function useNetWorthDetail(userId: string) {
  return useAsync(
    () => networthService.getNetWorthDetail(userId),
    !!userId
  );
}

export function useTotalAssets(userId: string) {
  return useAsync(
    () => networthService.getTotalAssets(userId),
    !!userId
  );
}

export function useTotalDebt(userId: string) {
  return useAsync(
    () => networthService.getTotalDebt(userId),
    !!userId
  );
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

export function useDashboardSummary(userId: string) {
  return useAsync<DashboardSummary>(
    () => dashboardService.getDashboardSummary(userId),
    !!userId
  );
}

export function useFinancialHealthMetrics(userId: string) {
  return useAsync(
    () => dashboardService.getFinancialHealthMetrics(userId),
    !!userId
  );
}

export function useAnnualSummary(userId: string) {
  return useAsync(
    () => dashboardService.getAnnualSummary(userId),
    !!userId
  );
}

export function useNetWorthHistory(userId: string, months: number = 24) {
  return useAsync(
    () => dashboardService.getNetWorthHistory(userId, months),
    !!userId
  );
}

export function useExpenseBreakdown(userId: string, monthsBack: number = 12) {
  return useAsync(
    () => expensesService.getExpenseBreakdown(userId, monthsBack),
    !!userId
  );
}

export function useIncomeBreakdown(userId: string, monthsBack: number = 12) {
  return useAsync(
    () => incomeService.getIncomeBreakdown(userId, monthsBack),
    !!userId
  );
}

export function useKeyMetrics(userId: string) {
  return useAsync(
    () => dashboardService.getKeyMetrics(userId),
    !!userId
  );
}

export function useGoalsProgress(userId: string) {
  return useAsync(
    () => dashboardService.getGoalsProgress(userId),
    !!userId
  );
}

export function useMonthlyBudgetComparison(userId: string) {
  return useAsync(
    () => expensesService.getMonthlyBudgetComparison(userId),
    !!userId
  );
}
