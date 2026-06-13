/**
 * Investments Service
 * Handles investment accounts, holdings, and transactions
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  InvestmentAccount,
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentSummary,
  PortfolioAllocation,
  MvInvestmentPerformance,
} from '../types/supabase';

/**
 * Get all investment accounts for a user
 */
export async function getInvestmentAccounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { accounts: (data || []) as InvestmentAccount[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { accounts: [], error: err.message };
  }
}

/**
 * Create a new investment account
 */
export async function createInvestmentAccount(
  userId: string,
  account: Omit<InvestmentAccount, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('investment_accounts')
      .insert({
        user_id: userId,
        ...account,
      })
      .select()
      .single();

    if (error) throw error;

    return { account: data as InvestmentAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Update an investment account
 */
export async function updateInvestmentAccount(
  accountId: string,
  updates: Partial<InvestmentAccount>
) {
  try {
    const { data, error } = await supabase
      .from('investment_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    return { account: data as InvestmentAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Delete an investment account (soft delete)
 */
export async function deleteInvestmentAccount(accountId: string) {
  try {
    const { error } = await supabase
      .from('investment_accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', accountId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get all holdings for a user
 */
export async function getInvestmentHoldings(userId: string, accountId?: string) {
  try {
    let query = supabase
      .from('investment_holdings')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { holdings: (data || []) as InvestmentHolding[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { holdings: [], error: err.message };
  }
}

/**
 * Create a new investment holding
 */
export async function createInvestmentHolding(
  userId: string,
  holding: Omit<InvestmentHolding, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('investment_holdings')
      .insert({
        user_id: userId,
        ...holding,
      })
      .select()
      .single();

    if (error) throw error;

    return { holding: data as InvestmentHolding, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { holding: null, error: err.message };
  }
}

/**
 * Update an investment holding
 */
export async function updateInvestmentHolding(
  holdingId: string,
  updates: Partial<InvestmentHolding>
) {
  try {
    const { data, error } = await supabase
      .from('investment_holdings')
      .update(updates)
      .eq('id', holdingId)
      .select()
      .single();

    if (error) throw error;

    return { holding: data as InvestmentHolding, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { holding: null, error: err.message };
  }
}

/**
 * Delete an investment holding (soft delete)
 */
export async function deleteInvestmentHolding(holdingId: string) {
  try {
    const { error } = await supabase
      .from('investment_holdings')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', holdingId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Record an investment transaction
 */
export async function createInvestmentTransaction(
  userId: string,
  transaction: Omit<
    InvestmentTransaction,
    'id' | 'user_id' | 'created_at' | 'updated_at'
  >
) {
  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .insert({
        user_id: userId,
        ...transaction,
      })
      .select()
      .single();

    if (error) throw error;

    return { transaction: data as InvestmentTransaction, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { transaction: null, error: err.message };
  }
}

/**
 * Get investment transactions
 */
export async function getInvestmentTransactions(
  userId: string,
  filters?: {
    accountId?: string;
    holdingId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
) {
  try {
    let query = supabase
      .from('investment_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }

    if (filters?.holdingId) {
      query = query.eq('holding_id', filters.holdingId);
    }

    if (filters?.type) {
      query = query.eq('transaction_type', filters.type);
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

    const { data, error } = await query;

    if (error) throw error;

    return { transactions: (data || []) as InvestmentTransaction[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { transactions: [], error: err.message };
  }
}

/**
 * Get investment summary (with current values and gains)
 */
export async function getInvestmentSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_summary')
      .select('*')
      .eq('user_id', userId)
      .order('account_id', { ascending: true });

    if (error) throw error;

    return { summary: (data || []) as InvestmentSummary[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summary: [], error: err.message };
  }
}

/**
 * Get portfolio allocation
 */
export async function getPortfolioAllocation(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_portfolio_allocation', {
        p_user_id: userId,
      });

    if (error) throw error;

    return { allocation: (data || []) as PortfolioAllocation[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { allocation: [], error: err.message };
  }
}

/**
 * Get investment performance metrics
 */
export async function getInvestmentPerformance(userId: string) {
  try {
    const { data, error } = await supabase
      .from('mv_investment_performance')
      .select('*')
      .eq('user_id', userId)
      .order('portfolio_percent', { ascending: false });

    if (error) throw error;

    return { performance: (data || []) as MvInvestmentPerformance[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { performance: [], error: err.message };
  }
}

/**
 * Calculate total portfolio value
 */
export async function getPortfolioValue(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_holdings')
      .select('shares, current_price')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    const total = (data || []).reduce((sum, holding) => {
      return sum + (holding.shares * holding.current_price);
    }, 0);

    return { value: total, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { value: 0, error: err.message };
  }
}

/**
 * Calculate total realized gains/losses
 */
export async function getRealizedGains(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_transactions')
      .select('transaction_type, shares, price_per_share, total_amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'sell');

    if (error) throw error;

    // This would need more complex calculation with cost basis
    // For now, just return the sum of sells minus fees
    const total = (data || []).reduce((sum, trans) => {
      return sum + (trans.total_amount || 0);
    }, 0);

    return { gains: total, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { gains: 0, error: err.message };
  }
}
