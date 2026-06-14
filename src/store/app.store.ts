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
  setThemePreference:      (pref: ThemePreference) => void;
  setCurrency:             (currency: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricEnabled:     (enabled: boolean) => void;
  setBiometricUnlocked:    (unlocked: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themePreference:      'system',
      currency:             'USD',
      notificationsEnabled: true,
      biometricEnabled:     false,
      isBiometricUnlocked:  false,

      setThemePreference:      (themePreference)      => set({ themePreference }),
      setCurrency:             (currency)             => set({ currency }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      setBiometricEnabled:     (biometricEnabled)     => set({ biometricEnabled }),
      setBiometricUnlocked:    (isBiometricUnlocked)  => set({ isBiometricUnlocked }),
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
      }),
    },
  ),
);
