/**
 * Net Worth Service
 * Handles net worth tracking, assets, and debts
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  NetWorthSnapshot,
  AssetAccount,
  DebtAccount,
  NetWorthDetail,
} from '../types/supabase';

/**
 * Get net worth snapshots (monthly)
 */
export async function getNetWorthSnapshots(userId: string, months: number = 24) {
  try {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(months);

    if (error) throw error;

    return { snapshots: ((data || []).reverse()) as NetWorthSnapshot[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { snapshots: [], error: err.message };
  }
}

/**
 * Create a net worth snapshot
 */
export async function createNetWorthSnapshot(
  userId: string,
  snapshot: Omit<NetWorthSnapshot, 'id' | 'user_id' | 'created_at' | 'updated_at'>
) {
  try {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .insert({
        user_id: userId,
        ...snapshot,
      })
      .select()
      .single();

    if (error) throw error;

    return { snapshot: data as NetWorthSnapshot, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { snapshot: null, error: err.message };
  }
}

/**
 * Get all asset accounts for a user
 */
export async function getAssetAccounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('asset_type', { ascending: true });

    if (error) throw error;

    return { accounts: (data || []) as AssetAccount[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { accounts: [], error: err.message };
  }
}

/**
 * Create an asset account
 */
export async function createAssetAccount(
  userId: string,
  account: Omit<AssetAccount, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('asset_accounts')
      .insert({
        user_id: userId,
        ...account,
      })
      .select()
      .single();

    if (error) throw error;

    return { account: data as AssetAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Update an asset account
 */
export async function updateAssetAccount(accountId: string, updates: Partial<AssetAccount>) {
  try {
    const { data, error } = await supabase
      .from('asset_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    return { account: data as AssetAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Delete an asset account (soft delete)
 */
export async function deleteAssetAccount(accountId: string) {
  try {
    const { error } = await supabase
      .from('asset_accounts')
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
 * Get all debt accounts for a user
 */
export async function getDebtAccounts(userId: string) {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('debt_type', { ascending: true });

    if (error) throw error;

    return { accounts: (data || []) as DebtAccount[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { accounts: [], error: err.message };
  }
}

/**
 * Create a debt account
 */
export async function createDebtAccount(
  userId: string,
  account: Omit<DebtAccount, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .insert({
        user_id: userId,
        ...account,
      })
      .select()
      .single();

    if (error) throw error;

    return { account: data as DebtAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Update a debt account
 */
export async function updateDebtAccount(accountId: string, updates: Partial<DebtAccount>) {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .update(updates)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    return { account: data as DebtAccount, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { account: null, error: err.message };
  }
}

/**
 * Delete a debt account (soft delete)
 */
export async function deleteDebtAccount(accountId: string) {
  try {
    const { error } = await supabase
      .from('debt_accounts')
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
 * Get net worth detail breakdown
 */
export async function getNetWorthDetail(userId: string) {
  try {
    const { data, error } = await supabase
      .from('net_worth_detail')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    return { details: (data || []) as NetWorthDetail[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { details: [], error: err.message };
  }
}

/**
 * Calculate total assets
 */
export async function getTotalAssets(userId: string) {
  try {
    const { data: assetData, error: assetError } = await supabase
      .from('asset_accounts')
      .select('balance')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (assetError) throw assetError;

    const assetTotal = (assetData || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Add investments
    const { data: investmentData, error: investmentError } = await supabase
      .from('investment_holdings')
      .select('shares, current_price')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (investmentError) throw investmentError;

    const investmentTotal = (investmentData || []).reduce(
      (sum, holding) => sum + (holding.shares * holding.current_price),
      0
    );

    return { total: assetTotal + investmentTotal, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { total: 0, error: err.message };
  }
}

/**
 * Calculate total debt
 */
export async function getTotalDebt(userId: string) {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('balance')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    const total = (data || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return { total, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { total: 0, error: err.message };
  }
}

/**
 * Get liquidity analysis
 */
export async function getLiquidityAnalysis(userId: string) {
  try {
    const { data, error } = await supabase
      .from('asset_accounts')
      .select('asset_type, balance')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('asset_type', ['checking', 'savings', 'money_market']);

    if (error) throw error;

    const liquid = (data || []).reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return { liquidAssets: liquid, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { liquidAssets: 0, error: err.message };
  }
}

/**
 * Get debt summary by type
 */
export async function getDebtSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('debt_accounts')
      .select('debt_type, balance, annual_rate, monthly_payment')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    const summary = (data || []).reduce(
      (acc, debt) => {
        const type = debt.debt_type || 'other';
        if (!acc[type]) {
          acc[type] = { totalBalance: 0, count: 0, avgRate: 0 };
        }
        acc[type].totalBalance += debt.balance || 0;
        acc[type].count += 1;
        if (debt.annual_rate) {
          acc[type].avgRate = (acc[type].avgRate + debt.annual_rate) / 2;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return { summary, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summary: {}, error: err.message };
  }
}
