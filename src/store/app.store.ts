import { create } from 'zustand';

export type ThemePreference = 'dark' | 'light' | 'system';

interface AppState {
  themePreference: ThemePreference;
  currency: string;
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  setCurrency: (currency: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setBiometricEnabled: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  themePreference:      'system',
  currency:             'USD',
  notificationsEnabled: true,
  biometricEnabled:     false,

  setThemePreference:      (themePreference)      => set({ themePreference }),
  setCurrency:             (currency)             => set({ currency }),
  setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
  setBiometricEnabled:     (biometricEnabled)     => set({ biometricEnabled }),
}));
