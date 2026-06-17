import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CurrencyPickerScreen } from '../CurrencyPickerScreen';

jest.mock('../../../hooks/ui/useTheme', () => {
  const { lightTheme } = jest.requireActual('../../../theme');
  return { useTheme: jest.fn(() => lightTheme) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn() }));

const mockSetCurrency = jest.fn();
jest.mock('../../../store/app.store', () => ({
  useAppStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({ currency: 'PHP', setCurrency: mockSetCurrency }),
  ),
}));

jest.mock('../../../utils/currency', () => ({
  CURRENCIES: [
    { code: 'PHP', name: 'Philippine Peso', flag: '🇵🇭' },
    { code: 'USD', name: 'US Dollar',       flag: '🇺🇸' },
  ],
  getCurrencySymbol: (code: string) => (code === 'PHP' ? '₱' : '$'),
  useCurrency: jest.fn(() => ({
    currency: 'PHP', symbol: '₱',
    fmt: jest.fn((v: number) => `₱${v}`),
    fmtCompact: jest.fn((v: number) => `₱${v}`),
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigation: any = {
  navigate:    jest.fn(),
  goBack:      jest.fn(),
  push:        jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

describe('CurrencyPickerScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders currency names in the list', async () => {
    const { getByText } = await render(
      <CurrencyPickerScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Philippine Peso')).toBeTruthy();
    expect(getByText('US Dollar')).toBeTruthy();
  });

  it('shows a checkmark next to the currently selected currency', async () => {
    const { getByText } = await render(
      <CurrencyPickerScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('✓')).toBeTruthy();
  });

  it('calls setCurrency and goBack when a currency row is pressed', async () => {
    const { getByText } = await render(
      <CurrencyPickerScreen navigation={navigation} route={{} as never} />,
    );
    fireEvent.press(getByText('US Dollar'));
    expect(mockSetCurrency).toHaveBeenCalledWith('USD');
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it('navigates back when the Back button is pressed', async () => {
    const { getByText } = await render(
      <CurrencyPickerScreen navigation={navigation} route={{} as never} />,
    );
    fireEvent.press(getByText('← Back'));
    expect(navigation.goBack).toHaveBeenCalled();
  });
});
