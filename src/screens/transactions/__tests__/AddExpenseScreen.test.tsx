import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AddExpenseScreen } from '../AddExpenseScreen';

jest.mock('../../../hooks/ui/useTheme', () => {
  const { lightTheme } = jest.requireActual('../../../theme');
  return { useTheme: jest.fn(() => lightTheme) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-haptics', () => ({
  selectionAsync:      jest.fn(),
  impactAsync:         jest.fn(),
  notificationAsync:   jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

jest.mock('@react-native-community/datetimepicker', () => ({
  default: () => null,
}));

const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

jest.mock('../../../hooks/ui/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock('../../../hooks/queries/useAccounts', () => ({
  useAccounts: jest.fn(() => ({ data: [] })),
}));

const mockAddExpense = jest.fn();
const mockGetBudgets = jest.fn(() => Promise.resolve([]));
jest.mock('../../../services/finance.service', () => ({
  addExpense: (...args: unknown[]) => mockAddExpense(...args),
  getBudgets: (...args: unknown[]) => mockGetBudgets(...args),
}));

jest.mock('../../../services/notifications.service', () => ({
  checkBudgetThresholds: jest.fn(),
}));

jest.mock('../../../store/app.store', () => ({
  useAppStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      notificationsEnabled: false,
      alert80Enabled:       false,
      alert100Enabled:      false,
    }),
  ),
}));

jest.mock('../../../utils/currency', () => ({
  useCurrency: jest.fn(() => ({
    currency: 'PHP', symbol: '₱',
    fmt:        jest.fn((v: number) => `₱${v}`),
    fmtCompact: jest.fn((v: number) => `₱${v}`),
  })),
}));

jest.mock('../../../components/common/LoadingOverlay', () => ({
  LoadingOverlay: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigation: any = {
  navigate:    jest.fn(),
  goBack:      jest.fn(),
  push:        jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

describe('AddExpenseScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the Add Expense heading', async () => {
    const { getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Add Expense')).toBeTruthy();
  });

  it('renders the amount label and currency symbol', async () => {
    const { getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('AMOUNT')).toBeTruthy();
    expect(getByText('₱')).toBeTruthy();
  });

  it('renders the category section label', async () => {
    const { getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('CATEGORY')).toBeTruthy();
  });

  it('renders the Save button', async () => {
    const { getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Save')).toBeTruthy();
  });

  it('navigates to TransactionList when Cancel is pressed', async () => {
    const { getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );
    fireEvent.press(getByText('Cancel'));
    expect(navigation.navigate).toHaveBeenCalledWith('TransactionList', undefined);
  });

  it('calls addExpense after entering amount and selecting category', async () => {
    mockAddExpense.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByLabelText, getByText } = await render(
      <AddExpenseScreen navigation={navigation} route={{} as never} />,
    );

    // Flush state: enter amount then select the Food category tile
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('0.00'), '500');
    });
    await act(async () => {
      // Category tiles have accessibilityLabel={cat.label} — 'Food' is the first category
      fireEvent.press(getByLabelText('Food'));
    });

    // Both canSave conditions are now met; press Save
    await act(async () => {
      fireEvent.press(getByText('Save'));
    });

    await waitFor(() => expect(mockAddExpense).toHaveBeenCalled());
  });
});
