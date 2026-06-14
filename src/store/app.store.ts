import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'dark' | 'light' | 'system';

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

  setThemePreference:      (pref: ThemePreference) => void;
  setCurrency:             (currency: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricEnabled:     (enabled: boolean) => void;
  setBiometricUnlocked:    (unlocked: boolean) => void;
  setAlert80Enabled:       (enabled: boolean) => void;
  setAlert100Enabled:      (enabled: boolean) => void;
  setWeeklySummaryEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themePreference:      'system',
      currency:             'USD',
      notificationsEnabled: true,
      biometricEnabled:     false,
      isBiometricUnlocked:  false,
      alert80Enabled:       true,
      alert100Enabled:      true,
      weeklySummaryEnabled: false,

      setThemePreference:      (themePreference)      => set({ themePreference }),
      setCurrency:             (currency)             => set({ currency }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBiometricEnabled:     (biometricEnabled)     => set({ biometricEnabled }),
      setBiometricUnlocked:    (isBiometricUnlocked)  => set({ isBiometricUnlocked }),
      setAlert80Enabled:       (alert80Enabled)       => set({ alert80Enabled }),
      setAlert100Enabled:      (alert100Enabled)      => set({ alert100Enabled }),
      setWeeklySummaryEnabled: (weeklySummaryEnabled) => set({ weeklySummaryEnabled }),
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
      }),
    },
  ),
);
