import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBudgets, BUDGETS_KEY } from '../useBudgets';
import { getBudgets } from '../../../services/finance.service';
import type { Budget } from '../../../types/models';

jest.mock('../../../services/finance.service', () => ({
  getBudgets: jest.fn(),
}));

const mockGetBudgets = getBudgets as jest.MockedFunction<typeof getBudgets>;

const mockBudget: Budget = {
  id:       'b1',
  category: 'food',
  label:    'Food',
  icon:     '🍔',
  color:    '#FF6B6B',
  limit:    5000,
  spent:    2500,
  month:    6,
  year:     2026,
};

// Create a fresh QueryClient per test — avoids cache leaking between tests
// and prevents creating a new client on every wrapper re-render (which loses cache mid-flight)
let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  jest.clearAllMocks();
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useBudgets', () => {
  it('BUDGETS_KEY is ["budgets"]', () => {
    expect(BUDGETS_KEY).toEqual(['budgets']);
  });

  it('returns data after query resolves', async () => {
    mockGetBudgets.mockResolvedValue([mockBudget]);
    const { result } = await renderHook(() => useBudgets(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockBudget]);
  });

  it('appends year and month to query key when provided', async () => {
    mockGetBudgets.mockResolvedValue([]);
    await renderHook(() => useBudgets(2026, 6), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalledWith(2026, 6));
  });

  it('calls getBudgets without args when year/month omitted', async () => {
    mockGetBudgets.mockResolvedValue([]);
    await renderHook(() => useBudgets(), { wrapper: Wrapper });
    await waitFor(() => expect(mockGetBudgets).toHaveBeenCalledWith(undefined, undefined));
  });
});
