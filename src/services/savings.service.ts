/**
 * Savings Goals Service
 * Handles savings goals and contributions
 */

import { supabase, handleSupabaseError } from '../lib/supabase';
import type {
  SavingsGoal,
  SavingsGoalContribution,
  SavingsGoalProgress,
  CreateSavingsGoalRequest,
  AddSavingsGoalContributionRequest,
} from '../types/supabase';

/**
 * Get all savings goals for a user
 */
export async function getSavingsGoals(userId: string, activeOnly: boolean = false) {
  try {
    let query = supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('priority', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { goals: (data || []) as SavingsGoal[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goals: [], error: err.message };
  }
}

/**
 * Get a single savings goal
 */
export async function getSavingsGoal(goalId: string) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    return { goal: data as SavingsGoal, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goal: null, error: err.message };
  }
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(userId: string, goal: CreateSavingsGoalRequest) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .insert({
        user_id: userId,
        ...goal,
        current_amount: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { goal: data as SavingsGoal, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goal: null, error: err.message };
  }
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(goalId: string, updates: Partial<SavingsGoal>) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return { goal: data as SavingsGoal, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goal: null, error: err.message };
  }
}

/**
 * Mark a savings goal as completed
 */
export async function completeSavingsGoal(goalId: string) {
  try {
    const { data, error } = await supabase
      .from('savings_goals')
      .update({ is_active: false })
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;

    return { goal: data as SavingsGoal, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goal: null, error: err.message };
  }
}

/**
 * Delete a savings goal (soft delete)
 */
export async function deleteSavingsGoal(goalId: string) {
  try {
    const { error } = await supabase
      .from('savings_goals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', goalId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}

/**
 * Add a contribution to a savings goal
 */
export async function addSavingsContribution(
  userId: string,
  contribution: AddSavingsGoalContributionRequest
) {
  try {
    const { data, error } = await supabase
      .from('savings_goal_contributions')
      .insert({
        user_id: userId,
        ...contribution,
      })
      .select()
      .single();

    if (error) throw error;

    return { contribution: data as SavingsGoalContribution, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { contribution: null, error: err.message };
  }
}

/**
 * Get all contributions for a savings goal
 */
export async function getSavingsContributions(goalId: string) {
  try {
    const { data, error } = await supabase
      .from('savings_goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false });

    if (error) throw error;

    return { contributions: (data || []) as SavingsGoalContribution[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { contributions: [], error: err.message };
  }
}

/**
 * Get savings goal progress (using the dashboard function)
 */
export async function getSavingsGoalProgress(userId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_savings_goals_progress', {
        p_user_id: userId,
      });

    if (error) throw error;

    return { goals: (data || []) as SavingsGoalProgress[], error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { goals: [], error: err.message };
  }
}

/**
 * Get total amount saved across all goals
 */
export async function getTotalSavings(userId: string) {
  try {
    const { data, error } = await supabase
      .from('savings_goal_contributions')
      .select('amount')
      .eq('user_id', userId);

    if (error) throw error;

    const total = (data || []).reduce((sum, contrib) => sum + (contrib.amount || 0), 0);

    return { total, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { total: 0, error: err.message };
  }
}

/**
 * Update contribution
 */
export async function updateSavingsContribution(
  contributionId: string,
  updates: Partial<SavingsGoalContribution>
) {
  try {
    const { data, error } = await supabase
      .from('savings_goal_contributions')
      .update(updates)
      .eq('id', contributionId)
      .select()
      .single();

    if (error) throw error;

    return { contribution: data as SavingsGoalContribution, error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { contribution: null, error: err.message };
  }
}

/**
 * Delete contribution
 */
export async function deleteSavingsContribution(contributionId: string) {
  try {
    const { error } = await supabase
      .from('savings_goal_contributions')
      .delete()
      .eq('id', contributionId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    const err = handleSupabaseError(error);
    return { error: err.message };
  }
}
