/**
 * Expenses Service
 * Handles expense and category management
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  Expense,
  ExpenseCategory,
  MonthlyExpenseSummary,
  ExpenseBreakdownByCategory,
  ExpenseTrend,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from '../types/supabase';

/**
 * Get all expense categories for a user
 */
export async function getExpenseCategories(userId: string) {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { categories: (data || []) as ExpenseCategory[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { categories: [], error: err.message };
  }
}

/**
 * Create a new expense category
 */
export async function createExpenseCategory(
  userId: string,
  category: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .insert({
        user_id: userId,
        ...category,
      })
      .select()
      .single();

    if (error) throw error;

    return { category: data as ExpenseCategory, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { category: null, error: err.message };
  }
}

/**
 * Update an expense category
 */
export async function updateExpenseCategory(
  categoryId: string,
  updates: Partial<ExpenseCategory>
) {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return { category: data as ExpenseCategory, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { category: null, error: err.message };
  }
}

/**
 * Delete an expense category (soft delete)
 */
export async function deleteExpenseCategory(categoryId: string) {
  try {
    const { error } = await supabase
      .from('expense_categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', categoryId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get all expenses for a user
 */
export async function getExpenses(
  userId: string,
  filters?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    let query = supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { expenses: (data || []) as Expense[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { expenses: [], error: err.message };
  }
}

/**
 * Get a single expense
 */
export async function getExpense(expenseId: string) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', expenseId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    return { expense: data as Expense, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { expense: null, error: err.message };
  }
}

/**
 * Create a new expense
 */
export async function createExpense(userId: string, expense: CreateExpenseRequest) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        ...expense,
      })
      .select()
      .single();

    if (error) throw error;

    return { expense: data as Expense, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { expense: null, error: err.message };
  }
}

/**
 * Update an expense
 */
export async function updateExpense(expenseId: string, updates: UpdateExpenseRequest) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;

    return { expense: data as Expense, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { expense: null, error: err.message };
  }
}

/**
 * Delete an expense (soft delete)
 */
export async function deleteExpense(expenseId: string) {
  try {
    const { error } = await supabase
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', expenseId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get monthly expense summary
 */
export async function getMonthlyExpenseSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('monthly_expense_summary')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false });

    if (error) throw error;

    return { summary: (data || []) as MonthlyExpenseSummary[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summary: [], error: err.message };
  }
}

/**
 * Get expense breakdown by category (dashboard function)
 */
export async function getExpenseBreakdown(userId: string, monthsBack: number = 12) {
  try {
    const { data, error } = await supabase
      .rpc('get_expense_breakdown_by_category', {
        p_user_id: userId,
        p_months_back: monthsBack,
      });

    if (error) throw error;

    return { breakdown: (data || []) as ExpenseBreakdownByCategory[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { breakdown: [], error: err.message };
  }
}

/**
 * Get expense trends for a category
 */
export async function getExpenseTrends(
  userId: string,
  categoryId?: string,
  monthsBack: number = 12
) {
  try {
    const { data, error } = await supabase
      .rpc('get_expense_trends', {
        p_user_id: userId,
        p_category_id: categoryId || null,
        p_months_back: monthsBack,
      });

    if (error) throw error;

    return { trends: (data || []) as ExpenseTrend[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { trends: [], error: err.message };
  }
}

/**
 * Get monthly budget vs actual
 */
export async function getMonthlyBudgetComparison(
  userId: string,
  year?: number,
  month?: number
) {
  try {
    const { data, error } = await supabase
      .rpc('get_monthly_budget_comparison', {
        p_user_id: userId,
        p_year: year || null,
        p_month: month || null,
      });

    if (error) throw error;

    return { comparison: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { comparison: [], error: err.message };
  }
}

/**
 * Search expenses by description
 */
export async function searchExpenses(userId: string, query: string) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .or(`description.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('date', { ascending: false });

    if (error) throw error;

    return { expenses: (data || []) as Expense[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { expenses: [], error: err.message };
  }
}
