import { supabase } from '../../lib/supabase';
import {
  getExpenseCategories,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenses,
  getExpense,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  getMonthlyExpenseSummary,
  getExpenseBreakdown,
  getExpenseTrends,
  searchExpenses,
} from '../expenses.service';

// Builder factory — creates a chainable, thenable Supabase query mock
function makeBuilder(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const b: Record<string, unknown> = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    eq:     jest.fn(),
    is:     jest.fn(),
    gte:    jest.fn(),
    lte:    jest.fn(),
    order:  jest.fn(),
    limit:  jest.fn(),
    or:     jest.fn(),
    single: jest.fn().mockResolvedValue(result),
    then:   (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject),
  };
  (['select','insert','update','eq','is','gte','lte','order','limit','or'] as const)
    .forEach((m) => (b[m] as jest.Mock).mockReturnValue(b));
  return b;
}

const UID = 'user-abc';

const mockCategory = {
  id:            'cat-1',
  user_id:       UID,
  name:          'Food',
  icon:          '🍔',
  color:         '#FF6B6B',
  budget_limit:  5000,
  display_order: 1,
};

const mockExpense = {
  id:          'exp-1',
  user_id:     UID,
  category_id: 'cat-1',
  description: 'Groceries',
  amount:      500,
  date:        '2026-06-01',
  notes:       null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getExpenseCategories ───────────────────────────────────────────────────────

describe('getExpenseCategories', () => {
  it('returns categories on success', async () => {
    const builder = makeBuilder({ data: [mockCategory], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenseCategories(UID);

    expect(result.error).toBeNull();
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('Food');
    expect(supabase.from).toHaveBeenCalledWith('expense_categories');
  });

  it('returns empty array and error string on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'DB error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenseCategories(UID);

    expect(result.categories).toEqual([]);
    expect(result.error).toBe('DB error');
  });
});

// ── getExpenses ────────────────────────────────────────────────────────────────

describe('getExpenses', () => {
  it('returns expenses list on success', async () => {
    const builder = makeBuilder({ data: [mockExpense], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenses(UID);

    expect(result.error).toBeNull();
    expect(result.expenses).toHaveLength(1);
    expect(result.expenses[0].description).toBe('Groceries');
  });

  it('returns empty array and error string on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Query failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenses(UID);

    expect(result.expenses).toEqual([]);
    expect(result.error).toBe('Query failed');
  });
});

// ── getExpense (single) ────────────────────────────────────────────────────────

describe('getExpense', () => {
  it('returns expense by id', async () => {
    const builder = makeBuilder({ data: mockExpense, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpense('exp-1');

    expect(result.error).toBeNull();
    expect(result.expense?.id).toBe('exp-1');
  });

  it('returns null expense and error on not found', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Not found' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpense('missing');

    expect(result.expense).toBeNull();
    expect(result.error).toBe('Not found');
  });
});

// ── createExpense ──────────────────────────────────────────────────────────────

describe('createExpense', () => {
  it('inserts and returns the new expense', async () => {
    const builder = makeBuilder({ data: mockExpense, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await createExpense(UID, {
      category_id: 'cat-1',
      description: 'Groceries',
      amount:      500,
      date:        '2026-06-01',
    });

    expect(result.error).toBeNull();
    expect(result.expense?.amount).toBe(500);
    expect(supabase.from).toHaveBeenCalledWith('expenses');
  });

  it('returns null and error on insert failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Insert failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await createExpense(UID, {
      category_id: 'cat-1',
      description: 'Groceries',
      amount:      500,
      date:        '2026-06-01',
    });

    expect(result.expense).toBeNull();
    expect(result.error).toBe('Insert failed');
  });
});

// ── updateExpense ──────────────────────────────────────────────────────────────

describe('updateExpense', () => {
  it('updates and returns the modified expense', async () => {
    const updated = { ...mockExpense, amount: 750 };
    const builder = makeBuilder({ data: updated, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateExpense('exp-1', { amount: 750 });

    expect(result.error).toBeNull();
    expect(result.expense?.amount).toBe(750);
  });

  it('returns null and error on update failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Update failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateExpense('exp-1', { amount: 750 });

    expect(result.expense).toBeNull();
    expect(result.error).toBe('Update failed');
  });
});

// ── deleteExpense (soft delete) ────────────────────────────────────────────────

describe('deleteExpense', () => {
  it('sets deleted_at (soft delete) and returns no error', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await deleteExpense('exp-1');

    expect(result.error).toBeNull();
    // Verify it used update (soft delete), not hard delete
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });

  it('returns error string on soft-delete failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Delete failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await deleteExpense('exp-1');

    expect(result.error).toBe('Delete failed');
  });
});

// ── createExpenseCategory ──────────────────────────────────────────────────────

describe('createExpenseCategory', () => {
  it('inserts and returns the new category', async () => {
    const builder = makeBuilder({ data: mockCategory, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await createExpenseCategory(UID, {
      name: 'Food', icon: '🍔', color: '#FF6B6B', budget_limit: 5000, display_order: 1,
    });

    expect(result.error).toBeNull();
    expect(result.category?.name).toBe('Food');
    expect(supabase.from).toHaveBeenCalledWith('expense_categories');
  });

  it('returns null and error on insert failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Insert failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await createExpenseCategory(UID, {
      name: 'Food', icon: '🍔', color: '#FF6B6B', budget_limit: 5000, display_order: 1,
    });

    expect(result.category).toBeNull();
    expect(result.error).toBe('Insert failed');
  });
});

// ── updateExpenseCategory ──────────────────────────────────────────────────────

describe('updateExpenseCategory', () => {
  it('updates and returns the modified category', async () => {
    const updated = { ...mockCategory, name: 'Groceries' };
    const builder = makeBuilder({ data: updated, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateExpenseCategory('cat-1', { name: 'Groceries' });

    expect(result.error).toBeNull();
    expect(result.category?.name).toBe('Groceries');
  });

  it('returns null and error on update failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Update failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await updateExpenseCategory('cat-1', { name: 'X' });

    expect(result.category).toBeNull();
    expect(result.error).toBe('Update failed');
  });
});

// ── deleteExpenseCategory (soft delete) ───────────────────────────────────────

describe('deleteExpenseCategory', () => {
  it('sets deleted_at and returns no error', async () => {
    const builder = makeBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await deleteExpenseCategory('cat-1');

    expect(result.error).toBeNull();
    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) }),
    );
  });

  it('returns error string on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Delete failed' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await deleteExpenseCategory('cat-1');

    expect(result.error).toBe('Delete failed');
  });
});

// ── getExpenses with filters ───────────────────────────────────────────────────

describe('getExpenses with filters', () => {
  it('applies all optional filters when provided', async () => {
    const builder = makeBuilder({ data: [mockExpense], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenses(UID, {
      categoryId: 'cat-1',
      startDate:  '2026-06-01',
      endDate:    '2026-06-30',
      limit:      10,
      offset:     0,
    });

    expect(result.error).toBeNull();
    expect(result.expenses).toHaveLength(1);
    // Verify filter methods were chained
    expect(builder.eq).toHaveBeenCalledWith('category_id', 'cat-1');
    expect(builder.gte).toHaveBeenCalledWith('date', '2026-06-01');
    expect(builder.lte).toHaveBeenCalledWith('date', '2026-06-30');
    expect(builder.limit).toHaveBeenCalledWith(10);
  });
});

// ── getMonthlyExpenseSummary ───────────────────────────────────────────────────

describe('getMonthlyExpenseSummary', () => {
  it('returns monthly summaries on success', async () => {
    const row = { user_id: UID, month: '2026-06', total: 30000, categories: 5 };
    const builder = makeBuilder({ data: [row], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getMonthlyExpenseSummary(UID);

    expect(result.error).toBeNull();
    expect(result.summary).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('monthly_expense_summary');
  });

  it('returns empty array on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Summary error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getMonthlyExpenseSummary(UID);

    expect(result.summary).toEqual([]);
    expect(result.error).toBe('Summary error');
  });
});

// ── getExpenseBreakdown ────────────────────────────────────────────────────────

describe('getExpenseBreakdown', () => {
  it('returns breakdown data from RPC on success', async () => {
    const row = { category: 'Food', total: 30000, pct: 40 };
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: [row], error: null });

    const result = await getExpenseBreakdown(UID, 6);

    expect(result.error).toBeNull();
    expect(result.breakdown).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledWith('get_expense_breakdown_by_category', {
      p_user_id: UID, p_months_back: 6,
    });
  });

  it('returns empty breakdown on failure', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'RPC error' } });

    const result = await getExpenseBreakdown(UID);

    expect(result.breakdown).toEqual([]);
    expect(result.error).toBe('RPC error');
  });
});

// ── getExpenseTrends ───────────────────────────────────────────────────────────

describe('getExpenseTrends', () => {
  it('returns trend data from RPC on success', async () => {
    const row = { month: '2026-06', category: 'Food', amount: 5000 };
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: [row], error: null });

    const result = await getExpenseTrends(UID, 'cat-1', 6);

    expect(result.error).toBeNull();
    expect(result.trends).toHaveLength(1);
    expect(supabase.rpc).toHaveBeenCalledWith('get_expense_trends', {
      p_user_id: UID, p_category_id: 'cat-1', p_months_back: 6,
    });
  });

  it('returns empty trends on failure', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'Trends error' } });

    const result = await getExpenseTrends(UID);

    expect(result.trends).toEqual([]);
    expect(result.error).toBe('Trends error');
  });
});

// ── searchExpenses ─────────────────────────────────────────────────────────────

describe('searchExpenses', () => {
  it('returns matching expenses on success', async () => {
    const builder = makeBuilder({ data: [mockExpense], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await searchExpenses(UID, 'Groceries');

    expect(result.error).toBeNull();
    expect(result.expenses).toHaveLength(1);
    expect(builder.or).toHaveBeenCalledWith(
      expect.stringContaining('Groceries'),
    );
  });

  it('returns empty array on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Search error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await searchExpenses(UID, 'x');

    expect(result.expenses).toEqual([]);
    expect(result.error).toBe('Search error');
  });
});
