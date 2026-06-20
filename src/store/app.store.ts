import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'dark' | 'light' | 'system';
export type AutoLockDuration = '1min' | '5min' | '15min' | 'never';

export interface PendingMilestone {
  id:        string;
  type:      string;
  label:     string;
  emoji:     string;
  netWorth:  number;
}

export interface SecuritySettings {
  biometricEnabled:         boolean;
  pinEnabled:               boolean;
  autoLockDuration:         AutoLockDuration;
  screenshotPrivacyEnabled: boolean;
}

export const DEFAULT_SECURITY: SecuritySettings = {
  biometricEnabled:         false,
  pinEnabled:               false,
  autoLockDuration:         'never',
  screenshotPrivacyEnabled: false,
};

const MAX_LOGIN_ATTEMPTS  = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface AppState {
  // ── Account-level preferences (persisted, reset on sign-out) ──────────
  themePreference:      ThemePreference;
  currency:             string;
  notificationsEnabled: boolean;
  alert80Enabled:       boolean;
  alert100Enabled:      boolean;
  weeklySummaryEnabled: boolean;

  // ── Device-level brute-force guard (persisted, never reset) ───────────
  loginAttempts:     number;
  loginLockoutUntil: number | null;

  // ── Active security settings (NOT persisted — loaded from Supabase on sign-in) ──
  biometricEnabled:         boolean;
  pinEnabled:               boolean;
  autoLockDuration:         AutoLockDuration;
  screenshotPrivacyEnabled: boolean;

  // ── Session-only (never persisted) ────────────────────────────────────
  isBiometricUnlocked: boolean;
  pendingMilestones:   PendingMilestone[];

  // ── Setters ────────────────────────────────────────────────────────────
  setThemePreference:          (pref: ThemePreference) => void;
  setCurrency:                 (currency: string) => void;
  setNotificationsEnabled:     (enabled: boolean) => void;
  setBiometricEnabled:         (enabled: boolean) => void;
  setBiometricUnlocked:        (unlocked: boolean) => void;
  setAlert80Enabled:           (enabled: boolean) => void;
  setAlert100Enabled:          (enabled: boolean) => void;
  setWeeklySummaryEnabled:     (enabled: boolean) => void;
  setPinEnabled:               (enabled: boolean) => void;
  setAutoLockDuration:         (duration: AutoLockDuration) => void;
  setScreenshotPrivacyEnabled: (enabled: boolean) => void;
  recordLoginFailure:          () => void;
  clearLoginAttempts:          () => void;
  addPendingMilestones:        (milestones: PendingMilestone[]) => void;
  shiftPendingMilestone:       () => void;

  // ── Auth-event actions ─────────────────────────────────────────────────
  // Hydrates the active security fields from a Supabase-fetched settings object.
  loadUserSecurity:    (settings: SecuritySettings) => void;
  // Resets active security fields to defaults on sign-out (DB row is preserved).
  clearUserSecurity:   () => void;
  // Resets account-level preferences on sign-out.
  resetAccountSettings: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Initial values ───────────────────────────────────────────────
      themePreference:      'system',
      currency:             'PHP',
      notificationsEnabled: true,
      alert80Enabled:       true,
      alert100Enabled:      true,
      weeklySummaryEnabled: false,
      loginAttempts:        0,
      loginLockoutUntil:    null,
      ...DEFAULT_SECURITY,
      isBiometricUnlocked:  false,
      pendingMilestones:    [],

      // ── Account setters ──────────────────────────────────────────────
      setThemePreference:          (themePreference)          => set({ themePreference }),
      setCurrency:                 (currency)                 => set({ currency }),
      setNotificationsEnabled:     (notificationsEnabled)     => set({ notificationsEnabled }),
      setAlert80Enabled:           (alert80Enabled)           => set({ alert80Enabled }),
      setAlert100Enabled:          (alert100Enabled)          => set({ alert100Enabled }),
      setWeeklySummaryEnabled:     (weeklySummaryEnabled)     => set({ weeklySummaryEnabled }),
      setBiometricUnlocked:        (isBiometricUnlocked)      => set({ isBiometricUnlocked }),

      // ── Security setters (optimistic local update; caller syncs to Supabase) ──
      setBiometricEnabled:         (biometricEnabled)         => set({ biometricEnabled }),
      setPinEnabled:               (pinEnabled)               => set({ pinEnabled }),
      setAutoLockDuration:         (autoLockDuration)         => set({ autoLockDuration }),
      setScreenshotPrivacyEnabled: (screenshotPrivacyEnabled) => set({ screenshotPrivacyEnabled }),

      // ── Auth rate limiting ───────────────────────────────────────────
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

      // ── Milestone celebrations ───────────────────────────────────────
      addPendingMilestones: (milestones) => set((s) => ({
        pendingMilestones: [...s.pendingMilestones, ...milestones],
      })),
      shiftPendingMilestone: () => set((s) => ({
        pendingMilestones: s.pendingMilestones.slice(1),
      })),

      // ── Auth-event actions ───────────────────────────────────────────

      // Called after sign-in with the row fetched from Supabase.
      loadUserSecurity: (settings) => set({
        ...settings,
        isBiometricUnlocked: false,
      }),

      // Called on sign-out — clears active security state.
      // The Supabase row is NOT deleted; it persists for the next sign-in.
      clearUserSecurity: () => set({
        ...DEFAULT_SECURITY,
        isBiometricUnlocked: false,
      }),

      // Called on sign-out — resets account-level preferences only.
      resetAccountSettings: () => set({
        currency:             'PHP',
        notificationsEnabled: true,
        alert80Enabled:       true,
        alert100Enabled:      true,
        weeklySummaryEnabled: false,
        pendingMilestones:    [],
      }),
    }),
    {
      name:    'app-preferences',
      storage: createJSONStorage(() => AsyncStorage),
      // Security settings are excluded — they are loaded from Supabase on every
      // sign-in so they follow the account, not the device.
      // isBiometricUnlocked and pendingMilestones are session-only.
      partialize: (state) => ({
        themePreference:      state.themePreference,
        currency:             state.currency,
        notificationsEnabled: state.notificationsEnabled,
        alert80Enabled:       state.alert80Enabled,
        alert100Enabled:      state.alert100Enabled,
        weeklySummaryEnabled: state.weeklySummaryEnabled,
        loginAttempts:        state.loginAttempts,
        loginLockoutUntil:    state.loginLockoutUntil,
      }),
    },
  ),
);
