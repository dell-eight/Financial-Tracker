import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'dark' | 'light' | 'system';

const MAX_LOGIN_ATTEMPTS  = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface AppState {
  themePreference:      ThemePreference;
  currency:             string;
  notificationsEnabled: boolean;
  biometricEnabled:     boolean;
  isBiometricUnlocked:  boolean;
  // Budget alert preferences
  alert80Enabled:       boolean;
  alert100Enabled:      boolean;
  weeklySummaryEnabled: boolean;
  // Auth rate limiting — persisted so lockout survives app restart
  loginAttempts:        number;
  loginLockoutUntil:    number | null; // epoch ms, null = not locked out

  setThemePreference:      (pref: ThemePreference) => void;
  setCurrency:             (currency: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricEnabled:     (enabled: boolean) => void;
  setBiometricUnlocked:    (unlocked: boolean) => void;
  setAlert80Enabled:       (enabled: boolean) => void;
  setAlert100Enabled:      (enabled: boolean) => void;
  setWeeklySummaryEnabled: (enabled: boolean) => void;
  recordLoginFailure:      () => void;
  clearLoginAttempts:      () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themePreference:      'system',
      currency:             'PHP',
      notificationsEnabled: true,
      biometricEnabled:     false,
      isBiometricUnlocked:  false,
      alert80Enabled:       true,
      alert100Enabled:      true,
      weeklySummaryEnabled: false,
      loginAttempts:        0,
      loginLockoutUntil:    null,

      setThemePreference:      (themePreference)      => set({ themePreference }),
      setCurrency:             (currency)             => set({ currency }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBiometricEnabled:     (biometricEnabled)     => set({ biometricEnabled }),
      setBiometricUnlocked:    (isBiometricUnlocked)  => set({ isBiometricUnlocked }),
      setAlert80Enabled:       (alert80Enabled)       => set({ alert80Enabled }),
      setAlert100Enabled:      (alert100Enabled)      => set({ alert100Enabled }),
      setWeeklySummaryEnabled: (weeklySummaryEnabled) => set({ weeklySummaryEnabled }),

      recordLoginFailure: () => set((s) => {
        const next = s.loginAttempts + 1;
        return {
          loginAttempts:     next,
          loginLockoutUntil: next >= MAX_LOGIN_ATTEMPTS
            ? Date.now() + LOCKOUT_DURATION_MS
            : s.loginLockoutUntil,
        };
      }),

      clearLoginAttempts: () => set({ loginAttempts: 0, loginLockoutUntil: null }),
    }),
    {
      name:    'app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      // isBiometricUnlocked is session-only — excluded from persistence
      partialize: (state) => ({
        themePreference:      state.themePreference,
        currency:             state.currency,
        notificationsEnabled: state.notificationsEnabled,
        biometricEnabled:     state.biometricEnabled,
        alert80Enabled:       state.alert80Enabled,
        alert100Enabled:      state.alert100Enabled,
        weeklySummaryEnabled: state.weeklySummaryEnabled,
        loginAttempts:        state.loginAttempts,
        loginLockoutUntil:    state.loginLockoutUntil,
      }),
    },
  ),
);
