/**
 * Dashboard Service
 * Handles all dashboard analytics and summary data
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  DashboardSummary,
  FinancialHealthMetrics,
  MvAnnualSummary,
  MvNetWorthHistory,
  MvExpenseAnalytics,
  MvBudgetPerformance,
} from '../types/supabase';

/**
 * Get complete dashboard summary for a user
 */
export async function getDashboardSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_dashboard_summary', {
        p_user_id: userId,
      })
      .single();

    if (error) throw error;

    return { summary: data as DashboardSummary, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summary: null, error: err.message };
  }
}

/**
 * Get financial health metrics
 */
export async function getFinancialHealthMetrics(userId: string) {
  try {
    const { data, error } = await supabase
      .from('financial_health_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return { metrics: data as FinancialHealthMetrics, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { metrics: null, error: err.message };
  }
}

/**
 * Get annual summary
 */
export async function getAnnualSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('mv_annual_summary')
      .select('*')
      .eq('user_id', userId)
      .order('year', { ascending: false })
      .limit(5);

    if (error) throw error;

    return { summaries: (data || []) as MvAnnualSummary[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summaries: [], error: err.message };
  }
}

/**
 * Get net worth history with trends
 */
export async function getNetWorthHistory(userId: string, months: number = 24) {
  try {
    const { data, error } = await supabase
      .from('mv_net_worth_history')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(months);

    if (error) throw error;

    return { history: (data || []).reverse() as MvNetWorthHistory[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { history: [], error: err.message };
  }
}

/**
 * Get expense analytics with trends
 */
export async function getExpenseAnalytics(userId: string, months: number = 12) {
  try {
    const { data, error } = await supabase
      .from('mv_expense_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(months * 8); // ~8 categories per month

    if (error) throw error;

    return { analytics: (data || []) as MvExpenseAnalytics[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { analytics: [], error: err.message };
  }
}

/**
 * Get budget performance
 */
export async function getBudgetPerformance(userId: string) {
  try {
    const { data, error } = await supabase
      .from('mv_budget_performance')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(12); // Current month

    if (error) throw error;

    return { performance: (data || []) as MvBudgetPerformance[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { performance: [], error: err.message };
  }
}

/**
 * Get asset allocation history
 */
export async function getAssetAllocationHistory(userId: string, months: number = 12) {
  try {
    const { data, error } = await supabase
      .from('mv_asset_allocation_history')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(months * 3); // 3 asset types per snapshot

    if (error) throw error;

    return { history: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { history: [], error: err.message };
  }
}

/**
 * Get income analysis with trends
 */
export async function getIncomeAnalysis(userId: string, months: number = 12) {
  try {
    const { data, error } = await supabase
      .from('mv_income_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(months * 5); // ~5 income sources

    if (error) throw error;

    return { analysis: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { analysis: [], error: err.message };
  }
}

/**
 * Get financial metrics summary
 */
export async function getFinancialMetrics(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_financial_metrics', {
        p_user_id: userId,
      });

    if (error) throw error;

    return { metrics: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { metrics: [], error: err.message };
  }
}

/**
 * Refresh materialized views (admin/background task)
 */
export async function refreshMaterializedViews() {
  try {
    const { error } = await supabase
      .rpc('refresh_materialized_views');

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { success: false, error: err.message };
  }
}

/**
 * Get spending vs income comparison
 */
export async function getSpendingVsIncome(userId: string) {
  try {
    const { data, error } = await supabase
      .from('monthly_cash_flow')
      .select('month, total_income, total_expenses, net_cash_flow')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .limit(12);

    if (error) throw error;

    return { cashFlow: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { cashFlow: [], error: err.message };
  }
}

/**
 * Get financial goals progress
 */
export async function getGoalsProgress(userId: string) {
  try {
    const { data, error } = await supabase
      .from('mv_financial_goals_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) throw error;

    return { goals: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goals: [], error: err.message };
  }
}

/**
 * Calculate net worth at a specific date
 */
export async function calculateNetWorth(userId: string, date: string = new Date().toISOString().split('T')[0]) {
  try {
    const { data, error } = await supabase
      .rpc('calculate_user_net_worth', {
        p_user_id: userId,
        p_date: date,
      })
      .single();

    if (error) throw error;

    return { netWorth: data as number, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { netWorth: 0, error: err.message };
  }
}

/**
 * Get key metrics for summary cards
 */
export async function getKeyMetrics(userId: string) {
  try {
    // Get all metrics in parallel
    const [summary, health, annual] = await Promise.all([
      getDashboardSummary(userId),
      getFinancialHealthMetrics(userId),
      getAnnualSummary(userId),
    ]);

    if (summary.error || health.error || annual.error) {
      throw new Error('Failed to fetch metrics');
    }

    return {
      metrics: {
        netWorth: summary.summary?.net_worth || 0,
        monthlyIncome: summary.summary?.monthly_income || 0,
        monthlyExpenses: summary.summary?.monthly_expenses || 0,
        savingsRate: summary.summary?.savings_rate_percent || 0,
        emergencyFundMonths: summary.summary?.emergency_fund_months || 0,
        totalAssets: summary.summary?.total_assets || 0,
        totalDebts: summary.summary?.total_debts || 0,
        investmentValue: summary.summary?.investment_value || 0,
      },
      error: null,
    };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { metrics: null, error: err.message };
  }
}
