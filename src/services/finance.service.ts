import { supabase } from '../lib/supabase';
import type {
  DashboardSummary, Transaction, Budget, SavingsGoal,
  Account, AssetItem, DebtItem, InvestmentHolding,
  AssetCategory, DebtCategory, AssetType,
} from '../types/models';
import type { CategoryKey } from '../theme';

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

  const row   = (summaryRes.data as any[])?.[0] ?? {};
  const snaps = snapshotsRes.data ?? [];

  const bankTotal       = (bankRes.data ?? []).reduce((s: number, a: any) => s + Number(a.balance ?? 0), 0);
  const investmentValue = (holdingRes.data ?? []).reduce((s: number, h: any) => s + Number(h.shares ?? 0) * Number(h.current_price ?? 0), 0);
  const savingsTotal    = (goalRes.data ?? []).reduce((s: number, g: any) =>
    s + (g.savings_goal_contributions ?? []).reduce((gs: number, c: any) => gs + Number(c.amount ?? 0), 0), 0);

  // totalAssets uses the same three sources as getAssets() so both screens always agree
  const totalAssets     = bankTotal + investmentValue + savingsTotal;
  const totalDebts      = Number(row.total_debts        ?? 0);
  const monthlyIncome   = Number(row.monthly_income     ?? 0);
  const monthlyExpenses = Number(row.monthly_expenses   ?? 0);
  const savingsRate     = Number(row.savings_rate_percent ?? 0);
  const netWorth        = totalAssets - totalDebts;

  const currentNW      = snaps[0] ? Number(snaps[0].net_worth) : netWorth;
  const previousNW     = snaps[1] ? Number(snaps[1].net_worth) : 0;
  const balanceDelta   = currentNW - previousNW;
  const balanceDeltaPct = previousNW !== 0
    ? (balanceDelta / Math.abs(previousNW)) * 100
    : 0;

  return {
    totalBalance: netWorth,
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    balanceDelta,
    balanceDeltaPct,
    totalAssets,
    totalDebts,
    investmentValue,
  };
}

// ── Transactions ───────────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  const userId = await uid();

  const [expRes, incRes] = await Promise.all([
    supabase
      .from('expenses')
      .select('id, description, amount, date, created_at, notes, account_id, expense_categories(name, icon, color), asset_accounts(name)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(100),

    supabase
      .from('income_records')
      .select('id, description, amount, date, created_at, notes, account_id, income_sources(name, type, icon), asset_accounts(name)')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(100),
  ]);

  const expenses: Transaction[] = (expRes.data ?? []).map((e: any) => {
    const cat  = e.expense_categories ?? {};
    const name = cat.name ?? 'Other';
    const time = e.created_at ? new Date(e.created_at).toTimeString().slice(0, 5) : '00:00';
    return {
      id:            e.id,
      merchant:      e.description,
      category:      categoryKey(name, false),
      categoryLabel: name,
      categoryIcon:  expenseIcon(name, cat.icon),
      amount:        Number(e.amount),
      type:          'expense',
      date:          e.date,
      time,
      note:          e.notes ?? undefined,
      accountId:     e.account_id ?? undefined,
      accountName:   e.asset_accounts?.name ?? undefined,
    };
  });

  const income: Transaction[] = (incRes.data ?? []).map((r: any) => {
    const src  = r.income_sources ?? {};
    const name = src.name ?? 'Income';
    const time = r.created_at ? new Date(r.created_at).toTimeString().slice(0, 5) : '00:00';
    return {
      id:            r.id,
      merchant:      r.description ?? name,
      category:      categoryKey(name, true),
      categoryLabel: name,
      categoryIcon:  expenseIcon(name, src.icon),
      amount:        Number(r.amount),
      type:          'income',
      date:          r.date,
      time,
      note:          r.notes ?? undefined,
      accountId:     r.account_id ?? undefined,
      accountName:   r.asset_accounts?.name ?? undefined,
    };
  });

  return [...expenses, ...income].sort(
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
  merchant:           string;
  categoryName:       string;
  categoryIcon:       string;
  amount:             number;
  date:               string;
  note?:              string;
  fromAccountId?:     string;
  fromCurrentBalance?: number;
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

  const insertExpense = async () => {
    const { error } = await supabase
      .from('expenses')
      .insert({
        user_id:     userId,
        description: params.merchant,
        amount:      params.amount,
        date:        params.date,
        category_id: categoryId,
        notes:       params.note ?? null,
        account_id:  params.fromAccountId ?? null,
      });
    if (error) throw error;
  };

  const ops: Promise<void>[] = [insertExpense()];

  if (params.fromAccountId && params.fromCurrentBalance !== undefined) {
    const debitAccount = async () => {
      const { error } = await supabase
        .from('asset_accounts')
        .update({ balance: Math.max(0, params.fromCurrentBalance! - params.amount) })
        .eq('id', params.fromAccountId!)
        .eq('user_id', userId);
      if (error) throw error;
    };
    ops.push(debitAccount());
  }

  await Promise.all(ops);
}

export async function addIncome(params: {
  description:      string;
  sourceName:       string;
  sourceType:       string;
  sourceIcon:       string;
  amount:           number;
  date:             string;
  note?:            string;
  toAccountId?:     string;
  toCurrentBalance?: number;
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
  } else {
    const { data: newSrc, error: srcErr } = await supabase
      .from('income_sources')
      .insert({ user_id: userId, name: params.sourceName, type: params.sourceType, icon: params.sourceIcon })
      .select('id')
      .single();
    if (srcErr) throw srcErr;
    sourceId = newSrc.id;
  }

  const insertRecord = async () => {
    const { error } = await supabase
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
    if (error) throw error;
  };

  const ops: Promise<void>[] = [insertRecord()];

  if (params.toAccountId && params.toCurrentBalance !== undefined) {
    const creditAccount = async () => {
      const { error } = await supabase
        .from('asset_accounts')
        .update({ balance: params.toCurrentBalance! + params.amount })
        .eq('id', params.toAccountId!)
        .eq('user_id', userId);
      if (error) throw error;
    };
    ops.push(creditAccount());
  }

  await Promise.all(ops);
}

export async function addTransfer(params: {
  fromAccountId:      string;
  toAccountId:        string;
  fromCurrentBalance: number;
  toCurrentBalance:   number;
  amount:             number;
}): Promise<void> {
  const userId = await uid();
  const [r1, r2] = await Promise.all([
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
  ]);
  if (r1.error) throw r1.error;
  if (r2.error) throw r2.error;
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

  return (catRes.data ?? []).map((c: any) => ({
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

  return (data ?? []).map((g: any) => {
    const contributed = (g.savings_goal_contributions ?? [])
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0);
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
  return (data ?? []).map((c: any) => ({
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

    const refundOps = (accounts ?? []).map((acc: any) => {
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

  return (data ?? []).map((a: any, i: number) => ({
    id:              a.id,
    institutionName: a.name,
    maskedNumber:    '•••• ••••',
    type:            ['checking', 'savings', 'credit'].includes(a.asset_type)
                       ? a.asset_type
                       : 'savings',
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

  return (data ?? []).map((h: any, i: number) => ({
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
  const userId = await uid();
  const { error } = await supabase
    .from('investment_holdings')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', holdingId)
    .eq('user_id', userId);
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

  const accountItems: AssetItem[] = (assetRes.data ?? []).map((a: any) => ({
    id:       a.id,
    name:     a.name,
    category: mapAssetType(a.asset_type ?? ''),
    balance:  Number(a.balance ?? 0),
    icon:     ASSET_ICON[a.asset_type ?? ''] ?? '🏦',
    color:    '#755DEF',
  }));

  const investTotal = (holdingRes.data ?? []).reduce(
    (sum: number, h: any) => sum + Number(h.shares ?? 0) * Number(h.current_price ?? 0),
    0
  );

  const savingsTotal = (goalRes.data ?? []).reduce(
    (sum: number, g: any) => sum + (g.savings_goal_contributions ?? []).reduce(
      (s: number, c: any) => s + Number(c.amount ?? 0), 0
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
  income:  number;
  expense: number;
  savings: number;
}

export interface NWPoint {
  label: string;
  nw:    number;
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

  return (data ?? []).map((r: any) => ({
    label:   monthLabel(r.month),
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
  const result: MonthPoint[] = DAY.map(label => ({ label, income: 0, expense: 0, savings: 0 }));

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

  const { data } = await supabase
    .from('net_worth_snapshots')
    .select('snapshot_date, net_worth')
    .eq('user_id', userId)
    .gte('snapshot_date', cutoffStr)
    .order('snapshot_date', { ascending: true })
    .limit(months);

  return (data ?? []).map((r: any) => ({
    label: monthLabel(r.snapshot_date),
    nw:    Number(r.net_worth ?? 0),
  }));
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
  for (const r of data ?? []) {
    const src  = (r as any).income_sources ?? {};
    const name = src.name ?? 'Other';
    const curr = map.get(name) ?? { label: name, icon: src.icon ?? '💰', amount: 0 };
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

  return (data ?? []).map((d: any) => ({
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
