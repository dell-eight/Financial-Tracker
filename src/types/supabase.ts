/**
 * Supabase Database Types
 * Auto-generated types for the Financial Tracker database schema
 * Generated from schema at supabase/migrations/
 */

import type { UUID } from 'crypto';

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: UUID;
  email: string;
  display_name?: string;
  avatar_url?: string;
  base_currency: string;
  timezone: string;
  fiscal_year_start: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserSettings {
  id: UUID;
  user_id: UUID;
  setting_key: string;
  setting_value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EXPENSE TYPES
// ============================================================================

export interface ExpenseCategory {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_recurring: boolean;
  budget_limit?: number;
  budget_period: 'monthly' | 'yearly' | 'weekly';
  display_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Expense {
  id: UUID;
  user_id: UUID;
  category_id: UUID;
  description: string;
  amount: number;
  date: string;
  tags?: string[];
  notes?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_end_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface MonthlyExpenseSummary {
  user_id: UUID;
  month: string;
  category_id: UUID;
  category_name: string;
  color: string;
  transaction_count: number;
  total_amount: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
}

// ============================================================================
// INCOME TYPES
// ============================================================================

export interface IncomeSource {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  type: 'salary' | 'freelance' | 'investment' | 'passive' | 'other';
  is_recurring: boolean;
  recurring_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  color: string;
  icon?: string;
  display_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface IncomeRecord {
  id: UUID;
  user_id: UUID;
  source_id: UUID;
  amount: number;
  date: string;
  description?: string;
  tax_withheld: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface MonthlyIncomeSummary {
  user_id: UUID;
  month: string;
  source_id: UUID;
  source_name: string;
  type: string;
  color: string;
  transaction_count: number;
  total_amount: number;
  total_tax: number;
  net_income: number;
  avg_amount: number;
}

// ============================================================================
// SAVINGS GOALS TYPES
// ============================================================================

export interface SavingsGoal {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  category: 'emergency_fund' | 'vacation' | 'home' | 'education' | 'retirement' | 'other';
  priority: number;
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SavingsGoalContribution {
  id: UUID;
  user_id: UUID;
  goal_id: UUID;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoalStatus {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  category: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  days_remaining?: number;
  progress_percent: number;
  daily_required_savings?: number;
  is_active: boolean;
  color: string;
  icon?: string;
}

// ============================================================================
// INVESTMENT TYPES
// ============================================================================

export interface InvestmentAccount {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  account_type: 'brokerage' | 'retirement_401k' | 'ira' | 'roth_ira' | 'crypto' | 'other';
  institution?: string;
  account_number?: string;
  balance: number;
  currency: string;
  color: string;
  icon?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface InvestmentHolding {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  symbol: string;
  name: string;
  asset_class: 'stocks' | 'bonds' | 'etf' | 'mutual_fund' | 'crypto' | 'other';
  sector?: string;
  shares: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface InvestmentTransaction {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  holding_id?: UUID;
  transaction_type: 'buy' | 'sell' | 'dividend' | 'interest' | 'fee' | 'deposit' | 'withdrawal';
  symbol?: string;
  shares?: number;
  price_per_share?: number;
  total_amount: number;
  fee: number;
  date: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentSummary {
  user_id: UUID;
  account_id: UUID;
  account_name: string;
  account_type: string;
  symbol: string;
  holding_name: string;
  asset_class: string;
  sector?: string;
  shares: number;
  current_price: number;
  purchase_price: number;
  current_value: number;
  cost_basis: number;
  unrealized_gain_loss: number;
  gain_loss_percent: number;
}

export interface PortfolioAllocation {
  asset_class: string;
  holding_count: number;
  total_value: number;
  allocation_percent: number;
  gain_loss: number;
  gain_loss_percent: number;
}

// ============================================================================
// ASSETS & DEBTS TYPES
// ============================================================================

export interface AssetAccount {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  asset_type: 'checking' | 'savings' | 'money_market' | 'cash' | 'property' | 'vehicle' | 'other';
  balance: number;
  currency: string;
  institution?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface DebtAccount {
  id: UUID;
  user_id: UUID;
  name: string;
  description?: string;
  debt_type: 'mortgage' | 'auto_loan' | 'student_loan' | 'credit_card' | 'personal_loan' | 'other';
  balance: number;
  original_amount?: number;
  annual_rate?: number;
  monthly_payment?: number;
  minimum_payment?: number;
  due_date?: number;
  payoff_date?: string;
  currency: string;
  institution?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// NET WORTH TYPES
// ============================================================================

export interface NetWorthSnapshot {
  id: UUID;
  user_id: UUID;
  snapshot_date: string;
  total_assets: number;
  total_debts: number;
  net_worth: number;
  liquid_assets?: number;
  investments?: number;
  real_estate?: number;
  other_assets?: number;
  created_at: string;
  updated_at: string;
}

export interface NetWorthDetail {
  user_id: UUID;
  category: string;
  amount: number;
  total_debt: number;
  net_worth: number;
}

export interface FinancialHealthMetrics {
  user_id: UUID;
  as_of_date: string;
  net_worth: number;
  monthly_expenses: number;
  monthly_income: number;
  savings_rate_percent: number;
  emergency_fund_months: number;
  total_assets: number;
  total_debt: number;
}

// ============================================================================
// MATERIALIZED VIEW TYPES
// ============================================================================

export interface MvAnnualSummary {
  user_id: UUID;
  year: number;
  annual_income: number;
  annual_tax: number;
  annual_expenses: number;
  annual_net_savings: number;
  calculated_date: string;
}

export interface MvNetWorthHistory {
  user_id: UUID;
  snapshot_date: string;
  total_assets: number;
  total_debts: number;
  net_worth: number;
  liquid_assets?: number;
  investments?: number;
  real_estate?: number;
  previous_month_net_worth?: number;
  monthly_net_worth_change?: number;
  monthly_net_worth_change_percent?: number;
}

export interface MvExpenseAnalytics {
  user_id: UUID;
  category_id: UUID;
  category_name: string;
  month: string;
  monthly_total: number;
  transaction_count: number;
  avg_transaction: number;
  avg_12_month: number;
  min_12_month: number;
  max_12_month: number;
}

export interface MvBudgetPerformance {
  user_id: UUID;
  month: string;
  category_id: UUID;
  category_name: string;
  budget_limit?: number;
  actual_spent: number;
  percent_of_budget?: number;
  status: 'On Track' | 'Warning' | 'Over Budget';
  avg_12_month_spending: number;
}

export interface MvInvestmentPerformance {
  user_id: UUID;
  account_id: UUID;
  account_name: string;
  account_type: string;
  symbol: string;
  holding_name: string;
  asset_class: string;
  sector?: string;
  shares: number;
  current_price: number;
  purchase_price: number;
  current_value: number;
  cost_basis: number;
  unrealized_gain_loss: number;
  gain_loss_percent: number;
  performance_status: 'Gain' | 'Loss' | 'Neutral';
  portfolio_percent: number;
}

export interface MvAssetAllocationHistory {
  user_id: UUID;
  snapshot_date: string;
  asset_type: string;
  value: number;
  allocation_percent: number;
}

export interface MvIncomeAnalysis {
  user_id: UUID;
  source_id: UUID;
  source_name: string;
  type: string;
  month: string;
  monthly_income: number;
  monthly_tax: number;
  transaction_count: number;
  avg_12_month: number;
  max_12_month: number;
  min_12_month: number;
}

export interface MvFinancialGoalsProgress {
  goal_id: UUID;
  user_id: UUID;
  name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  target_date?: string;
  days_remaining?: number;
  daily_required_savings?: number;
  priority: number;
  is_active: boolean;
  status: string;
}

// ============================================================================
// DASHBOARD FUNCTION RETURN TYPES
// ============================================================================

export interface DashboardSummary {
  net_worth: number;
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  savings_rate_percent: number;
  emergency_fund_months: number;
  total_assets: number;
  total_debts: number;
  investment_value: number;
  number_of_goals: number;
  goals_completed: number;
}

export interface ExpenseBreakdownByCategory {
  category_name: string;
  category_id: UUID;
  color: string;
  total_spent: number;
  transaction_count: number;
  average_transaction: number;
  percent_of_total: number;
}

export interface ExpenseTrend {
  month: string;
  category_name: string;
  amount: number;
  transaction_count: number;
  avg_transaction: number;
}

export interface IncomeBreakdown {
  source_name: string;
  source_id: UUID;
  income_type: string;
  color: string;
  total_income: number;
  total_tax: number;
  net_income: number;
  transaction_count: number;
  percent_of_total: number;
}

export interface NetWorthTrend {
  snapshot_date: string;
  total_assets: number;
  total_debts: number;
  net_worth: number;
  monthly_change?: number;
  monthly_change_percent?: number;
}

export interface SavingsGoalProgress {
  goal_id: UUID;
  goal_name: string;
  category: string;
  target_amount: number;
  current_amount: number;
  progress_percent: number;
  target_date?: string;
  days_remaining?: number;
  daily_required_savings?: number;
  status: string;
  is_active: boolean;
  color: string;
}

export interface MonthlyBudgetComparison {
  category_name: string;
  category_id: UUID;
  budget_limit?: number;
  actual_spent: number;
  percent_of_budget?: number;
  remaining_budget?: number;
  status: string;
  color: string;
}

export interface FinancialMetrics {
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  trend_direction?: string;
  last_updated: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateExpenseRequest {
  category_id: UUID;
  description: string;
  amount: number;
  date: string;
  tags?: string[];
  notes?: string;
  receipt_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
  recurring_end_date?: string;
}

export interface UpdateExpenseRequest {
  category_id?: UUID;
  description?: string;
  amount?: number;
  date?: string;
  tags?: string[];
  notes?: string;
  receipt_url?: string;
}

export interface CreateIncomeRecordRequest {
  source_id: UUID;
  amount: number;
  date: string;
  description?: string;
  tax_withheld?: number;
  notes?: string;
}

export interface CreateSavingsGoalRequest {
  name: string;
  description?: string;
  target_amount: number;
  target_date?: string;
  category: string;
  priority?: number;
  color?: string;
  icon?: string;
}

export interface AddSavingsGoalContributionRequest {
  goal_id: UUID;
  amount: number;
  date: string;
  description?: string;
}
