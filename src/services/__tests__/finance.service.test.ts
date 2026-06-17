import { supabase } from '../../lib/supabase';
import {
  getTransactions,
  getBudgets,
  getSavingsGoals,
  getAccounts,
  addExpense,
  addIncome,
  getInvestments,
  getAssets,
  getMonthlyHistory,
  getNetWorthHistory,
  getIncomeStreams,
  getDebts,
  createDebt,
  deleteDebt,
  updateBudgetLimit,
  createSavingsGoal,
  getContributions,
  addContribution,
  deleteSavingsGoal,
  deleteHolding,
  addHolding,
  getWeeklyHistory,
  updateDebtBalance,
  updateDebt,
  createAsset,
} from '../finance.service';

// Builder factory — chainable + thenable + includes single/maybeSingle
function makeBuilder(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const b: Record<string, unknown> = {
    select:      jest.fn(),
    insert:      jest.fn(),
    update:      jest.fn(),
    eq:          jest.fn(),
    is:          jest.fn(),
    gte:         jest.fn(),
    lte:         jest.fn(),
    lt:          jest.fn(),
    not:         jest.fn(),
    ilike:       jest.fn(),
    order:       jest.fn(),
    limit:       jest.fn(),
    single:      jest.fn().mockResolvedValue(result),
    maybeSingle: jest.fn().mockResolvedValue(result),
    then:        (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
                   Promise.resolve(result).then(resolve, reject),
  };
  (['select','insert','update','eq','is','gte','lte','lt','not','ilike','order','limit'] as const)
    .forEach((m) => (b[m] as jest.Mock).mockReturnValue(b));
  return b;
}

const mockAuth = supabase.auth as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks();
  // uid() calls supabase.auth.getUser() — provide authenticated user by default
  mockAuth.getUser.mockResolvedValue({
    data: { user: { id: 'user-abc' } },
    error: null,
  });
});

// ── getTransactions ────────────────────────────────────────────────────────────

describe('getTransactions', () => {
  it('returns merged, date-sorted transactions from expenses + income + transfers', async () => {
    const expenseRow = {
      id: 'e1', description: 'Grocery', amount: '500', date: '2026-06-10',
      created_at: '2026-06-10T09:00:00Z', notes: null, account_id: null,
      expense_categories: { name: 'Food', icon: '🍔', color: '#FF6' },
      asset_accounts: null,
    };
    const incomeRow = {
      id: 'i1', description: 'Salary', amount: '50000', date: '2026-06-15',
      created_at: '2026-06-15T08:00:00Z', notes: null, account_id: null,
      income_sources: { name: 'Work', type: 'salary', icon: '💼' },
      asset_accounts: null,
    };
    const transferRow = {
      id: 't1', amount: '1000', date: '2026-06-12',
      created_at: '2026-06-12T10:00:00Z', notes: null,
      from_account_id: 'acct-1', to_account_id: 'acct-2',
      from: { name: 'Checking' }, to: { name: 'Savings' },
    };

    // Three sequential from() calls: expenses, income_records, transfers
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [expenseRow],  error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [incomeRow],   error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [transferRow], error: null }));

    const transactions = await getTransactions();

    // Should return 3 transactions sorted descending by date
    expect(transactions).toHaveLength(3);
    expect(transactions[0].date).toBe('2026-06-15'); // income is most recent
    expect(transactions[1].date).toBe('2026-06-12'); // transfer
    expect(transactions[2].date).toBe('2026-06-10'); // expense

    expect(transactions[2].type).toBe('expense');
    expect(transactions[0].type).toBe('income');
    expect(transactions[1].type).toBe('transfer');
    expect(transactions[2].amount).toBe(500);
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getTransactions()).rejects.toThrow('Not authenticated');
  });

  it('returns empty array when all tables return no rows', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [], error: null }));

    const transactions = await getTransactions();

    expect(transactions).toEqual([]);
  });
});

// ── getBudgets ─────────────────────────────────────────────────────────────────

describe('getBudgets', () => {
  it('returns budgets with spent amounts calculated from expenses', async () => {
    const categoryRow = {
      id: 'cat-1', name: 'Food', icon: '🍔', color: '#FF6B6B', budget_limit: '5000',
    };
    const expenseRow = { category_id: 'cat-1', amount: '1500' };

    // Two from() calls: expense_categories, then expenses
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [categoryRow], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [expenseRow],  error: null }));

    const budgets = await getBudgets(2026, 6);

    expect(budgets).toHaveLength(1);
    expect(budgets[0].label).toBe('Food');
    expect(budgets[0].limit).toBe(5000);
    expect(budgets[0].spent).toBe(1500);
    expect(budgets[0].month).toBe(6);
    expect(budgets[0].year).toBe(2026);
  });

  it('returns budget with zero spent when no expenses in month', async () => {
    const categoryRow = {
      id: 'cat-2', name: 'Transport', icon: '🚗', color: '#4A90E2', budget_limit: '3000',
    };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [categoryRow], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [],             error: null }));

    const budgets = await getBudgets();

    expect(budgets[0].spent).toBe(0);
    expect(budgets[0].limit).toBe(3000);
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getBudgets()).rejects.toThrow('Not authenticated');
  });
});

// ── getSavingsGoals ────────────────────────────────────────────────────────────

describe('getSavingsGoals', () => {
  it('returns goals with computed current_amount', async () => {
    const goalRow = {
      id: 'g1', name: 'Emergency Fund', category: 'emergency_fund',
      icon: null, target_amount: '100000', color: null, priority: 1,
      savings_goal_contributions: [{ amount: '25000' }, { amount: '15000' }],
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [goalRow], error: null }),
    );

    const goals = await getSavingsGoals();

    expect(goals).toHaveLength(1);
    expect(goals[0].name).toBe('Emergency Fund');
    expect(goals[0].targetAmount).toBe(100000);
    expect(goals[0].savedAmount).toBe(40000); // 25000 + 15000
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getSavingsGoals()).rejects.toThrow('Not authenticated');
  });
});

// ── getAccounts ────────────────────────────────────────────────────────────────

describe('getAccounts', () => {
  it('returns mapped accounts with correct type', async () => {
    const accountRow = {
      id: 'acct-1', name: 'BDO Checking', asset_type: 'checking', balance: '50000',
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [accountRow], error: null }),
    );

    const accounts = await getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].type).toBe('checking');
    expect(accounts[0].balance).toBe(50000);
    expect(accounts[0].institutionName).toBe('BDO Checking');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getAccounts()).rejects.toThrow('Not authenticated');
  });
});

// ── addExpense ─────────────────────────────────────────────────────────────────

describe('addExpense', () => {
  it('resolves when existing category is found', async () => {
    // Call 1: expense_categories maybeSingle → existing cat
    const catBuilder = makeBuilder({ data: { id: 'cat-123' }, error: null });
    // Call 2: expenses insert → success
    const expBuilder = makeBuilder({ data: null, error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(catBuilder)
      .mockReturnValueOnce(expBuilder);

    await expect(addExpense({
      merchant:    'Test',
      categoryName:'Food',
      categoryIcon:'🍔',
      amount:      500,
      date:        '2026-06-01',
    })).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('expense_categories');
    expect(supabase.from).toHaveBeenCalledWith('expenses');
  });

  it('creates new category when not found then inserts expense', async () => {
    // Call 1: expense_categories maybeSingle → null (no existing)
    const catLookup = makeBuilder({ data: null, error: null });
    // Call 2: expense_categories insert → new cat
    const catInsert = makeBuilder({ data: { id: 'new-cat' }, error: null });
    // Call 3: expenses insert → success
    const expInsert = makeBuilder({ data: null, error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(catLookup)
      .mockReturnValueOnce(catInsert)
      .mockReturnValueOnce(expInsert);

    await expect(addExpense({
      merchant:    'New Shop',
      categoryName:'NewCat',
      categoryIcon:'🆕',
      amount:      250,
      date:        '2026-06-02',
    })).resolves.toBeUndefined();
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(addExpense({
      merchant: 'x', categoryName: 'y', categoryIcon: 'z', amount: 1, date: '2026-06-01',
    })).rejects.toThrow('Not authenticated');
  });
});

// ── addIncome ──────────────────────────────────────────────────────────────────

describe('addIncome', () => {
  it('resolves when existing income source is found', async () => {
    const srcBuilder = makeBuilder({ data: { id: 'src-1' }, error: null });
    const recBuilder = makeBuilder({ data: null, error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(srcBuilder)
      .mockReturnValueOnce(recBuilder);

    await expect(addIncome({
      description: 'Salary',
      sourceName:  'Work',
      sourceType:  'salary',
      sourceIcon:  '💼',
      amount:      50000,
      date:        '2026-06-15',
    })).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('income_sources');
    expect(supabase.from).toHaveBeenCalledWith('income_records');
  });

  it('creates new source when not found then inserts income record', async () => {
    const srcLookup = makeBuilder({ data: null, error: null });
    const srcInsert = makeBuilder({ data: { id: 'new-src' }, error: null });
    const recInsert = makeBuilder({ data: null, error: null });

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(srcLookup)
      .mockReturnValueOnce(srcInsert)
      .mockReturnValueOnce(recInsert);

    await expect(addIncome({
      description: 'Freelance project',
      sourceName:  'Client A',
      sourceType:  'freelance',
      sourceIcon:  '💻',
      amount:      15000,
      date:        '2026-06-10',
    })).resolves.toBeUndefined();
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(addIncome({
      description: 'x', sourceName: 'y', sourceType: 'salary', sourceIcon: '💼',
      amount: 1, date: '2026-06-01',
    })).rejects.toThrow('Not authenticated');
  });
});

// ── getInvestments ─────────────────────────────────────────────────────────────

describe('getInvestments', () => {
  it('returns mapped investment holdings', async () => {
    const holdingRow = {
      id: 'h1', account_id: 'acct-1', symbol: 'AAPL', name: 'Apple Inc.',
      asset_class: 'stocks', shares: '10', purchase_price: '150', current_price: '180',
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [holdingRow], error: null }),
    );

    const holdings = await getInvestments();

    expect(holdings).toHaveLength(1);
    expect(holdings[0].symbol).toBe('AAPL');
    expect(holdings[0].shares).toBe(10);
    expect(holdings[0].currentPrice).toBe(180);
    expect(holdings[0].avgCostPerShare).toBe(150);
    expect(supabase.from).toHaveBeenCalledWith('investment_holdings');
  });

  it('returns empty array when no holdings', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [], error: null }),
    );

    const holdings = await getInvestments();

    expect(holdings).toEqual([]);
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getInvestments()).rejects.toThrow('Not authenticated');
  });
});

// ── getAssets ──────────────────────────────────────────────────────────────────

describe('getAssets', () => {
  it('returns account items plus investment and savings aggregates', async () => {
    const accountRow = { id: 'a1', name: 'BDO', asset_type: 'checking', balance: '50000' };
    const holdingRow = { id: 'h1', shares: '10', current_price: '100' }; // 1000 investment
    const goalRow    = { savings_goal_contributions: [{ amount: '5000' }] };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [accountRow], error: null }))  // asset_accounts
      .mockReturnValueOnce(makeBuilder({ data: [holdingRow], error: null }))  // investment_holdings
      .mockReturnValueOnce(makeBuilder({ data: [goalRow],    error: null })); // savings_goals

    const assets = await getAssets();

    // Account item + investment portfolio item + savings goals item
    expect(assets).toHaveLength(3);
    expect(assets[0].name).toBe('BDO');
    expect(assets[0].balance).toBe(50000);
    expect(assets[1].id).toBe('investment_portfolio');
    expect(assets[1].balance).toBe(1000);
    expect(assets[2].id).toBe('savings_goals_total');
    expect(assets[2].balance).toBe(5000);
  });

  it('omits investment/savings aggregates when totals are zero', async () => {
    const accountRow = { id: 'a1', name: 'Cash', asset_type: 'cash', balance: '10000' };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [accountRow], error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [],           error: null }))
      .mockReturnValueOnce(makeBuilder({ data: [],           error: null }));

    const assets = await getAssets();

    expect(assets).toHaveLength(1);
    expect(assets[0].category).toBe('cash');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getAssets()).rejects.toThrow('Not authenticated');
  });
});

// ── getMonthlyHistory ──────────────────────────────────────────────────────────

describe('getMonthlyHistory', () => {
  it('returns mapped MonthPoints from monthly_cash_flow', async () => {
    const row = { month: '2026-06-01', total_income: '50000', total_expenses: '30000', net_cash_flow: '20000' };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [row], error: null }),
    );

    const history = await getMonthlyHistory(6);

    expect(history).toHaveLength(1);
    expect(history[0].income).toBe(50000);
    expect(history[0].expense).toBe(30000);
    expect(history[0].savings).toBe(20000);
    expect(history[0].label).toBe('Jun');
    expect(supabase.from).toHaveBeenCalledWith('monthly_cash_flow');
  });

  it('returns empty array when no data', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: null, error: null }),
    );

    const history = await getMonthlyHistory();

    expect(history).toEqual([]);
  });
});

// ── getNetWorthHistory (finance.service) ──────────────────────────────────────

describe('getNetWorthHistory (finance.service)', () => {
  it('returns mapped NWPoints from net_worth_snapshots', async () => {
    const row = { snapshot_date: '2026-06-01', net_worth: '250000' };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [row], error: null }),
    );

    const history = await getNetWorthHistory(12);

    expect(history).toHaveLength(1);
    expect(history[0].nw).toBe(250000);
    expect(history[0].label).toBe('Jun');
    expect(supabase.from).toHaveBeenCalledWith('net_worth_snapshots');
  });

  it('returns empty array when no snapshots', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: null, error: null }),
    );

    const history = await getNetWorthHistory();

    expect(history).toEqual([]);
  });
});

// ── getIncomeStreams ───────────────────────────────────────────────────────────

describe('getIncomeStreams', () => {
  it('returns income streams grouped and sorted by amount', async () => {
    const rows = [
      { amount: '30000', income_sources: { name: 'Work',      icon: '💼' } },
      { amount: '10000', income_sources: { name: 'Freelance', icon: '💻' } },
      { amount: '20000', income_sources: { name: 'Work',      icon: '💼' } }, // same source
    ];

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: rows, error: null }),
    );

    const streams = await getIncomeStreams();

    // Work: 50000, Freelance: 10000 — sorted descending
    expect(streams).toHaveLength(2);
    expect(streams[0].label).toBe('Work');
    expect(streams[0].amount).toBe(50000);
    expect(streams[0].pct).toBe(83.3); // 50000/60000
    expect(streams[1].label).toBe('Freelance');
    expect(supabase.from).toHaveBeenCalledWith('income_records');
  });

  it('returns empty array when no income records', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [], error: null }),
    );

    const streams = await getIncomeStreams();

    expect(streams).toEqual([]);
  });
});

// ── getDebts ───────────────────────────────────────────────────────────────────

describe('getDebts', () => {
  it('returns mapped debt items', async () => {
    const row = {
      id: 'd1', name: 'Credit Card', debt_type: 'credit_card',
      balance: '15000', original_amount: '20000',
      annual_rate: '24', monthly_payment: '2000',
    };

    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [row], error: null }),
    );

    const debts = await getDebts();

    expect(debts).toHaveLength(1);
    expect(debts[0].category).toBe('credit_card');
    expect(debts[0].balance).toBe(15000);
    expect(debts[0].interestRate).toBe(24);
    expect(supabase.from).toHaveBeenCalledWith('debt_accounts');
  });

  it('returns empty array when no debts', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: null, error: null }),
    );

    const debts = await getDebts();

    expect(debts).toEqual([]);
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getDebts()).rejects.toThrow('Not authenticated');
  });
});

// ── createDebt ─────────────────────────────────────────────────────────────────

describe('createDebt', () => {
  it('resolves when debt is inserted successfully', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: null, error: null }),
    );

    await expect(createDebt({
      name:           'Car Loan',
      debtType:       'auto_loan',
      balance:        500000,
      originalAmount: 600000,
      interestRate:   12,
      monthlyPayment: 12000,
    })).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('debt_accounts');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(createDebt({
      name: 'x', debtType: 'personal_loan',
      balance: 1, originalAmount: 1, interestRate: 1, monthlyPayment: 1,
    })).rejects.toThrow('Not authenticated');
  });
});

// ── deleteDebt ─────────────────────────────────────────────────────────────────

describe('deleteDebt', () => {
  it('soft-deletes a debt by setting deleted_at', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    await expect(deleteDebt('d1')).resolves.toBeUndefined();

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(deleteDebt('d1')).rejects.toThrow('Not authenticated');
  });
});

// ── updateBudgetLimit ──────────────────────────────────────────────────────────

describe('updateBudgetLimit', () => {
  it('updates existing category when found via maybeSingle', async () => {
    const lookupBuilder = makeBuilder({ data: { id: 'cat-1' }, error: null });
    const updateBuilder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(updateBuilder);

    await expect(
      updateBudgetLimit('Food', '🍔', 5000, '#FF6B6B'),
    ).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('expense_categories');
  });

  it('inserts new category when not found', async () => {
    const lookupBuilder = makeBuilder({ data: null, error: null });
    const insertBuilder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(lookupBuilder)
      .mockReturnValueOnce(insertBuilder);

    await expect(
      updateBudgetLimit('New Cat', '🆕', 3000),
    ).resolves.toBeUndefined();
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(updateBudgetLimit('Food', '🍔', 5000)).rejects.toThrow('Not authenticated');
  });
});

// ── createSavingsGoal ──────────────────────────────────────────────────────────

describe('createSavingsGoal', () => {
  it('returns new savings goal on success', async () => {
    const goalData = { id: 'g-new', name: 'Emergency Fund', icon: '🆘', target_amount: '100000', color: '#22C55E', priority: 5 };
    const builder  = makeBuilder({ data: goalData, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const goal = await createSavingsGoal({
      name: 'Emergency Fund', emoji: '🆘', targetAmount: 100000, color: '#22C55E',
    });

    expect(goal.name).toBe('Emergency Fund');
    expect(goal.targetAmount).toBe(100000);
    expect(goal.savedAmount).toBe(0);
    expect(supabase.from).toHaveBeenCalledWith('savings_goals');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(createSavingsGoal({ name: 'x', emoji: '🎯', targetAmount: 1, color: '#000' }))
      .rejects.toThrow('Not authenticated');
  });
});

// ── getContributions ───────────────────────────────────────────────────────────

describe('getContributions', () => {
  it('returns mapped contributions', async () => {
    const row = { id: 'c1', amount: '5000', date: '2026-06-01', description: 'Initial' };
    (supabase.from as jest.Mock).mockReturnValueOnce(
      makeBuilder({ data: [row], error: null }),
    );

    const contribs = await getContributions('g1');

    expect(contribs).toHaveLength(1);
    expect(contribs[0].amount).toBe(5000);
    expect(contribs[0].note).toBe('Initial');
    expect(supabase.from).toHaveBeenCalledWith('savings_goal_contributions');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(getContributions('g1')).rejects.toThrow('Not authenticated');
  });
});

// ── addContribution ────────────────────────────────────────────────────────────

describe('addContribution', () => {
  it('inserts a contribution without account debit', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    await expect(addContribution('g1', 5000, 'Monthly save')).resolves.toBeUndefined();

    expect(supabase.from).toHaveBeenCalledWith('savings_goal_contributions');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(addContribution('g1', 1000, 'Test')).rejects.toThrow('Not authenticated');
  });
});

// ── deleteSavingsGoal ──────────────────────────────────────────────────────────

describe('deleteSavingsGoal', () => {
  it('soft-deletes goal when no account-funded contributions', async () => {
    // Call 1: fetch contributions (returns empty → no refunds)
    const contribsBuilder = makeBuilder({ data: [], error: null });
    // Call 2: soft-delete the goal
    const deleteBuilder   = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(contribsBuilder)
      .mockReturnValueOnce(deleteBuilder);

    await expect(deleteSavingsGoal('g1')).resolves.toBeUndefined();

    expect(deleteBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(deleteSavingsGoal('g1')).rejects.toThrow('Not authenticated');
  });
});

// ── deleteHolding ──────────────────────────────────────────────────────────────

describe('deleteHolding', () => {
  it('soft-deletes a holding', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    await expect(deleteHolding('h1')).resolves.toBeUndefined();

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(deleteHolding('h1')).rejects.toThrow('Not authenticated');
  });
});

// ── addHolding ─────────────────────────────────────────────────────────────────

describe('addHolding', () => {
  it('creates holding using existing investment account', async () => {
    // getOrCreateDefaultAccount: maybeSingle returns existing
    const acctBuilder    = makeBuilder({ data: { id: 'acct-1' }, error: null });
    const holdingData    = { id: 'h-new', account_id: 'acct-1', symbol: 'AAPL', name: 'Apple', asset_class: 'stocks', shares: '10', purchase_price: '150', current_price: '180' };
    const insertBuilder  = makeBuilder({ data: holdingData, error: null });
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(acctBuilder)    // investment_accounts lookup
      .mockReturnValueOnce(insertBuilder); // investment_holdings insert

    const holding = await addHolding({
      symbol: 'AAPL', name: 'Apple', assetType: 'stock', shares: 10, avgCostPerShare: 150, currentPrice: 180,
    });

    expect(holding.symbol).toBe('AAPL');
    expect(holding.shares).toBe(10);
    expect(holding.currentPrice).toBe(180);
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(addHolding({ symbol: 'X', name: 'X', assetType: 'stock', shares: 1, avgCostPerShare: 1, currentPrice: 1 }))
      .rejects.toThrow('Not authenticated');
  });
});

// ── createAsset ────────────────────────────────────────────────────────────────

describe('createAsset', () => {
  it('inserts and returns asset item', async () => {
    const assetData = { id: 'a-new', name: 'House', asset_type: 'property', balance: '5000000' };
    const builder   = makeBuilder({ data: assetData, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const asset = await createAsset({ name: 'House', category: 'real_estate', balance: 5000000 });

    expect(asset.name).toBe('House');
    expect(asset.balance).toBe(5000000);
    expect(asset.category).toBe('real_estate');
    expect(supabase.from).toHaveBeenCalledWith('asset_accounts');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(createAsset({ name: 'x', category: 'cash', balance: 0 })).rejects.toThrow('Not authenticated');
  });
});

// ── getWeeklyHistory ───────────────────────────────────────────────────────────

describe('getWeeklyHistory', () => {
  it('returns 7 days with income/expense/savings totals', async () => {
    const expRow = { date: '2026-06-16', amount: '500' };
    const incRow = { date: '2026-06-16', amount: '1000' };

    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: [expRow], error: null })) // expenses
      .mockReturnValueOnce(makeBuilder({ data: [incRow], error: null })); // income_records

    const history = await getWeeklyHistory();

    expect(history).toHaveLength(7);
    // Labels should be Mon–Sun
    expect(history.map((h) => h.label)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('returns zeros for all days when no data', async () => {
    (supabase.from as jest.Mock)
      .mockReturnValueOnce(makeBuilder({ data: null, error: null }))
      .mockReturnValueOnce(makeBuilder({ data: null, error: null }));

    const history = await getWeeklyHistory();

    expect(history).toHaveLength(7);
    expect(history.every((d) => d.income === 0 && d.expense === 0)).toBe(true);
  });
});

// ── updateDebtBalance ──────────────────────────────────────────────────────────

describe('updateDebtBalance', () => {
  it('updates balance for a debt account', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    await expect(updateDebtBalance('d1', 10000)).resolves.toBeUndefined();

    expect(builder.update).toHaveBeenCalledWith({ balance: 10000 });
    expect(supabase.from).toHaveBeenCalledWith('debt_accounts');
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(updateDebtBalance('d1', 10000)).rejects.toThrow('Not authenticated');
  });
});

// ── updateDebt ─────────────────────────────────────────────────────────────────

describe('updateDebt', () => {
  it('updates debt name and balance', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    await expect(updateDebt('d1', { name: 'Updated Loan', balance: 50000 })).resolves.toBeUndefined();

    expect(builder.update).toHaveBeenCalledWith({ name: 'Updated Loan', balance: 50000 });
  });

  it('throws when not authenticated', async () => {
    mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

    await expect(updateDebt('d1', { name: 'x', balance: 0 })).rejects.toThrow('Not authenticated');
  });
});
