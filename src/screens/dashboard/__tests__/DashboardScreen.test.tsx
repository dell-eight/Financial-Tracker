import React from 'react';
import { render } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';

jest.mock('../../../hooks/ui/useTheme', () => {
  const { lightTheme } = jest.requireActual('../../../theme');
  return { useTheme: jest.fn(() => lightTheme) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children: React.ReactNode }) =>
    require('react').createElement(require('react-native').View, null, children),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));

const mockUseDashboard    = jest.fn();
const mockUseTransactions = jest.fn();
const mockUseBudgets      = jest.fn();
const mockUseSavingsGoals = jest.fn();

jest.mock('../../../hooks/queries/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
  DASHBOARD_KEY: ['dashboard'],
}));
jest.mock('../../../hooks/queries/useTransactions', () => ({
  useTransactions: () => mockUseTransactions(),
  TRANSACTIONS_KEY: ['transactions'],
}));
jest.mock('../../../hooks/queries/useBudgets', () => ({
  useBudgets: () => mockUseBudgets(),
  BUDGETS_KEY: ['budgets'],
}));
jest.mock('../../../hooks/queries/useSavingsGoals', () => ({
  useSavingsGoals: () => mockUseSavingsGoals(),
}));

const mockUser = {
  id:            'user-1',
  email:         'test@example.com',
  user_metadata: { display_name: 'Test User' },
};

jest.mock('../../../store/auth.store', () => ({
  useAuthStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ user: mockUser, isAuthenticated: true }),
  ),
}));

jest.mock('../../../utils/currency', () => ({
  useCurrency: jest.fn(() => ({
    currency: 'PHP', symbol: '₱',
    fmt:        jest.fn((v: number) => `₱${v}`),
    fmtCompact: jest.fn((v: number) => `₱${v}`),
  })),
}));

jest.mock('../../../utils/healthScore', () => ({
  computeHealthScore: jest.fn(() => ({ total: 72, factors: [] })),
}));

jest.mock('../../../components', () => {
  const RN    = require('react-native');
  const React = require('react');
  return {
    ProgressBar:   () => null,
    SectionHeader: ({ title }: { title: string }) =>
      React.createElement(RN.Text, null, title),
    ExpenseItem:   () => null,
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigation: any = {
  navigate:    jest.fn(),
  goBack:      jest.fn(),
  push:        jest.fn(),
  getParent:   jest.fn(() => ({ navigate: jest.fn() })),
  addListener: jest.fn(() => jest.fn()),
};

const loadingState = { data: undefined, isLoading: true,  refetch: jest.fn() };
const emptyState   = { data: undefined, isLoading: false, refetch: jest.fn() };

const mockDashboard = {
  totalBalance:     150000,
  netWorth:         250000,
  monthlyIncome:    50000,
  monthlyExpenses:  30000,
  savingsRate:      40,
  balanceDelta:     5000,
  balanceDeltaPct:  2,
  totalAssets:      300000,
  totalDebts:       50000,
  investmentValue:  80000,
};

describe('DashboardScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders without crashing in loading state', async () => {
    mockUseDashboard.mockReturnValue(loadingState);
    mockUseTransactions.mockReturnValue(loadingState);
    mockUseBudgets.mockReturnValue(loadingState);
    mockUseSavingsGoals.mockReturnValue(loadingState);

    const result = await render(
      <DashboardScreen navigation={navigation} route={{} as never} />,
    );
    expect(result).toBeDefined();
  });

  it('renders greeting with user first name', async () => {
    mockUseDashboard.mockReturnValue(emptyState);
    mockUseTransactions.mockReturnValue(emptyState);
    mockUseBudgets.mockReturnValue(emptyState);
    mockUseSavingsGoals.mockReturnValue(emptyState);

    const { getByText } = await render(
      <DashboardScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Test 👋')).toBeTruthy();
  });

  it('renders Recent Transactions section header when data is loaded', async () => {
    mockUseDashboard.mockReturnValue({
      data: mockDashboard, isLoading: false, refetch: jest.fn(),
    });
    mockUseTransactions.mockReturnValue({
      data: [], isLoading: false, refetch: jest.fn(),
    });
    mockUseBudgets.mockReturnValue({
      data: [], isLoading: false, refetch: jest.fn(),
    });
    mockUseSavingsGoals.mockReturnValue({
      data: [], isLoading: false, refetch: jest.fn(),
    });

    const { getByText } = await render(
      <DashboardScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Recent Transactions')).toBeTruthy();
  });
});
