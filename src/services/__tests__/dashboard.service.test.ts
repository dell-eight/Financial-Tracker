import { supabase } from '../../lib/supabase';
import {
  getDashboardSummary,
  getFinancialHealthMetrics,
  getNetWorthHistory,
  getAnnualSummary,
  getSpendingVsIncome,
  getExpenseAnalytics,
  getBudgetPerformance,
  getIncomeAnalysis,
  calculateNetWorth,
  refreshMaterializedViews,
} from '../dashboard.service';

function makeBuilder(result: { data: unknown; error: unknown } = { data: null, error: null }) {
  const b: Record<string, unknown> = {
    select: jest.fn(),
    eq:     jest.fn(),
    order:  jest.fn(),
    limit:  jest.fn(),
    single: jest.fn().mockResolvedValue(result),
    then:   (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject),
  };
  (['select','eq','order','limit'] as const)
    .forEach((m) => (b[m] as jest.Mock).mockReturnValue(b));
  return b;
}

const UID = 'user-abc';

const mockSummary = {
  net_worth:              250000,
  monthly_income:         50000,
  monthly_expenses:       30000,
  savings_rate_percent:   40,
  total_assets:           300000,
  total_debts:            50000,
  investment_value:       80000,
  emergency_fund_months:  6,
};

const mockHealthMetrics = {
  user_id:               UID,
  savings_rate:          40,
  debt_to_income_ratio:  0.2,
  emergency_fund_months: 6,
  net_worth:             250000,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ── getDashboardSummary ────────────────────────────────────────────────────────

describe('getDashboardSummary', () => {
  it('returns summary from RPC on success', async () => {
    const rpcBuilder = makeBuilder({ data: mockSummary, error: null });
    (supabase.rpc as jest.Mock).mockReturnValueOnce(rpcBuilder);

    const result = await getDashboardSummary(UID);

    expect(result.error).toBeNull();
    expect(result.summary?.net_worth).toBe(250000);
    expect(supabase.rpc).toHaveBeenCalledWith('get_dashboard_summary', { p_user_id: UID });
  });

  it('returns null and error when RPC fails', async () => {
    const rpcBuilder = makeBuilder({ data: null, error: { message: 'RPC error' } });
    (supabase.rpc as jest.Mock).mockReturnValueOnce(rpcBuilder);

    const result = await getDashboardSummary(UID);

    expect(result.summary).toBeNull();
    expect(result.error).toBe('RPC error');
  });
});

// ── getFinancialHealthMetrics ──────────────────────────────────────────────────

describe('getFinancialHealthMetrics', () => {
  it('returns metrics on success', async () => {
    const builder = makeBuilder({ data: mockHealthMetrics, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getFinancialHealthMetrics(UID);

    expect(result.error).toBeNull();
    expect(result.metrics?.savings_rate).toBe(40);
    expect(supabase.from).toHaveBeenCalledWith('financial_health_metrics');
  });

  it('returns null and error when query fails', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'View not found' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getFinancialHealthMetrics(UID);

    expect(result.metrics).toBeNull();
    expect(result.error).toBe('View not found');
  });
});

// ── getNetWorthHistory ─────────────────────────────────────────────────────────

describe('getNetWorthHistory', () => {
  const mockHistory = [
    { user_id: UID, snapshot_date: '2026-05-01', net_worth: 240000 },
    { user_id: UID, snapshot_date: '2026-06-01', net_worth: 250000 },
  ];

  it('returns history in ascending order on success', async () => {
    const builder = makeBuilder({ data: [...mockHistory].reverse(), error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getNetWorthHistory(UID, 12);

    expect(result.error).toBeNull();
    // Service queries descending then .reverse() → ascending by date
    expect(result.history).toHaveLength(2);
    expect(result.history[0].snapshot_date).toBe('2026-05-01');
    expect(supabase.from).toHaveBeenCalledWith('mv_net_worth_history');
  });

  it('returns empty array and error on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'History error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getNetWorthHistory(UID);

    expect(result.history).toEqual([]);
    expect(result.error).toBe('History error');
  });
});

// ── getAnnualSummary ───────────────────────────────────────────────────────────

describe('getAnnualSummary', () => {
  const mockAnnual = [
    { user_id: UID, year: 2026, total_income: 600000, total_expenses: 360000 },
  ];

  it('returns annual summaries on success', async () => {
    const builder = makeBuilder({ data: mockAnnual, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getAnnualSummary(UID);

    expect(result.error).toBeNull();
    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0].year).toBe(2026);
    expect(supabase.from).toHaveBeenCalledWith('mv_annual_summary');
  });

  it('returns empty array and error on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Annual error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getAnnualSummary(UID);

    expect(result.summaries).toEqual([]);
    expect(result.error).toBe('Annual error');
  });
});

// ── getSpendingVsIncome ────────────────────────────────────────────────────────

describe('getSpendingVsIncome', () => {
  const mockCashFlow = [
    { user_id: UID, month: '2026-06', total_income: 50000, total_expenses: 30000, net_cash_flow: 20000 },
  ];

  it('returns cash flow data on success', async () => {
    const builder = makeBuilder({ data: mockCashFlow, error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getSpendingVsIncome(UID);

    expect(result.error).toBeNull();
    expect(result.cashFlow).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('monthly_cash_flow');
  });

  it('returns empty array on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Cash flow error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getSpendingVsIncome(UID);

    expect(result.cashFlow).toEqual([]);
    expect(result.error).toBe('Cash flow error');
  });
});

// ── getExpenseAnalytics ────────────────────────────────────────────────────────

describe('getExpenseAnalytics', () => {
  it('returns expense analytics on success', async () => {
    const row = { user_id: UID, month: '2026-06', category: 'Food', amount: 5000 };
    const builder = makeBuilder({ data: [row], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenseAnalytics(UID);

    expect(result.error).toBeNull();
    expect(result.analytics).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('mv_expense_analytics');
  });

  it('returns empty analytics on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Analytics error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getExpenseAnalytics(UID);

    expect(result.analytics).toEqual([]);
    expect(result.error).toBe('Analytics error');
  });
});

// ── getBudgetPerformance ───────────────────────────────────────────────────────

describe('getBudgetPerformance', () => {
  it('returns budget performance data on success', async () => {
    const row = { user_id: UID, month: '2026-06', category: 'Food', budget: 5000, spent: 3000 };
    const builder = makeBuilder({ data: [row], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getBudgetPerformance(UID);

    expect(result.error).toBeNull();
    expect(result.performance).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('mv_budget_performance');
  });

  it('returns empty performance on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Performance error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getBudgetPerformance(UID);

    expect(result.performance).toEqual([]);
    expect(result.error).toBe('Performance error');
  });
});

// ── getIncomeAnalysis ──────────────────────────────────────────────────────────

describe('getIncomeAnalysis', () => {
  it('returns income analysis on success', async () => {
    const row = { user_id: UID, month: '2026-06', source: 'Work', amount: 50000 };
    const builder = makeBuilder({ data: [row], error: null });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getIncomeAnalysis(UID);

    expect(result.error).toBeNull();
    expect(result.analysis).toHaveLength(1);
    expect(supabase.from).toHaveBeenCalledWith('mv_income_analysis');
  });

  it('returns empty analysis on failure', async () => {
    const builder = makeBuilder({ data: null, error: { message: 'Analysis error' } });
    (supabase.from as jest.Mock).mockReturnValueOnce(builder);

    const result = await getIncomeAnalysis(UID);

    expect(result.analysis).toEqual([]);
    expect(result.error).toBe('Analysis error');
  });
});

// ── calculateNetWorth ──────────────────────────────────────────────────────────

describe('calculateNetWorth', () => {
  it('returns computed net worth from RPC on success', async () => {
    const rpcBuilder = makeBuilder({ data: 250000, error: null });
    (supabase.rpc as jest.Mock).mockReturnValueOnce(rpcBuilder);

    const result = await calculateNetWorth(UID, '2026-06-17');

    expect(result.error).toBeNull();
    expect(result.netWorth).toBe(250000);
    expect(supabase.rpc).toHaveBeenCalledWith('calculate_user_net_worth', {
      p_user_id: UID,
      p_date:    '2026-06-17',
    });
  });

  it('returns 0 and error when RPC fails', async () => {
    const rpcBuilder = makeBuilder({ data: null, error: { message: 'RPC error' } });
    (supabase.rpc as jest.Mock).mockReturnValueOnce(rpcBuilder);

    const result = await calculateNetWorth(UID);

    expect(result.netWorth).toBe(0);
    expect(result.error).toBe('RPC error');
  });
});

// ── refreshMaterializedViews ───────────────────────────────────────────────────

describe('refreshMaterializedViews', () => {
  it('returns success: true when refresh completes', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

    const result = await refreshMaterializedViews();

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('refresh_materialized_views');
  });

  it('returns success: false and error when refresh fails', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: { message: 'Refresh failed' } });

    const result = await refreshMaterializedViews();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Refresh failed');
  });
});
