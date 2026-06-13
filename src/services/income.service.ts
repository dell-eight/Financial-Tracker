/**
 * Income Service
 * Handles income sources and records management
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  IncomeSource,
  IncomeRecord,
  IncomeBreakdown,
  CreateIncomeRecordRequest,
} from '../types/supabase';

/**
 * Get all income sources for a user
 */
export async function getIncomeSources(userId: string) {
  try {
    const { data, error } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { sources: (data || []) as IncomeSource[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { sources: [], error: err.message };
  }
}

/**
 * Create a new income source
 */
export async function createIncomeSource(
  userId: string,
  source: Omit<IncomeSource, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at'>
) {
  try {
    const { data, error } = await supabase
      .from('income_sources')
      .insert({
        user_id: userId,
        ...source,
      })
      .select()
      .single();

    if (error) throw error;

    return { source: data as IncomeSource, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { source: null, error: err.message };
  }
}

/**
 * Update an income source
 */
export async function updateIncomeSource(sourceId: string, updates: Partial<IncomeSource>) {
  try {
    const { data, error } = await supabase
      .from('income_sources')
      .update(updates)
      .eq('id', sourceId)
      .select()
      .single();

    if (error) throw error;

    return { source: data as IncomeSource, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { source: null, error: err.message };
  }
}

/**
 * Delete an income source (soft delete)
 */
export async function deleteIncomeSource(sourceId: string) {
  try {
    const { error } = await supabase
      .from('income_sources')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', sourceId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get all income records for a user
 */
export async function getIncomeRecords(
  userId: string,
  filters?: {
    sourceId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
) {
  try {
    let query = supabase
      .from('income_records')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false });

    if (filters?.sourceId) {
      query = query.eq('source_id', filters.sourceId);
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

    return { records: (data || []) as IncomeRecord[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { records: [], error: err.message };
  }
}

/**
 * Get a single income record
 */
export async function getIncomeRecord(recordId: string) {
  try {
    const { data, error } = await supabase
      .from('income_records')
      .select('*')
      .eq('id', recordId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    return { record: data as IncomeRecord, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { record: null, error: err.message };
  }
}

/**
 * Create a new income record
 */
export async function createIncomeRecord(userId: string, record: CreateIncomeRecordRequest) {
  try {
    const { data, error } = await supabase
      .from('income_records')
      .insert({
        user_id: userId,
        ...record,
      })
      .select()
      .single();

    if (error) throw error;

    return { record: data as IncomeRecord, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { record: null, error: err.message };
  }
}

/**
 * Update an income record
 */
export async function updateIncomeRecord(recordId: string, updates: Partial<IncomeRecord>) {
  try {
    const { data, error } = await supabase
      .from('income_records')
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();

    if (error) throw error;

    return { record: data as IncomeRecord, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { record: null, error: err.message };
  }
}

/**
 * Delete an income record (soft delete)
 */
export async function deleteIncomeRecord(recordId: string) {
  try {
    const { error } = await supabase
      .from('income_records')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', recordId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Get income breakdown by source
 */
export async function getIncomeBreakdown(userId: string, monthsBack: number = 12) {
  try {
    const { data, error } = await supabase
      .rpc('get_income_breakdown', {
        p_user_id: userId,
        p_months_back: monthsBack,
      });

    if (error) throw error;

    return { breakdown: (data || []) as IncomeBreakdown[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { breakdown: [], error: err.message };
  }
}

/**
 * Get monthly income summary
 */
export async function getMonthlyIncomeSummary(userId: string) {
  try {
    const { data, error } = await supabase
      .from('monthly_income_summary')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false });

    if (error) throw error;

    return { summary: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { summary: [], error: err.message };
  }
}

/**
 * Get monthly cash flow (income - expenses)
 */
export async function getMonthlyCashFlow(userId: string) {
  try {
    const { data, error } = await supabase
      .from('monthly_cash_flow')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false });

    if (error) throw error;

    return { cashFlow: data || [], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { cashFlow: [], error: err.message };
  }
}
