import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BudgetScreen } from '../BudgetScreen';

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

const mockUseBudgets = jest.fn();
jest.mock('../../../hooks/queries/useBudgets', () => ({
  useBudgets: (...args: unknown[]) => mockUseBudgets(...args),
  BUDGETS_KEY: ['budgets'],
}));

jest.mock('../../../utils/currency', () => ({
  useCurrency: jest.fn(() => ({
    currency: 'PHP', symbol: '₱',
    fmt:        jest.fn((v: number) => `₱${v}`),
    fmtCompact: jest.fn((v: number) => `₱${v}`),
  })),
}));

jest.mock('../../../components', () => {
  const RN    = require('react-native');
  const React = require('react');
  return {
    BudgetCard: ({ categoryLabel, onPress }: { categoryLabel: string; onPress: () => void }) =>
      // Put onPress on the Text so fireEvent.press fires directly; testID for reliable targeting
      React.createElement(
        RN.Text,
        { onPress, testID: `budget-card-${categoryLabel}` },
        categoryLabel,
      ),
    SectionHeader: ({ title }: { title: string }) =>
      React.createElement(RN.Text, null, title),
  };
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigation: any = {
  navigate:    jest.fn(),
  goBack:      jest.fn(),
  push:        jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockBudget = {
  id:       'b1',
  category: 'food' as const,
  label:    'Food',
  icon:     '🍔',
  color:    '#FF6B6B',
  limit:    5000,
  spent:    3000,
  month:    6,
  year:     2026,
};

describe('BudgetScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the Budget heading', async () => {
    mockUseBudgets.mockReturnValue({ data: [], isLoading: false, refetch: jest.fn() });
    const { getByText } = await render(
      <BudgetScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Budget')).toBeTruthy();
  });

  it('renders budget categories when data is available', async () => {
    mockUseBudgets.mockReturnValue({
      data: [mockBudget], isLoading: false, refetch: jest.fn(),
    });
    const { getAllByText } = await render(
      <BudgetScreen navigation={navigation} route={{} as never} />,
    );
    // "Food" may appear in both the BudgetCard mock and internal allocation charts
    expect(getAllByText('Food').length).toBeGreaterThan(0);
  });

  it('navigates to CategoryBudgetDetail when a budget card is pressed', async () => {
    mockUseBudgets.mockReturnValue({
      data: [mockBudget], isLoading: false, refetch: jest.fn(),
    });
    const { getByTestId } = await render(
      <BudgetScreen navigation={navigation} route={{} as never} />,
    );
    // Use testID on the mocked BudgetCard to avoid ambiguity with internal allocation charts
    fireEvent.press(getByTestId('budget-card-Food'));
    expect(navigation.push).toHaveBeenCalledWith('CategoryBudgetDetail', { categoryId: 'b1' });
  });

  it('navigates to BudgetSetupWizard when Edit button is pressed', async () => {
    mockUseBudgets.mockReturnValue({ data: [], isLoading: false, refetch: jest.fn() });
    const { getByText } = await render(
      <BudgetScreen navigation={navigation} route={{} as never} />,
    );
    fireEvent.press(getByText('Edit'));
    expect(navigation.push).toHaveBeenCalledWith('BudgetSetupWizard');
  });
});
