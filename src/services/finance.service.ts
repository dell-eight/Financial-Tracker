import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// ── Recurring transaction constants (used by addExpense, addIncome, and query helpers) ──
const RECURRING_EXP_KEY = 'recurring_exp_last_';
const RECURRING_INC_KEY = 'recurring_inc_last_';
export type RecurringFrequency = 'daily' | 'weekly' | 'semimonthly' | 'monthly' | 'yearly';
export const RECURRING_FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily:       'Every day',
  weekly:      'Every week',
  semimonthly: 'Twice a month (1st & 15th)',
  monthly:     'Every month',
  yearly:      'Every year',
};
import type {
  DashboardSummary, Transaction, Budget, SavingsGoal,
  Account, AssetItem, DebtItem, InvestmentHolding,
  AssetCategory, DebtCategory, AssetType,
} from '../types/models';
import type { InvestmentTransaction } from '../types/supabase';
import type { CategoryKey } from '../theme';

// ── Raw Supabase row types (query result shapes) ───────────────────────────────

type RawDashboardRow   = { total_debts: unknown; monthly_income: unknown; monthly_expenses: unknown; savings_rate_percent: unknown; savings_rate_3m: unknown; income_90d: unknown };
type RawBalanceRow     = { balance: unknown };
type RawSharesRow      = { shares: unknown; current_price: unknown };
type RawGoalContribRow = { savings_goal_contributions: Array<{ amount: unknown }> };
type RawExpenseRow     = { id: string; description: string; amount: unknown; date: string; created_at: string; notes: string | null; account_id: string | null; is_recurring: boolean; recurring_frequency: string | null; expense_categories: { name: string; icon: string | null; color: string } | null; asset_accounts: { name: string } | null };
type RawIncomeRow      = { id: string; description: string | null; amount: unknown; date: string; created_at: string; notes: string | null; account_id: string | null; income_sources: { id: string; name: string; type: string; icon: string | null; is_recurring: boolean; recurring_frequency: string | null } | null; asset_accounts: { name: string } | null };
type RawTransferRow    = { id: string; amount: unknown; date: string; created_at: string; notes: string | null; from_account_id: string; to_account_id: string; from: { name: string } | null; to: { name: string } | null };
type RawCategoryRow    = { id: string; name: string; icon: string | null; color: string | null; budget_limit: unknown };
type RawGoalRow        = { id: string; name: string; category: string; icon: string | null; target_amount: unknown; color: string | null; priority: number | null; savings_goal_contributions: Array<{ amount: unknown }> };
type RawContribRow     = { id: string; amount: unknown; date: string; description: string | null };
type RawAcctBalRow     = { id: string; balance: unknown };
type RawAssetAcctRow   = { id: string; name: string; asset_type: string; balance: unknown };
type RawHoldingRow     = { id: string; account_id: string; symbol: string; name: string; asset_class: string; shares: unknown; purchase_price: unknown; current_price: unknown };
type RawAssetRow       = { id: string; name: string; asset_type: string; balance: unknown };
type RawCashFlowRow    = { month: string; total_income: unknown; total_expenses: unknown; net_cash_flow: unknown };
type RawNWRow          = { snapshot_date: string; net_worth: unknown };
type RawIncomeRecRow   = { amount: unknown; income_sources: { name: string; icon: string | null } | null };
type RawDebtRow        = { id: string; name: string; debt_type: string; balance: unknown; original_amount: unknown; annual_rate: unknown; monthly_payment: unknown };

// ── Auth helper ────────────────────────────────────────────────────────────────

async function uid(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ── Type mappers ───────────────────────────────────────────────────────────────

function mapAssetType(t: string): AssetCategory {
  if (['checking', 'savings', 'money_market', 'cash'].includes(t)) return 'cash';
  if (t === 'property') return 'real_estate';
  if (t === 'vehicle')  return 'vehicle';
  if (t === 'investment') return 'investment';
  return 'other';
}

function mapDebtType(t: string): DebtCategory {
  const valid: DebtCategory[] = ['credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'student_loan'];
  return valid.includes(t as DebtCategory) ? (t as DebtCategory) : 'personal_loan';
}

function mapAssetClass(c: string): AssetType {
  if (c === 'stocks')      return 'stock';
  if (c === 'etf')         return 'etf';
  if (c === 'mutual_fund') return 'fund';
  if (c === 'bonds')       return 'bond';
  if (c === 'crypto')      return 'crypto';
  return 'etf';
}

function categoryKey(name: string, isIncome: boolean): CategoryKey {
  if (isIncome) {
    const n = name.toLowerCase();
    if (n.includes('salary') || n.includes('wage'))    return 'income_salary'   as CategoryKey;
    if (n.includes('freelance') || n.includes('proj')) return 'income_freelance' as CategoryKey;
    return 'income_other' as CategoryKey;
  }
  const n = name.toLowerCase();
  if (n.includes('food') || n.includes('grocer') || n.includes('dining')) return 'food'          as CategoryKey;
  if (n.includes('transport') || n.includes('gas'))                        return 'transport'     as CategoryKey;
  if (n.includes('shop') || n.includes('cloth'))                           return 'shopping'      as CategoryKey;
  if (n.includes('util') || n.includes('bill') || n.includes('electric'))  return 'bills'         as CategoryKey;
  if (n.includes('health') || n.includes('medical') || n.includes('fit'))  return 'health'        as CategoryKey;
  if (n.includes('entertain') || n.includes('movie'))                       return 'entertainment' as CategoryKey;
  if (n.includes('edu') || n.includes('course'))                            return 'education'     as CategoryKey;
  return 'other' as CategoryKey;
}

// ── Icon / emoji helpers ───────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, string> = {
  groceries: '🛒', food: '🍔', transportation: '🚗', transport: '🚗',
  entertainment: '🎬', utilities: '💡', bills: '💡',
  healthcare: '💊', health: '💊', shopping: '🛍️',
  education: '📚', salary: '💼', freelance: '💻',
  investment: '📈', 'investment returns': '📈',
  bonus: '🎁', other: '📦',
};

function expenseIcon(name: string, dbIcon?: string | null): string {
  if (dbIcon) return dbIcon;
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_ICON[key] ?? CATEGORY_ICON[name.toLowerCase()] ?? '📦';
}

const GOAL_EMOJI: Record<string, string> = {
  emergency_fund: '🆘', vacation: '✈️', home: '🏠',
  education: '📚', retirement: '🏖️', other: '🎯',
};

const ASSET_ICON: Record<string, string> = {
  checking: '🏦', savings: '🏦', money_market: '🔒',
  cash: '💵', property: '🏠', vehicle: '🚗',
  investment: '📈', other: '📦',
};

const DEBT_ICON: Record<string, string> = {
  mortgage: '🏠', auto_loan: '🚗', student_loan: '📚',
  credit_card: '💳', personal_loan: '📋', other: '💰',
};

const INVEST_COLORS = ['#755DEF', '#3B82F6', '#22C55E', '#F97316', '#EC4899', '#14B8A6'];

// ── Dashboard ──────────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardSummary> {
  const userId = await uid();

  const [summaryRes, snapshotsRes, bankRes, holdingRes, goalRes] = await Promise.all([
    supabase.rpc('get_dashboard_summary', { p_user_id: userId }),
    supabase
      .from('net_worth_snapshots')
      .select('snapshot_date, net_worth')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(2),
    // bank accounts — same source as getAssets()
    supabase
      .from('asset_accounts')
      .select('balance')
      .eq('user_id', userId)
      .is('deleted_at', null),
    // investment holdings — same source as getAssets()
    supabase
      .from('investment_holdings')
      .select('shares, current_price')
      .eq('user_id', userId)
      .is('deleted_at', null),
    // savings: only contributions from non-deleted goals
    supabase
      .from('savings_goals')
      .select('savings_goal_contributions(amount)')
      .eq('user_id', userId)
      .is('deleted_at', null),
  ]);

  const row   = (summaryRes.data as RawDashboardRow[])?.[0] ?? {} as RawDashboardRow;
  const snaps = snapshotsRes.data ?? [];

  const bankTotal       = (bankRes.data as RawBalanceRow[] ?? []).reduce((s: number, a: RawBalanceRow) => s + Number(a.balance ?? 0), 0);
  const investmentValue = (holdingRes.data as RawSharesRow[] ?? []).reduce((s: number, h: RawSharesRow) => s + Number(h.shares ?? 0) * Number(h.current_price ?? 0), 0);
  const savingsTotal    = (goalRes.data as RawGoalContribRow[] ?? []).reduce((s: number, g: RawGoalContribRow) =>
    s + (g.savings_goal_contributions ?? []).reduce((gs: number, c: { amount: unknown }) => gs + Number(c.amount ?? 0), 0), 0);

  // totalAssets uses the same three sources as getAssets() so both screens always agree
  const totalAssets     = bankTotal + investmentValue + savingsTotal;
  const totalDebts      = Number(row.total_debts          ?? 0);
  const monthlyIncome   = Number(row.monthly_income       ?? 0);
  const monthlyExpenses = Number(row.monthly_expenses     ?? 0);
  const savingsRate     = Number(row.savings_rate_percent ?? 0);
  const savingsRate3m   = Number(row.savings_rate_3m      ?? 0);
  const income90d       = Number(row.income_90d           ?? 0);
  const netWorth        = totalAssets - totalDebts;

  const currentNW      = snaps[0] ? Number(snaps[0].net_worth) : netWorth;
  const previousNW     = snaps[1] ? Number(snaps[1].net_worth) : 0;
  const balanceDelta   = currentNW - previousNW;
  const balanceDeltaPct = previousNW !== 0
    ? (balanceDelta / Math.abs(previousNW)) * 100
    : 0;

  // Fire-and-forget: snapshot + milestone check runs in background
  void syncWealthProgression();

  return {
    totalBalance:  netWorth,
    liquidBalance: bankTotal,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    savingsRate3m,
    income90d,
    balanceDelta,
    balanceDeltaPct,
    totalAssets,
    totalDebts,
    investmentValue,
  };
}

// ── Wealth Progression ─────────────────────────────────────────────────────────

export interface NewMilestone {
  id:       string;
  type:     string;
  label:    string;
  emoji:    string;
  netWorth: number;
}

const MILESTONE_DEFS = [
  { type: 'positive_nw', threshold: 0,          label: 'Positive Net Worth', emoji: '🌱' },
  { type: 'nw_100k',     threshold: 100_000,     label: '₱100K Net Worth',   emoji: '💰' },
  { type: 'nw_500k',     threshold: 500_000,     label: '₱500K Net Worth',   emoji: '🚀' },
  { type: 'nw_1m',       threshold: 1_000_000,   label: 'Millionaire',       emoji: '🏆' },
  { type: 'nw_5m',       threshold: 5_000_000,   label: '₱5M Net Worth',     emoji: '💎' },
  { type: 'nw_10m',      threshold: 10_000_000,  label: '₱10M Net Worth',    emoji: '👑' },
  { type: 'debt_free',   threshold: null,         label: 'Debt Free',         emoji: '🔓' },
] as const;

export async function upsertMonthlySnapshot(): Promise<void> {
  const userId = await uid();

  const now          = new Date();
  const snapshotDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  // Skip if a snapshot already exists for this month. The DB-level ON CONFLICT
  // DO NOTHING is the safety net, but this guard avoids the expensive asset/debt
  // queries on every dashboard load once the month is covered.
  const { data: existing } = await supabase
    .from('net_worth_snapshots')
    .select('id')
    .eq('user_id', userId)
    .eq('snapshot_date', snapshotDate)
    .maybeSingle();

  if (existing) return;

  const [bankRes, holdingRes, goalRes, debtRes] = await Promise.all([
    supabase.from('asset_accounts').select('balance, asset_type').eq('user_id', userId).is('deleted_at', null),
    supabase.from('investment_holdings').select('shares, current_price').eq('user_id', userId).is('deleted_at', null),
    supabase.from('savings_goals').select('savings_goal_contributions(amount)').eq('user_id', userId).is('deleted_at', null),
    supabase.from('debt_accounts').select('balance').eq('user_id', userId).is('deleted_at', null),
  ]);

  type RawAssetTypeRow = { balance: unknown; asset_type: string };
  const bankRows    = bankRes.data    as RawAssetTypeRow[] ?? [];
  const holdingRows = holdingRes.data as RawSharesRow[]   ?? [];
  const goalRows    = goalRes.data    as RawGoalContribRow[] ?? [];
  const debtRows    = debtRes.data    as RawBalanceRow[]   ?? [];

  const liquidAssets = bankRows
    .filter(a => ['checking','savings','money_market','cash'].includes(a.asset_type))
    .reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const realEstate = bankRows
    .filter(a => a.asset_type === 'property')
    .reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const otherAssets = bankRows
    .filter(a => !['checking','savings','money_market','cash','property','investment'].includes(a.asset_type))
    .reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const investments  = holdingRows.reduce((s, h) => s + Number(h.shares ?? 0) * Number(h.current_price ?? 0), 0);
  const savingsContribs = goalRows.reduce((s, g) =>
    s + (g.savings_goal_contributions ?? []).reduce((gs, c) => gs + Number(c.amount ?? 0), 0), 0);
  const totalAssets = liquidAssets + investments + realEstate + otherAssets + savingsContribs;
  const totalDebts  = debtRows.reduce((s, d) => s + Number(d.balance ?? 0), 0);
  const netWorth    = totalAssets - totalDebts;

  await supabase.rpc('upsert_net_worth_snapshot', {
    p_user_id:       userId,
    p_snapshot_date: snapshotDate,
    p_total_assets:  totalAssets,
    p_total_debts:   totalDebts,
    p_net_worth:     netWorth,
    p_liquid_assets: liquidAssets + savingsContribs,
    p_investments:   investments,
    p_real_estate:   realEstate,
    p_other_assets:  otherAssets,
    p_captured_at:   now.toISOString(),
  });
}

export async function checkAndRecordMilestones(
  netWorth:        number,
  totalDebts:      number,
  hasDebtAccounts: boolean = false,
): Promise<NewMilestone[]> {
  const userId = await uid();

  // Fetch already-recorded milestones so we never double-insert
  const { data: existing } = await supabase
    .from('wealth_milestones')
    .select('milestone_type')
    .eq('user_id', userId);

  const existingTypes = new Set((existing ?? []).map((r: { milestone_type: string }) => r.milestone_type));

  const toInsert = MILESTONE_DEFS.filter(m => {
    if (existingTypes.has(m.type)) return false;
    if (m.type === 'debt_free') return hasDebtAccounts && totalDebts === 0 && netWorth > 0;
    // positive_nw uses threshold 0 but must be strictly positive — ₱0 is not a milestone
    if (m.type === 'positive_nw') return netWorth > 0;
    return netWorth >= (m.threshold ?? 0);
  });

  if (toInsert.length === 0) return [];

  const rows = toInsert.map(m => ({
    user_id:                  userId,
    milestone_type:           m.type,
    net_worth_at_achievement: netWorth,
    celebrated:               false,
  }));

  const { data: inserted } = await supabase
    .from('wealth_milestones')
    .insert(rows)
    .select('id, milestone_type');

  if (!inserted) return [];

  return (inserted as { id: string; milestone_type: string }[]).map(row => {
    const def = MILESTONE_DEFS.find(m => m.type === row.milestone_type)!;
    return { id: row.id, type: row.milestone_type, label: def.label, emoji: def.emoji, netWorth };
  });
}

export async function markMilestoneCelebrated(milestoneId: string): Promise<void> {
  await supabase
    .from('wealth_milestones')
    .update({ celebrated: true })
    .eq('id', milestoneId);
}

export async function getAllMilestones(): Promise<{
  id: string; type: string; label: string; emoji: string;
  achievedAt: string; netWorthAtAchievement: number; celebrated: boolean;
}[]> {
  const userId = await uid();
  const { data } = await supabase
    .from('wealth_milestones')
    .select('id, milestone_type, achieved_at, net_worth_at_achievement, celebrated')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  return (data ?? []).map((r: {
    id: string; milestone_type: string; achieved_at: string;
    net_worth_at_achievement: unknown; celebrated: boolean;
  }) => {
    const def = MILESTONE_DEFS.find(m => m.type === r.milestone_type);
    return {
      id:                   r.id,
      type:                 r.milestone_type,
      label:                def?.label ?? r.milestone_type,
      emoji:                def?.emoji ?? '🏅',
      achievedAt:           r.achieved_at,
      netWorthAtAchievement: Number(r.net_worth_at_achievement ?? 0),
      celebrated:           r.celebrated,
    };
  });
}

export async function syncWealthProgression(): Promise<void> {
  try {
    await upsertMonthlySnapshot();
  } catch {
    // snapshot errors must never surface to the user
    return;
  }

  try {
    // Re-derive live net worth to check milestones
    const [bankRes, holdingRes, goalRes, debtRes] = await Promise.all([
      supabase.from('asset_accounts').select('balance').eq('user_id', await uid()).is('deleted_at', null),
      supabase.from('investment_holdings').select('shares, current_price').eq('user_id', await uid()).is('deleted_at', null),
      supabase.from('savings_goals').select('savings_goal_contributions(amount)').eq('user_id', await uid()).is('deleted_at', null),
      supabase.from('debt_accounts').select('balance').eq('user_id', await uid()).is('deleted_at', null),
    ]);
    const bank  = (bankRes.data    as RawBalanceRow[]     ?? []).reduce((s, a) => s + Number(a.balance ?? 0), 0);
    const inv   = (holdingRes.data as RawSharesRow[]      ?? []).reduce((s, h) => s + Number(h.shares ?? 0) * Number(h.current_price ?? 0), 0);
    const sav   = (goalRes.data    as RawGoalContribRow[] ?? []).reduce((s, g) =>
      s + (g.savings_goal_contributions ?? []).reduce((gs, c) => gs + Number(c.amount ?? 0), 0), 0);
    const debtRows = (debtRes.data as RawBalanceRow[] ?? []);
    const debts    = debtRows.reduce((s, d) => s + Number(d.balance ?? 0), 0);
    const nw       = bank + inv + sav - debts;

    const newMilestones = await checkAndRecordMilestones(nw, debts, debtRows.length > 0);
    if (newMilestones.length > 0) {
      // Import lazily to avoid circular dep with store
      const { useAppStore } = await import('../store/app.store');
      useAppStore.getState().addPendingMilestones(newMilestones);
    }
  } catch {
    // milestone errors must never surface to the user
  }
}

// ── Transactions ───────────────────────────────────────────────────────────────

export async function getTransactions(opts?: { from?: string; to?: string }): Promise<Transaction[]> {
  const userId = await uid();
  const limit  = opts?.from ? 500 : 100;

  let expQ = supabase
    .from('expenses')
    .select('id, description, amount, date, created_at, notes, account_id, is_recurring, recurring_frequency, expense_categories(name, icon, color), asset_accounts(name)')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (opts?.from) expQ = expQ.gte('date', opts.from);
  if (opts?.to)   expQ = expQ.lte('date', opts.to);
  expQ = expQ.order('date', { ascending: false }).limit(limit);

  let incQ = supabase
    .from('income_records')
    .select('id, description, amount, date, created_at, notes, account_id, income_sources(id, name, type, icon, is_recurring, recurring_frequency), asset_accounts(name)')
    .eq('user_id', userId)
    .is('deleted_at', null);
  if (opts?.from) incQ = incQ.gte('date', opts.from);
  if (opts?.to)   incQ = incQ.lte('date', opts.to);
  incQ = incQ.order('date', { ascending: false }).limit(limit);

  let trQ = supabase
    .from('transfers')
    .select(`id, amount, date, created_at, notes, from_account_id, to_account_id,
             from:asset_accounts!from_account_id(name),
             to:asset_accounts!to_account_id(name)`)
    .eq('user_id', userId);
  if (opts?.from) trQ = trQ.gte('date', opts.from);
  if (opts?.to)   trQ = trQ.lte('date', opts.to);
  trQ = trQ.order('date', { ascending: false }).limit(limit);

  const [expRes, incRes, trRes] = await Promise.all([expQ, incQ, trQ]);

  const expenses: Transaction[] = (expRes.data as unknown as RawExpenseRow[] ?? []).map((e: RawExpenseRow) => {
    const name = e.expense_categories?.name ?? 'Other';
    const time = e.created_at ? new Date(e.created_at).toTimeString().slice(0, 5) : '00:00';
    return {
      id:                 e.id,
      merchant:           e.description,
      category:           categoryKey(name, false),
      categoryLabel:      name,
      categoryIcon:       expenseIcon(name, e.expense_categories?.icon),
      amount:             Number(e.amount),
      type:               'expense',
      date:               e.date,
      time,
      note:               e.notes ?? undefined,
      accountId:          e.account_id ?? undefined,
      accountName:        e.asset_accounts?.name ?? undefined,
      isRecurring:        e.is_recurring ?? false,
      recurringFrequency: e.recurring_frequency ?? undefined,
    };
  });

  const income: Transaction[] = (incRes.data as unknown as RawIncomeRow[] ?? []).map((r: RawIncomeRow) => {
    const name = r.income_sources?.name ?? 'Income';
    const time = r.created_at ? new Date(r.created_at).toTimeString().slice(0, 5) : '00:00';
    return {
      id:                 r.id,
      merchant:           r.description ?? name,
      category:           categoryKey(name, true),
      categoryLabel:      name,
      categoryIcon:       expenseIcon(name, r.income_sources?.icon),
      amount:             Number(r.amount),
      type:               'income',
      date:               r.date,
      time,
      note:               r.notes ?? undefined,
      accountId:          r.account_id ?? undefined,
      accountName:        r.asset_accounts?.name ?? undefined,
      isRecurring:        r.income_sources?.is_recurring ?? false,
      recurringFrequency: r.income_sources?.recurring_frequency ?? undefined,
      recurringSourceId:  r.income_sources?.id ?? undefined,
    };
  });

  const transfers: Transaction[] = (trRes.data as unknown as RawTransferRow[] ?? []).map((t: RawTransferRow) => {
    const time = t.created_at ? new Date(t.created_at).toTimeString().slice(0, 5) : '00:00';
    return {
      id:              t.id,
      merchant:        `${t.from?.name ?? 'Account'} → ${t.to?.name ?? 'Account'}`,
      category:        'transfer' as CategoryKey,
      categoryLabel:   'Transfer',
      categoryIcon:    '🔄',
      amount:          Number(t.amount),
      type:            'transfer' as const,
      date:            t.date,
      time,
      note:            t.notes ?? undefined,
      accountId:       t.from_account_id,
      accountName:     t.from?.name,
      counterpartName: t.to?.name,
    };
  });

  return [...expenses, ...income, ...transfers].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function updateExpense(id: string, params: {
  merchant:     string;
  categoryName: string;
  categoryIcon: string;
  amount:       number;
  date:         string;
  note?:        string;
}): Promise<void> {
  const userId = await uid();

  const { data: existing } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', params.categoryName)
    .is('deleted_at', null)
    .maybeSingle();

  let categoryId: string;
  if (existing) {
    categoryId = existing.id;
  } else {
    const { data: newCat, error: catErr } = await supabase
      .from('expense_categories')
      .insert({ user_id: userId, name: params.categoryName, icon: params.categoryIcon, color: '#6B7280' })
      .select('id')
      .single();
    if (catErr) throw catErr;
    categoryId = newCat.id;
  }

  const { error } = await supabase
    .from('expenses')
    .update({
      description: params.merchant,
      amount:      params.amount,
      date:        params.date,
      category_id: categoryId,
      notes:       params.note ?? null,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateIncome(id: string, params: {
  description: string;
  amount:      number;
  date:        string;
  note?:       string;
}): Promise<void> {
  const userId = await uid();

  const { error } = await supabase
    .from('income_records')
    .update({
      description: params.description,
      amount:      params.amount,
      date:        params.date,
      notes:       params.note ?? null,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteTransaction(id: string, type: 'expense' | 'income'): Promise<void> {
  const userId = await uid();

  if (type === 'income') {
    // Fetch the record first so we can reverse any linked account credit
    const { data: record } = await supabase
      .from('income_records')
      .select('amount, account_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const { error } = await supabase
      .from('income_records')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;

    // Reverse the account credit if one was linked
    if (record?.account_id) {
      const { data: account } = await supabase
        .from('asset_accounts')
        .select('balance')
        .eq('id', record.account_id)
        .eq('user_id', userId)
        .single();

      if (account) {
        await supabase
          .from('asset_accounts')
          .update({ balance: Math.max(0, Number(account.balance) - Number(record.amount)) })
          .eq('id', record.account_id)
          .eq('user_id', userId);
      }
    }
    return;
  }

  // Fetch the expense first so we can reverse any linked account debit
  const { data: record } = await supabase
    .from('expenses')
    .select('amount, account_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;

  // Reverse the account debit if one was linked
  if (record?.account_id) {
    const { data: account } = await supabase
      .from('asset_accounts')
      .select('balance')
      .eq('id', record.account_id)
      .eq('user_id', userId)
      .single();

    if (account) {
      await supabase
        .from('asset_accounts')
        .update({ balance: Number(account.balance) + Number(record.amount) })
        .eq('id', record.account_id)
        .eq('user_id', userId);
    }
  }
}

export async function addExpense(params: {
  merchant:            string;
  categoryName:        string;
  categoryIcon:        string;
  amount:              number;
  date:                string;
  note?:               string;
  fromAccountId?:      string;
  fromCurrentBalance?: number;
  isRecurring?:        boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?:   string;
}): Promise<void> {
  const userId = await uid();

  // Find or create the matching expense category for this user
  const { data: existing } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', params.categoryName)
    .is('deleted_at', null)
    .maybeSingle();

  let categoryId: string;
  if (existing) {
    categoryId = existing.id;
  } else {
    const { data: newCat, error: catErr } = await supabase
      .from('expense_categories')
      .insert({ user_id: userId, name: params.categoryName, icon: params.categoryIcon, color: '#6B7280' })
      .select('id')
      .single();
    if (catErr) throw catErr;
    categoryId = newCat.id;
  }

  const { data: newExp, error: expErr } = await supabase
    .from('expenses')
    .insert({
      user_id:             userId,
      description:         params.merchant,
      amount:              params.amount,
      date:                params.date,
      category_id:         categoryId,
      notes:               params.note ?? null,
      account_id:          params.fromAccountId ?? null,
      is_recurring:        params.isRecurring ?? false,
      recurring_frequency: params.recurringFrequency ?? null,
      recurring_end_date:  params.recurringEndDate ?? null,
    })
    .select('id')
    .single();
  if (expErr) throw expErr;

  if (params.fromAccountId && params.fromCurrentBalance !== undefined) {
    const { error } = await supabase
      .from('asset_accounts')
      .update({ balance: Math.max(0, params.fromCurrentBalance - params.amount) })
      .eq('id', params.fromAccountId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  if (params.isRecurring && params.recurringFrequency) {
    await AsyncStorage.setItem(RECURRING_EXP_KEY + newExp.id, params.date);
  }
}

export async function addIncome(params: {
  description:         string;
  sourceName:          string;
  sourceType:          string;
  sourceIcon:          string;
  amount:              number;
  date:                string;
  note?:               string;
  toAccountId?:        string;
  toCurrentBalance?:   number;
  isRecurring?:        boolean;
  recurringFrequency?: RecurringFrequency;
}): Promise<void> {
  const userId = await uid();

  // Find or create income source by type for this user
  const { data: existing } = await supabase
    .from('income_sources')
    .select('id')
    .eq('user_id', userId)
    .eq('type', params.sourceType)
    .is('deleted_at', null)
    .maybeSingle();

  let sourceId: string;
  if (existing) {
    sourceId = existing.id;
    if (params.isRecurring !== undefined) {
      const { error: updateErr } = await supabase
        .from('income_sources')
        .update({
          is_recurring:        params.isRecurring,
          recurring_frequency: params.isRecurring ? (params.recurringFrequency ?? null) : null,
        })
        .eq('id', sourceId);
      if (updateErr) throw updateErr;
    }
  } else {
    const { data: newSrc, error: srcErr } = await supabase
      .from('income_sources')
      .insert({
        user_id:             userId,
        name:                params.sourceName,
        type:                params.sourceType,
        icon:                params.sourceIcon,
        is_recurring:        params.isRecurring ?? false,
        recurring_frequency: params.isRecurring ? (params.recurringFrequency ?? null) : null,
      })
      .select('id')
      .single();
    if (srcErr) throw srcErr;
    sourceId = newSrc.id;
  }

  const { error: recErr } = await supabase
    .from('income_records')
    .insert({
      user_id:     userId,
      source_id:   sourceId,
      description: params.description || params.sourceName,
      amount:      params.amount,
      date:        params.date,
      notes:       params.note ?? null,
      account_id:  params.toAccountId ?? null,
    });
  if (recErr) throw recErr;

  if (params.toAccountId && params.toCurrentBalance !== undefined) {
    const { error } = await supabase
      .from('asset_accounts')
      .update({ balance: params.toCurrentBalance + params.amount })
      .eq('id', params.toAccountId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  if (params.isRecurring && params.recurringFrequency) {
    await AsyncStorage.setItem(RECURRING_INC_KEY + sourceId, params.date);
  }
}

export async function addTransfer(params: {
  fromAccountId:      string;
  toAccountId:        string;
  fromAccountName:    string;
  toAccountName:      string;
  fromCurrentBalance: number;
  toCurrentBalance:   number;
  amount:             number;
  date:               string;
  note?:              string;
}): Promise<void> {
  const userId = await uid();

  const [r1, r2, r3] = await Promise.all([
    supabase
      .from('asset_accounts')
      .update({ balance: params.fromCurrentBalance - params.amount })
      .eq('id', params.fromAccountId)
      .eq('user_id', userId),
    supabase
      .from('asset_accounts')
      .update({ balance: params.toCurrentBalance + params.amount })
      .eq('id', params.toAccountId)
      .eq('user_id', userId),
    supabase.from('transfers').insert({
      user_id:         userId,
      from_account_id: params.fromAccountId,
      to_account_id:   params.toAccountId,
      amount:          params.amount,
      date:            params.date,
      notes:           params.note ?? null,
    }),
  ]);

  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
  if (r3.error) throw r3.error;
}

export async function getTransferById(rawId: string) {
  const transferId = rawId;
  const { data, error } = await supabase
    .from('transfers')
    .select(`*, from:asset_accounts!from_account_id(name), to:asset_accounts!to_account_id(name)`)
    .eq('id', transferId)
    .single();
  if (error) return null;
  return data as {
    id: string; amount: number; date: string; notes: string | null; created_at: string;
    from_account_id: string; to_account_id: string;
    from: { name: string }; to: { name: string };
  };
}

export async function deleteTransfer(rawId: string): Promise<void> {
  const userId     = await uid();
  const transferId = rawId;

  const { data: transfer, error: fetchErr } = await supabase
    .from('transfers')
    .select('amount, from_account_id, to_account_id')
    .eq('id', transferId)
    .eq('user_id', userId)
    .single();
  if (fetchErr) throw fetchErr;

  const [fromAcct, toAcct] = await Promise.all([
    supabase.from('asset_accounts').select('balance').eq('id', transfer.from_account_id).eq('user_id', userId).single(),
    supabase.from('asset_accounts').select('balance').eq('id', transfer.to_account_id).eq('user_id', userId).single(),
  ]);

  const [r1, r2, r3] = await Promise.all([
    supabase.from('transfers').delete().eq('id', transferId).eq('user_id', userId),
    fromAcct.data
      ? supabase.from('asset_accounts').update({ balance: fromAcct.data.balance + transfer.amount }).eq('id', transfer.from_account_id).eq('user_id', userId)
      : Promise.resolve({ error: null }),
    toAcct.data
      ? supabase.from('asset_accounts').update({ balance: toAcct.data.balance - transfer.amount }).eq('id', transfer.to_account_id).eq('user_id', userId)
      : Promise.resolve({ error: null }),
  ]);

  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
  if (r3.error) throw r3.error;
}

// ── Budgets ────────────────────────────────────────────────────────────────────

export async function getBudgets(forYear?: number, forMonth?: number): Promise<Budget[]> {
  const userId = await uid();
  const now    = new Date();
  const year   = forYear  ?? now.getFullYear();
  const month  = forMonth ?? now.getMonth() + 1;

  const [catRes, expRes] = await Promise.all([
    supabase
      .from('expense_categories')
      .select('id, name, icon, color, budget_limit')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .not('budget_limit', 'is', null),

    supabase
      .from('expenses')
      .select('category_id, amount')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('date', `${year}-${String(month).padStart(2, '0')}-01`)
      .lt('date', month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`),
  ]);

  const spentByCategory: Record<string, number> = {};
  for (const e of expRes.data ?? []) {
    spentByCategory[e.category_id] =
      (spentByCategory[e.category_id] ?? 0) + Number(e.amount);
  }

  return (catRes.data as RawCategoryRow[] ?? []).map((c: RawCategoryRow) => ({
    id:       c.id,
    category: categoryKey(c.name, false),
    label:    c.name,
    icon:     expenseIcon(c.name, c.icon),
    color:    c.color ?? '#6B7280',
    limit:    Number(c.budget_limit ?? 0),
    spent:    spentByCategory[c.id] ?? 0,
    month,
    year,
  }));
}

export async function updateBudgetLimit(
  categoryName: string,
  categoryIcon: string,
  newLimit: number,
  categoryColor = '#6B7280',
): Promise<void> {
  const userId = await uid();

  // Find existing category row for this user
  const { data: existing } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', categoryName)
    .is('deleted_at', null)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('expense_categories')
      .update({ budget_limit: newLimit, icon: categoryIcon, color: categoryColor })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('expense_categories')
      .insert({ user_id: userId, name: categoryName, icon: categoryIcon, budget_limit: newLimit, color: categoryColor });
    if (error) throw error;
  }
}

// ── Savings Goals ──────────────────────────────────────────────────────────────

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const userId = await uid();

  const { data } = await supabase
    .from('savings_goals')
    .select('id, name, category, icon, target_amount, color, priority, savings_goal_contributions(amount)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('priority', { ascending: false });

  return (data as RawGoalRow[] ?? []).map((g: RawGoalRow) => {
    const contributed = (g.savings_goal_contributions ?? [])
      .reduce((sum: number, c: { amount: unknown }) => sum + Number(c.amount), 0);
    return {
      id:           g.id,
      name:         g.name,
      emoji:        g.icon ?? GOAL_EMOJI[g.category ?? 'other'] ?? '🎯',
      targetAmount: Number(g.target_amount ?? 0),
      savedAmount:  contributed,
      color:        g.color ?? '#755DEF',
      priority:     g.priority ?? 5,
    };
  });
}

export async function createSavingsGoal(params: {
  name: string;
  emoji: string;
  targetAmount: number;
  color: string;
}): Promise<SavingsGoal> {
  const userId = await uid();

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id:       userId,
      name:          params.name,
      target_amount: params.targetAmount,
      color:         params.color,
      icon:          params.emoji,
      priority:      5,
      is_active:     true,
    })
    .select('id, name, icon, target_amount, color, priority')
    .single();

  if (error) throw error;

  return {
    id:           data.id,
    name:         data.name,
    emoji:        data.icon ?? params.emoji,
    targetAmount: Number(data.target_amount),
    savedAmount:  0,
    color:        data.color ?? '#755DEF',
    priority:     data.priority ?? 5,
  };
}

export interface Contribution {
  id:     string;
  date:   string;
  amount: number;
  note:   string;
}

export async function getContributions(goalId: string): Promise<Contribution[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('savings_goal_contributions')
    .select('id, amount, date, description')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as RawContribRow[] ?? []).map((c: RawContribRow) => ({
    id:     c.id,
    date:   new Date(c.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    amount: Number(c.amount),
    note:   c.description ?? 'Contribution',
  }));
}

export async function addContribution(
  goalId:           string,
  amount:           number,
  description:      string,
  fromAccountId?:   string,
  fromCurrentBalance?: number,
): Promise<void> {
  const userId = await uid();

  const insertContrib = async () => {
    const { error } = await supabase
      .from('savings_goal_contributions')
      .insert({
        user_id:     userId,
        goal_id:     goalId,
        amount,
        date:        new Date().toISOString().split('T')[0],
        description: description.trim() || 'Contribution',
        account_id:  fromAccountId ?? null,
      });
    if (error) throw error;
  };

  const ops: Promise<void>[] = [insertContrib()];

  if (fromAccountId && fromCurrentBalance !== undefined) {
    const debitAccount = async () => {
      const { error } = await supabase
        .from('asset_accounts')
        .update({ balance: Math.max(0, fromCurrentBalance - amount) })
        .eq('id', fromAccountId)
        .eq('user_id', userId);
      if (error) throw error;
    };
    ops.push(debitAccount());
  }

  await Promise.all(ops);
}

export async function deleteSavingsGoal(goalId: string): Promise<void> {
  const userId = await uid();

  // Fetch all contributions that were funded from an account
  const { data: contribs } = await supabase
    .from('savings_goal_contributions')
    .select('amount, account_id')
    .eq('goal_id', goalId)
    .eq('user_id', userId)
    .not('account_id', 'is', null);

  // Sum refund per account
  const refundMap: Record<string, number> = {};
  for (const c of contribs ?? []) {
    if (c.account_id) {
      refundMap[c.account_id] = (refundMap[c.account_id] ?? 0) + Number(c.amount ?? 0);
    }
  }

  const accountIds = Object.keys(refundMap);
  if (accountIds.length > 0) {
    // Fetch current balances for affected accounts
    const { data: accounts } = await supabase
      .from('asset_accounts')
      .select('id, balance')
      .in('id', accountIds)
      .eq('user_id', userId);

    const refundOps = (accounts as RawAcctBalRow[] ?? []).map((acc: RawAcctBalRow) => {
      const newBalance = Number(acc.balance ?? 0) + (refundMap[acc.id] ?? 0);
      return supabase
        .from('asset_accounts')
        .update({ balance: newBalance })
        .eq('id', acc.id)
        .eq('user_id', userId);
    });

    await Promise.all(refundOps);
  }

  // Soft-delete the goal
  const { error } = await supabase
    .from('savings_goals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', goalId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Accounts ───────────────────────────────────────────────────────────────────

export async function getAccounts(): Promise<Account[]> {
  const userId = await uid();

  const { data } = await supabase
    .from('asset_accounts')
    .select('id, name, asset_type, balance')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('balance', { ascending: false });

  return (data as RawAssetAcctRow[] ?? []).map((a: RawAssetAcctRow, i: number) => ({
    id:              a.id,
    institutionName: a.name,
    maskedNumber:    '•••• ••••',
    type:            (['checking', 'savings', 'credit'].includes(a.asset_type)
                       ? a.asset_type
                       : 'savings') as 'checking' | 'savings' | 'credit',
    balance:         Number(a.balance ?? 0),
    gradientIndex:   i % 3,
  }));
}

// ── Investment Holdings ────────────────────────────────────────────────────────

export async function getInvestments(): Promise<InvestmentHolding[]> {
  const userId = await uid();

  const { data } = await supabase
    .from('investment_holdings')
    .select('id, account_id, symbol, name, asset_class, shares, purchase_price, current_price')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('current_price', { ascending: false });

  return (data as RawHoldingRow[] ?? []).map((h: RawHoldingRow, i: number) => ({
    id:              h.id,
    accountId:       h.account_id,
    symbol:          h.symbol,
    name:            h.name,
    assetType:       mapAssetClass(h.asset_class ?? ''),
    shares:          Number(h.shares         ?? 0),
    avgCostPerShare: Number(h.purchase_price  ?? 0),
    currentPrice:    Number(h.current_price   ?? 0),
    color:           INVEST_COLORS[i % INVEST_COLORS.length],
  }));
}

const ASSET_CLASS_MAP: Record<string, string> = {
  stock: 'stocks', etf: 'etf', fund: 'mutual_fund', bond: 'bonds', crypto: 'crypto',
};

async function getOrCreateDefaultAccount(userId: string): Promise<string> {
  const { data } = await supabase
    .from('investment_accounts')
    .select('id')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) return data.id;

  const { data: created, error } = await supabase
    .from('investment_accounts')
    .insert({ user_id: userId, name: 'My Portfolio', account_type: 'brokerage', institution: '', balance: 0 })
    .select('id')
    .single();

  if (error) throw error;
  return created.id;
}

export async function addHolding(params: {
  symbol:          string;
  name:            string;
  assetType:       string;
  shares:          number;
  avgCostPerShare: number;
  currentPrice:    number;
}): Promise<InvestmentHolding> {
  const userId    = await uid();
  const accountId = await getOrCreateDefaultAccount(userId);

  const { data, error } = await supabase
    .from('investment_holdings')
    .insert({
      user_id:        userId,
      account_id:     accountId,
      symbol:         params.symbol,
      name:           params.name,
      asset_class:    ASSET_CLASS_MAP[params.assetType] ?? 'stocks',
      shares:         params.shares,
      purchase_price: params.avgCostPerShare,
      current_price:  params.currentPrice,
      purchase_date:  new Date().toISOString().split('T')[0],
    })
    .select('id, account_id, symbol, name, asset_class, shares, purchase_price, current_price')
    .single();

  if (error) throw error;

  return {
    id:              data.id,
    accountId:       data.account_id,
    symbol:          data.symbol,
    name:            data.name,
    assetType:       mapAssetClass(data.asset_class ?? ''),
    shares:          Number(data.shares),
    avgCostPerShare: Number(data.purchase_price),
    currentPrice:    Number(data.current_price),
    color:           INVEST_COLORS[0],
  };
}

export async function logTrade(params: {
  holdingId:      string;
  accountId:      string;
  symbol:         string;
  txType:         'buy' | 'sell';
  shares:         number;
  price:          number;
  currentShares:  number;
  currentAvgCost: number;
}): Promise<void> {
  const userId = await uid();

  const newShares  = params.txType === 'buy'
    ? params.currentShares + params.shares
    : Math.max(params.currentShares - params.shares, 0);
  const newAvgCost = params.txType === 'buy'
    ? ((params.currentShares * params.currentAvgCost) + (params.shares * params.price)) / newShares
    : params.currentAvgCost;

  const updatePayload: Record<string, unknown> = {
    shares:         newShares,
    purchase_price: newAvgCost,
    current_price:  params.price,
  };
  if (newShares === 0) updatePayload.deleted_at = new Date().toISOString();

  const [updateRes, txRes] = await Promise.all([
    supabase
      .from('investment_holdings')
      .update(updatePayload)
      .eq('id', params.holdingId)
      .eq('user_id', userId),
    supabase
      .from('investment_transactions')
      .insert({
        user_id:          userId,
        account_id:       params.accountId,
        holding_id:       params.holdingId,
        transaction_type: params.txType,
        symbol:           params.symbol,
        shares:           params.shares,
        price_per_share:  params.price,
        total_amount:     params.shares * params.price,
        date:             new Date().toISOString().split('T')[0],
      }),
  ]);

  if (updateRes.error) throw updateRes.error;
  if (txRes.error)     throw txRes.error;
}

export async function deleteHolding(holdingId: string): Promise<void> {
  // Uses a SECURITY DEFINER function to bypass the RLS catch-22 where
  // setting deleted_at makes the row fail the SELECT policy WITH CHECK.
  // Ownership is still verified inside the function via auth.uid().
  const { error } = await supabase.rpc('delete_investment_holding', {
    p_holding_id: holdingId,
  });
  if (error) throw error;
}

// ── Other Assets ───────────────────────────────────────────────────────────────

export interface OtherAsset {
  id: string;
  name: string;
  category: string;
  value: number;
  purchaseValue: number | null;
  purchaseDate: string | null;
  notes: string | null;
}

export async function getOtherAssets(): Promise<OtherAsset[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('other_assets')
    .select('id, name, category, value, purchase_value, purchase_date, notes')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('value', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(r => ({
    id: r.id, name: r.name, category: r.category, value: r.value,
    purchaseValue: r.purchase_value, purchaseDate: r.purchase_date, notes: r.notes,
  }));
}

export async function addOtherAsset(params: {
  name: string; category: string; value: number;
  purchaseValue?: number; purchaseDate?: string; notes?: string;
}): Promise<OtherAsset> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('other_assets')
    .insert({
      user_id:        userId,
      name:           params.name,
      category:       params.category,
      value:          params.value,
      purchase_value: params.purchaseValue ?? null,
      purchase_date:  params.purchaseDate  ?? null,
      notes:          params.notes         ?? null,
    })
    .select('id, name, category, value, purchase_value, purchase_date, notes')
    .single();
  if (error) throw error;
  return {
    id: data.id, name: data.name, category: data.category, value: data.value,
    purchaseValue: data.purchase_value, purchaseDate: data.purchase_date, notes: data.notes,
  };
}

export async function updateOtherAsset(id: string, params: {
  name?: string; category?: string; value?: number;
  purchaseValue?: number | null; purchaseDate?: string | null; notes?: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('other_assets')
    .update({
      name:           params.name,
      category:       params.category,
      value:          params.value,
      purchase_value: params.purchaseValue,
      purchase_date:  params.purchaseDate,
      notes:          params.notes,
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteOtherAsset(assetId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_other_asset', { p_asset_id: assetId });
  if (error) throw error;
}

// ── Assets ─────────────────────────────────────────────────────────────────────

const CATEGORY_TO_DB_TYPE: Record<string, string> = {
  cash:        'savings',
  real_estate: 'property',
  vehicle:     'vehicle',
  other:       'other',
};

export async function createAsset(params: {
  name:     string;
  category: string;
  balance:  number;
}): Promise<AssetItem> {
  const userId  = await uid();
  const dbType  = CATEGORY_TO_DB_TYPE[params.category] ?? 'other';
  const { data, error } = await supabase
    .from('asset_accounts')
    .insert({
      user_id:    userId,
      name:       params.name,
      asset_type: dbType,
      balance:    params.balance,
      currency:   'PHP',
    })
    .select('id, name, asset_type, balance')
    .single();
  if (error) throw error;
  return {
    id:       data.id,
    name:     data.name,
    category: mapAssetType(data.asset_type ?? ''),
    balance:  Number(data.balance ?? 0),
    icon:     ASSET_ICON[data.asset_type ?? ''] ?? '🏦',
    color:    '#755DEF',
  };
}

export async function updateAssetBalance(id: string, balance: number): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('asset_accounts')
    .update({ balance })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateAsset(id: string, params: { name: string; category: string; balance: number }): Promise<void> {
  const userId = await uid();
  const dbType = CATEGORY_TO_DB_TYPE[params.category] ?? 'other';
  const { error } = await supabase
    .from('asset_accounts')
    .update({ name: params.name, asset_type: dbType, balance: params.balance })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteAsset(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('asset_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function hasTransactionsForAccount(accountId: string): Promise<number> {
  const userId = await uid();
  const [expRes, incRes] = await Promise.all([
    supabase.from('expenses').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('account_id', accountId).is('deleted_at', null),
    supabase.from('income_records').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('account_id', accountId),
  ]);
  return (expRes.count ?? 0) + (incRes.count ?? 0);
}

export async function getAssets(): Promise<AssetItem[]> {
  const userId = await uid();

  const [assetRes, holdingRes, goalRes] = await Promise.all([
    supabase
      .from('asset_accounts')
      .select('id, name, asset_type, balance')
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('investment_holdings')
      .select('id, shares, current_price')
      .eq('user_id', userId)
      .is('deleted_at', null),
    // Only include contributions from non-deleted goals
    supabase
      .from('savings_goals')
      .select('savings_goal_contributions(amount)')
      .eq('user_id', userId)
      .is('deleted_at', null),
  ]);

  const accountItems: AssetItem[] = (assetRes.data as RawAssetRow[] ?? []).map((a: RawAssetRow) => ({
    id:       a.id,
    name:     a.name,
    category: mapAssetType(a.asset_type ?? ''),
    balance:  Number(a.balance ?? 0),
    icon:     ASSET_ICON[a.asset_type ?? ''] ?? '🏦',
    color:    '#755DEF',
  }));

  const investTotal = (holdingRes.data ?? []).reduce(
    (sum: number, h: RawSharesRow) => sum + Number(h.shares ?? 0) * Number(h.current_price ?? 0),
    0
  );

  const savingsTotal = (goalRes.data ?? []).reduce(
    (sum: number, g: RawGoalContribRow) => sum + (g.savings_goal_contributions ?? []).reduce(
      (s: number, c: { amount: unknown }) => s + Number(c.amount ?? 0), 0
    ),
    0
  );

  const items: AssetItem[] = [...accountItems];
  if (investTotal > 0) {
    items.push({
      id:       'investment_portfolio',
      name:     'Investment Portfolio',
      category: 'investment',
      balance:  investTotal,
      icon:     '📈',
      color:    '#F97316',
    });
  }
  if (savingsTotal > 0) {
    items.push({
      id:       'savings_goals_total',
      name:     'Savings Goals',
      category: 'other',
      balance:  savingsTotal,
      icon:     '🏦',
      color:    '#22C55E',
    });
  }

  return items;
}

// ── Debts ──────────────────────────────────────────────────────────────────────

// ── Analytics history ──────────────────────────────────────────────────────────

export interface MonthPoint {
  label:   string;
  month:   string;  // YYYY-MM-01 from DB; empty string for weekly day-of-week entries
  income:  number;
  expense: number;
  savings: number;
}

export interface NWPoint {
  label:   string;
  nw:      number;
  isLive?: boolean;
  date?:   string;   // ISO date "YYYY-MM-DD"; present on snapshots, absent on the live point
}

export interface IncomeStream {
  label:  string;
  icon:   string;
  amount: number;
  color:  string;
  pct:    number;
}

const STREAM_COLORS = ['#755DEF', '#22C55E', '#F97316', '#3B82F6', '#EC4899'];
const MONTH_NAMES   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return MONTH_NAMES[d.getUTCMonth()];
}

export async function getMonthlyHistory(months = 6): Promise<MonthPoint[]> {
  const userId = await uid();

  const cutoff = new Date();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - (months - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const { data } = await supabase
    .from('monthly_cash_flow')
    .select('month, total_income, total_expenses, net_cash_flow')
    .eq('user_id', userId)
    .gte('month', cutoffStr)
    .order('month', { ascending: true })
    .limit(months);

  return (data as RawCashFlowRow[] ?? []).map((r: RawCashFlowRow) => ({
    label:   monthLabel(r.month),
    month:   r.month,
    income:  Number(r.total_income   ?? 0),
    expense: Number(r.total_expenses ?? 0),
    savings: Number(r.net_cash_flow  ?? 0),
  }));
}

export async function getWeeklyHistory(): Promise<MonthPoint[]> {
  const userId = await uid();

  const now    = new Date();
  const dow    = now.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(now);
  monday.setDate(now.getDate() + offset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  const monStr = monday.toISOString().slice(0, 10);
  const sunStr = sunday.toISOString().slice(0, 10);

  const [expRes, incRes] = await Promise.all([
    supabase.from('expenses').select('date, amount').eq('user_id', userId).is('deleted_at', null).gte('date', monStr).lt('date', sunStr),
    supabase.from('income_records').select('date, amount').eq('user_id', userId).is('deleted_at', null).gte('date', monStr).lt('date', sunStr),
  ]);

  const DAY = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const result: MonthPoint[] = DAY.map(label => ({ label, month: '', income: 0, expense: 0, savings: 0 }));

  for (const e of expRes.data ?? []) {
    const idx = (new Date(e.date + 'T00:00:00').getDay() + 6) % 7;
    result[idx].expense += Number(e.amount);
  }
  for (const r of incRes.data ?? []) {
    const idx = (new Date(r.date + 'T00:00:00').getDay() + 6) % 7;
    result[idx].income += Number(r.amount);
  }
  result.forEach(r => { r.savings = r.income - r.expense; });
  return result;
}

export async function getNetWorthHistory(months = 12): Promise<NWPoint[]> {
  const userId = await uid();

  const cutoff = new Date();
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - (months - 1));
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const [snapRes, bankRes, holdingRes, goalRes, debtRes] = await Promise.all([
    supabase
      .from('net_worth_snapshots')
      .select('snapshot_date, net_worth')
      .eq('user_id', userId)
      .gte('snapshot_date', cutoffStr)
      .order('snapshot_date', { ascending: true })
      .limit(months),
    supabase.from('asset_accounts').select('balance').eq('user_id', userId).is('deleted_at', null),
    supabase.from('investment_holdings').select('shares, current_price').eq('user_id', userId).is('deleted_at', null),
    supabase.from('savings_goals').select('savings_goal_contributions(amount)').eq('user_id', userId).is('deleted_at', null),
    supabase.from('debt_accounts').select('balance').eq('user_id', userId).is('deleted_at', null),
  ]);

  // Exclude the current month's snapshot — "Now" (appended below) already
  // represents the current live state, so keeping the current-month snapshot
  // would make the last two entries nearly identical and collapse the MoM delta to ~0%.
  const today = new Date();
  const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const snapshots = (snapRes.data as RawNWRow[] ?? [])
    .filter((r: RawNWRow) => !r.snapshot_date.startsWith(currentMonthPrefix))
    .map((r: RawNWRow) => ({
      label: monthLabel(r.snapshot_date),
      nw:    Number(r.net_worth ?? 0),
      date:  r.snapshot_date,
    }));

  // Compute live net worth to append as the "Now" point
  const bankTotal      = (bankRes.data    as RawBalanceRow[]     ?? []).reduce((s, a) => s + Number(a.balance ?? 0), 0);
  const investTotal    = (holdingRes.data as RawSharesRow[]      ?? []).reduce((s, h) => s + Number(h.shares ?? 0) * Number(h.current_price ?? 0), 0);
  const savingsTotal   = (goalRes.data    as RawGoalContribRow[] ?? []).reduce((s, g) =>
    s + (g.savings_goal_contributions ?? []).reduce((gs, c) => gs + Number(c.amount ?? 0), 0), 0);
  const totalDebtsLive = (debtRes.data    as RawBalanceRow[]     ?? []).reduce((s, d) => s + Number(d.balance ?? 0), 0);
  const liveNW         = bankTotal + investTotal + savingsTotal - totalDebtsLive;

  return [...snapshots, { label: 'Now', nw: liveNW, isLive: true }];
}

export async function getIncomeStreams(): Promise<IncomeStream[]> {
  const userId = await uid();
  const now    = new Date();
  const y      = now.getFullYear();
  const m      = now.getMonth() + 1;
  const start  = `${y}-${String(m).padStart(2, '0')}-01`;
  const end    = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;

  const { data } = await supabase
    .from('income_records')
    .select('amount, income_sources(name, icon)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .gte('date', start)
    .lt('date', end);

  const map = new Map<string, { label: string; icon: string; amount: number }>();
  for (const r of (data as unknown as RawIncomeRecRow[] ?? [])) {
    const name = r.income_sources?.name ?? 'Other';
    const curr = map.get(name) ?? { label: name, icon: r.income_sources?.icon ?? '💰', amount: 0 };
    map.set(name, { ...curr, amount: curr.amount + Number(r.amount) });
  }

  const items   = [...map.values()].sort((a, b) => b.amount - a.amount);
  const total   = items.reduce((s, i) => s + i.amount, 0);
  return items.map((item, idx) => ({
    ...item,
    color: STREAM_COLORS[idx % STREAM_COLORS.length],
    pct:   total > 0 ? Math.round((item.amount / total) * 1000) / 10 : 0,
  }));
}

// ── Debts ──────────────────────────────────────────────────────────────────────

export async function createDebt(params: {
  name:           string;
  debtType:       DebtCategory;
  balance:        number;
  originalAmount: number;
  interestRate:   number;
  monthlyPayment: number;
}): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('debt_accounts')
    .insert({
      user_id:         userId,
      name:            params.name,
      debt_type:       params.debtType,
      balance:         params.balance,
      original_amount: params.originalAmount,
      annual_rate:     params.interestRate,
      monthly_payment: params.monthlyPayment,
    });
  if (error) throw error;
}

export async function updateDebtBalance(id: string, newBalance: number): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('debt_accounts')
    .update({ balance: newBalance })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateDebt(id: string, params: { name: string; balance: number }): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('debt_accounts')
    .update({ name: params.name, balance: params.balance })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function addDebtCharge(id: string, currentBalance: number, currentOriginal: number, chargeAmount: number): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('debt_accounts')
    .update({
      balance:         currentBalance  + chargeAmount,
      original_amount: currentOriginal + chargeAmount,
    })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteDebt(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('debt_accounts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function makeDebtPayment(params: {
  debtId:              string;
  debtName:            string;
  currentBalance:      number;
  paymentAmount:       number;
  date:                string;
  fromAccountId?:      string;
  fromCurrentBalance?: number;
}): Promise<void> {
  const userId = await uid();
  const newDebtBalance = Math.max(0, params.currentBalance - params.paymentAmount);

  // 1. Reduce debt balance
  const { error: debtErr } = await supabase
    .from('debt_accounts')
    .update({ balance: newDebtBalance })
    .eq('id', params.debtId)
    .eq('user_id', userId);
  if (debtErr) throw debtErr;

  // 2. Debit bank account if one was selected
  if (params.fromAccountId && params.fromCurrentBalance !== undefined) {
    const newAccountBalance = Math.max(0, params.fromCurrentBalance - params.paymentAmount);
    const { error: accErr } = await supabase
      .from('asset_accounts')
      .update({ balance: newAccountBalance })
      .eq('id', params.fromAccountId)
      .eq('user_id', userId);
    if (accErr) throw accErr;
  }

  // 3. Record as expense transaction under "Debt Payment" category
  const { data: existingCat } = await supabase
    .from('expense_categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', 'Debt Payment')
    .is('deleted_at', null)
    .maybeSingle();

  let categoryId: string;
  if (existingCat) {
    categoryId = existingCat.id;
  } else {
    const { data: newCat, error: catErr } = await supabase
      .from('expense_categories')
      .insert({ user_id: userId, name: 'Debt Payment', icon: '💳', color: '#EF4444' })
      .select('id')
      .single();
    if (catErr) throw catErr;
    categoryId = newCat.id;
  }

  const { error: expErr } = await supabase
    .from('expenses')
    .insert({
      user_id:     userId,
      description: `${params.debtName} payment`,
      amount:      params.paymentAmount,
      date:        params.date,
      category_id: categoryId,
      notes:       `Debt payment — balance reduced to ₱${newDebtBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      account_id:  params.fromAccountId ?? null,
    });
  if (expErr) throw expErr;
}

export async function getDebts(): Promise<DebtItem[]> {
  const userId = await uid();

  const { data } = await supabase
    .from('debt_accounts')
    .select('id, name, debt_type, balance, original_amount, annual_rate, monthly_payment')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('balance', { ascending: false });

  return (data as RawDebtRow[] ?? []).map((d: RawDebtRow) => ({
    id:             d.id,
    name:           d.name,
    category:       mapDebtType(d.debt_type ?? ''),
    balance:        Number(d.balance          ?? 0),
    originalAmount: Number(d.original_amount  ?? 0),
    interestRate:   Number(d.annual_rate       ?? 0),
    monthlyPayment: Number(d.monthly_payment   ?? 0),
    icon:           DEBT_ICON[d.debt_type ?? ''] ?? '💰',
    color:          '#EF4444',
  }));
}

// ── Investment trade history ───────────────────────────────────────────────────

export async function getTradeHistory(filters: {
  holdingId?: string;
  accountId?: string;
  limit?: number;
}): Promise<InvestmentTransaction[]> {
  const userId = await uid();

  let query = supabase
    .from('investment_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.holdingId) query = query.eq('holding_id', filters.holdingId);
  if (filters.accountId) query = query.eq('account_id', filters.accountId);
  if (filters.limit)     query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as InvestmentTransaction[];
}

// ── Recurring Transactions ─────────────────────────────────────────────────────

export interface RecurringExpense {
  id:           string;
  description:  string;
  amount:       number;
  categoryName: string;
  categoryIcon: string;
  frequency:    RecurringFrequency;
  endDate:      string | null;
  startDate:    string;
  nextDueDate:  string;
}

export interface RecurringIncomeSource {
  id:           string;
  name:         string;
  icon:         string;
  type:         string;
  frequency:    RecurringFrequency;
  latestAmount: number;
  nextDueDate:  string;
}

function toISODateStr(d: Date): string {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates the next scheduled occurrence from a given anchor date.
 * Used for recurring schedule generation and UI previews.
 *
 * Note: this is not guaranteed to be the actual next pending occurrence
 * if multiple recurrences have already been auto-generated. Use AsyncStorage
 * lastApplied keys for authoritative schedule state.
 */
export function calcNextDue(lastDateStr: string, freq: RecurringFrequency): string {
  // Use noon to avoid daylight-saving edge cases
  const d = new Date(lastDateStr + 'T12:00:00');
  switch (freq) {
    case 'daily':       d.setDate(d.getDate() + 1);          break;
    case 'weekly':      d.setDate(d.getDate() + 7);          break;
    case 'monthly':     d.setMonth(d.getMonth() + 1);        break;
    case 'yearly':      d.setFullYear(d.getFullYear() + 1);  break;
    case 'semimonthly':
      // Anchored to the 1st and 15th of each month — NOT a 15-day interval.
      // day < 15 → advance to the 15th of the same month
      // day ≥ 15 → advance to the 1st of the next month
      if (d.getDate() < 15) {
        d.setDate(15);
      } else {
        d.setMonth(d.getMonth() + 1, 1);
      }
      break;
  }
  return toISODateStr(d);
}

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const userId = await uid();

  type Row = {
    id: string; description: string; amount: number; date: string;
    recurring_frequency: string; recurring_end_date: string | null;
    expense_categories: { name: string; icon: string | null }[] | null;
  };

  const { data, error } = await supabase
    .from('expenses')
    .select('id, description, amount, date, recurring_frequency, recurring_end_date, expense_categories(name, icon)')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .order('date', { ascending: false });
  if (error) throw error;

  const results: RecurringExpense[] = [];
  for (const row of ((data ?? []) as unknown as Row[])) {
    const freq = row.recurring_frequency as RecurringFrequency | null;
    if (!freq) continue;
    const lastApplied = await AsyncStorage.getItem(RECURRING_EXP_KEY + row.id) ?? row.date;
    const cat = Array.isArray(row.expense_categories) ? row.expense_categories[0] : row.expense_categories;
    results.push({
      id:           row.id,
      description:  row.description,
      amount:       row.amount,
      categoryName: cat?.name ?? 'Expense',
      categoryIcon: cat?.icon ?? '💸',
      frequency:    freq,
      endDate:      row.recurring_end_date,
      startDate:    row.date,
      nextDueDate:  calcNextDue(lastApplied, freq),
    });
  }
  return results;
}

export async function getRecurringIncomeSources(): Promise<RecurringIncomeSource[]> {
  const userId = await uid();

  type SourceRow = { id: string; name: string; icon: string | null; type: string; recurring_frequency: string };
  type RecordRow = { amount: number };

  const { data: sources, error } = await supabase
    .from('income_sources')
    .select('id, name, icon, type, recurring_frequency')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null);
  if (error) throw error;

  const results: RecurringIncomeSource[] = [];
  for (const src of ((sources ?? []) as SourceRow[])) {
    const freq = src.recurring_frequency as RecurringFrequency | null;
    if (!freq) continue;

    const { data: latestRecord } = await supabase
      .from('income_records')
      .select('amount')
      .eq('user_id', userId)
      .eq('source_id', src.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastApplied = await AsyncStorage.getItem(RECURRING_INC_KEY + src.id)
      ?? toISODateStr(new Date());

    results.push({
      id:           src.id,
      name:         src.name,
      icon:         src.icon ?? '💰',
      type:         src.type,
      frequency:    freq,
      latestAmount: (latestRecord as RecordRow | null)?.amount ?? 0,
      nextDueDate:  calcNextDue(lastApplied, freq),
    });
  }
  return results;
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString(), is_recurring: false })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
  await AsyncStorage.removeItem(RECURRING_EXP_KEY + id);
}

export async function deleteRecurringIncomeSource(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('income_sources')
    .update({ is_recurring: false, recurring_frequency: null })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
  await AsyncStorage.removeItem(RECURRING_INC_KEY + id);
}

// Performance cache — not a correctness lock. Correctness is guaranteed by
// per-template lastApplied boundaries. If this key is missing or stale the
// function re-runs safely; the while-loop simply won't fire for already-advanced
// templates.
const RECURRING_LAST_RUN_KEY = 'recurring_last_run_date';

export async function applyDueRecurringTransactions(): Promise<void> {
  let userId: string;
  try {
    userId = await uid();
  } catch {
    return; // not authenticated
  }

  const today = toISODateStr(new Date());

  // Performance gate: skip if already ran today.
  // Correctness invariant: per-template lastApplied is the generation boundary.
  // It is always written immediately after each insert batch, so the while-loop
  // condition (nextDue <= today) will never re-fire for an already-generated date —
  // even if this gate is absent or bypassed.
  const lastRun = await AsyncStorage.getItem(RECURRING_LAST_RUN_KEY);
  if (lastRun === today) return;

  const MAX_CATCH_UP = 60; // safety cap: never create more than 60 auto-instances per template

  // ── Recurring expenses ────────────────────────────────────────────────────

  type ExpRow = {
    id: string; description: string; amount: number; date: string;
    recurring_frequency: string; recurring_end_date: string | null;
    category_id: string;
  };

  const { data: recurringExps } = await supabase
    .from('expenses')
    .select('id, description, amount, date, recurring_frequency, recurring_end_date, category_id')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null);

  for (const exp of ((recurringExps ?? []) as ExpRow[])) {
    const freq = exp.recurring_frequency as RecurringFrequency | null;
    if (!freq) continue;
    if (exp.recurring_end_date && exp.recurring_end_date < today) continue;

    const lastApplied = await AsyncStorage.getItem(RECURRING_EXP_KEY + exp.id) ?? exp.date;
    let nextDue = calcNextDue(lastApplied, freq);
    let newLastApplied = lastApplied;
    let count = 0;

    while (nextDue <= today && count < MAX_CATCH_UP) {
      if (exp.recurring_end_date && nextDue > exp.recurring_end_date) break;
      await supabase.from('expenses').insert({
        user_id:      userId,
        description:  exp.description,
        amount:       exp.amount,
        date:         nextDue,
        category_id:  exp.category_id,
        is_recurring: false,
      });
      newLastApplied = nextDue;
      nextDue = calcNextDue(nextDue, freq);
      count++;
    }

    if (newLastApplied !== lastApplied) {
      await AsyncStorage.setItem(RECURRING_EXP_KEY + exp.id, newLastApplied);
    }
  }

  // ── Recurring income sources ──────────────────────────────────────────────

  type SrcRow = { id: string; name: string; icon: string | null; type: string; recurring_frequency: string };
  type RecRow = { amount: number; date: string };

  const { data: recurringSrcs } = await supabase
    .from('income_sources')
    .select('id, name, icon, type, recurring_frequency')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null);

  for (const src of ((recurringSrcs ?? []) as SrcRow[])) {
    const freq = src.recurring_frequency as RecurringFrequency | null;
    if (!freq) continue;

    // Get latest income_record to use as the default amount
    const { data: latestRec } = await supabase
      .from('income_records')
      .select('amount, date')
      .eq('user_id', userId)
      .eq('source_id', src.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const rec = latestRec as RecRow | null;
    if (!rec) continue; // no income_record yet — skip

    const lastApplied = await AsyncStorage.getItem(RECURRING_INC_KEY + src.id) ?? rec.date;
    let nextDue = calcNextDue(lastApplied, freq);
    let newLastApplied = lastApplied;
    let count = 0;

    while (nextDue <= today && count < MAX_CATCH_UP) {
      await supabase.from('income_records').insert({
        user_id:     userId,
        source_id:   src.id,
        description: src.name,
        amount:      rec.amount,
        date:        nextDue,
      });
      newLastApplied = nextDue;
      nextDue = calcNextDue(nextDue, freq);
      count++;
    }

    if (newLastApplied !== lastApplied) {
      await AsyncStorage.setItem(RECURRING_INC_KEY + src.id, newLastApplied);
    }
  }

  // Mark today as processed — must be last so a mid-run crash forces a retry
  await AsyncStorage.setItem(RECURRING_LAST_RUN_KEY, today);
}
