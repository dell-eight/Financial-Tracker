import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

jest.mock('../../../hooks/ui/useTheme', () => {
  const { lightTheme } = jest.requireActual('../../../theme');
  return { useTheme: jest.fn(() => lightTheme) };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

const mockMutate = jest.fn();
jest.mock('../../../hooks/queries/useAuth', () => ({
  useLogin: jest.fn(() => ({ mutate: mockMutate, isPending: false })),
}));

jest.mock('../../../services/auth.service', () => ({
  signInWithGoogle: jest.fn(),
}));

jest.mock('../../../store/app.store', () => ({
  useAppStore: jest.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      loginLockoutUntil:  null,
      recordLoginFailure: jest.fn(),
      clearLoginAttempts: jest.fn(),
    }),
  ),
}));

jest.mock('../../../components', () => {
  const RN    = require('react-native');
  const React = require('react');
  return {
    AppButton: ({
      onPress, label, loading, disabled,
    }: {
      onPress: () => void; label: string; loading?: boolean; disabled?: boolean;
    }) =>
      React.createElement(
        RN.TouchableOpacity,
        { onPress, disabled, testID: 'app-button' },
        React.createElement(RN.Text, null, loading ? 'Loading…' : label),
      ),
    AppInput: ({
      onChangeText, placeholder, value, error,
    }: {
      onChangeText: (t: string) => void;
      placeholder?: string;
      value?: string;
      error?: string;
    }) =>
      React.createElement(
        RN.View,
        null,
        React.createElement(RN.TextInput, { onChangeText, placeholder, value }),
        error ? React.createElement(RN.Text, null, error) : null,
      ),
  };
});

jest.mock('../../../components/auth/SocialAuthRow', () => ({
  SocialAuthRow: () => null,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navigation: any = {
  navigate:    jest.fn(),
  goBack:      jest.fn(),
  push:        jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  afterEach(async () => {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  });

  it('renders the welcome heading', async () => {
    const { getByText } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Welcome Back')).toBeTruthy();
  });

  it('renders email and password inputs', async () => {
    const { getByPlaceholderText } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByPlaceholderText('john@example.com')).toBeTruthy();
    expect(getByPlaceholderText('Your password')).toBeTruthy();
  });

  it('renders the Sign In button', async () => {
    const { getByText } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('calls login.mutate with email and password when Sign In is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    // Flush state updates before pressing submit
    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('john@example.com'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    });
    await act(async () => {
      fireEvent.press(getByTestId('app-button'));
    });
    await waitFor(() => expect(mockMutate).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'password123' },
      expect.any(Object),
    ));
  });

  it('navigates to ForgotPassword when the link is pressed', async () => {
    const { getAllByRole } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    // Find the Pressable by its accessibilityLabel via props (RNTL v14 accessible-name filtering)
    const buttons = getAllByRole('button');
    const forgotBtn = buttons.find(
      el => el.props.accessibilityLabel === 'Forgot your password',
    );
    expect(forgotBtn).toBeTruthy();
    fireEvent.press(forgotBtn!);
    expect(navigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('navigates to SignUp when the link is pressed', async () => {
    const { getAllByRole } = await render(
      <LoginScreen navigation={navigation} route={{} as never} />,
    );
    const buttons = getAllByRole('button');
    const signUpBtn = buttons.find(
      el => el.props.accessibilityLabel === 'Go to create account',
    );
    expect(signUpBtn).toBeTruthy();
    fireEvent.press(signUpBtn!);
    expect(navigation.navigate).toHaveBeenCalledWith('SignUp');
  });
});
