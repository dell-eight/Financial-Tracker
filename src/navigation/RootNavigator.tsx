import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { QuickAddSheet } from '../screens/home/QuickAddSheet';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { BiometricLockScreen } from '../screens/auth/BiometricLockScreen';
import { AppLoadingScreen } from '../screens/auth/AppLoadingScreen';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { MilestoneModal } from '../components/wealth/MilestoneModal';
import { ChartOverlayHost } from '../components/charts/ChartOverlayHost';
import {
  requestPermissionsAndGetToken,
  savePushToken,
  syncWeeklySummary,
  syncDailyReminder,
  addResponseListener,
} from '../services/notifications.service';
import { migratePinIfNeeded } from '../utils/pin';
import { fetchSecuritySettings, upsertSecuritySettings, fetchScoreMode } from '../services/security.service';
import { trackAppOpened, identifyUser, resetAnalyticsUser } from '../services/analytics.service';
import { applyDueRecurringTransactions } from '../services/finance.service';
import { TRANSACTIONS_KEY } from '../hooks/queries/useTransactions';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { setUserContext as setCrashUser, clearUserContext as clearCrashUser } from '../services/crash.service';

const Root = createStackNavigator<RootStackParamList>();

const THRESHOLDS: Record<string, number> = {
  '1min':  60_000,
  '5min':  300_000,
  '15min': 900_000,
  'never': Infinity,
};


const styles = StyleSheet.create({
  root: { flex: 1 },
});

export function RootNavigator() {
  const isAuthenticated      = useAuthStore(s => s.isAuthenticated);
  const isLoading            = useAuthStore(s => s.isLoading);
  const setSession           = useAuthStore(s => s.setSession);
  const setLoading           = useAuthStore(s => s.setLoading);
  const biometricEnabled         = useAppStore(s => s.biometricEnabled);
  const isBiometricUnlocked      = useAppStore(s => s.isBiometricUnlocked);
  const setBiometricUnlocked     = useAppStore(s => s.setBiometricUnlocked);
  const notificationsEnabled     = useAppStore(s => s.notificationsEnabled);
  const weeklySummaryEnabled     = useAppStore(s => s.weeklySummaryEnabled);
  const eveningReminderEnabled   = useAppStore(s => s.eveningReminderEnabled);
  const pinEnabled               = useAppStore(s => s.pinEnabled);
  const autoLockDuration         = useAppStore(s => s.autoLockDuration);
  const screenshotPrivacyEnabled = useAppStore(s => s.screenshotPrivacyEnabled);
  const loadUserSecurity         = useAppStore(s => s.loadUserSecurity);
  const clearUserSecurity        = useAppStore(s => s.clearUserSecurity);
  const resetAccountSettings     = useAppStore(s => s.resetAccountSettings);
  const setHealthScoreMode       = useAppStore(s => s.setHealthScoreMode);
  const clearHealthScoreMode     = useAppStore(s => s.clearHealthScoreMode);
  const hasOnboarded                   = useAppStore(s => s.hasOnboarded);
  const setHasOnboarded                = useAppStore(s => s.setHasOnboarded);
  const hasSeenNetWorthOnboarding      = useAppStore(s => s.hasSeenNetWorthOnboarding);
  const setHasSeenNetWorthOnboarding   = useAppStore(s => s.setHasSeenNetWorthOnboarding);
  const setLastSignedInUserId          = useAppStore(s => s.setLastSignedInUserId);

  useEffect(() => {
    // Loads this user's security settings from Supabase and hydrates the store.
    // On first sign-in (no DB row yet), any old AsyncStorage values are migrated
    // then a row is created so subsequent sign-ins restore correctly.
    async function loadSecurity(userId: string) {
      const dbSettings = await fetchSecuritySettings();
      if (dbSettings) {
        loadUserSecurity(dbSettings);
      } else {
        // First sign-in for this account on this device — migrate old local values
        // if they exist (pre-Supabase installs had flat fields in AsyncStorage).
        const store = useAppStore.getState();
        const migrated = {
          biometricEnabled:         store.biometricEnabled,
          pinEnabled:               store.pinEnabled,
          autoLockDuration:         store.autoLockDuration,
          screenshotPrivacyEnabled: store.screenshotPrivacyEnabled,
        };
        await upsertSecuritySettings(migrated);
        loadUserSecurity(migrated);
      }
      // Load health score mode (best-effort; default 'balanced' if null)
      fetchScoreMode().then(mode => { if (mode) setHealthScoreMode(mode); }).catch(() => {});

      // Migrate old global PIN SecureStore key → per-user key (one-time, no-op after)
      migratePinIfNeeded(userId);
    }

    // Pre-warm the Supabase HTTP connection. For new users getSession() resolves
    // from SecureStore only (no network), leaving TLS unestablished until the first
    // sign-in/sign-up tap. This fire-and-forget call ensures the connection is ready
    // before the user reaches the auth form.
    void fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`).catch(() => {});

    // Restore session on cold start — use getUser() for server-fresh user_metadata.
    // Race against an 8 s timeout: a stalled SecureStore read or slow getUser() network
    // call should never leave the user stuck on the loading screen indefinitely.
    trackAppOpened();

    const AUTH_TIMEOUT_MS = 8_000;
    let restoreCancelled = false;
    let restoreTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const sessionRestorePromise = supabase.auth.getSession().then(async ({ data: { session } }) => {
      // Cancel the timeout as soon as we have a result — prevents the timer from
      // calling setSession(null) after we've already authenticated the user.
      if (restoreTimeoutId !== null) clearTimeout(restoreTimeoutId);
      if (restoreCancelled) return;
      if (!session) { setSession(null); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (restoreCancelled) return;
      const activeUser = user ?? session.user ?? null;
      if (activeUser) {
        await loadSecurity(activeUser.id);
        applyDueRecurringTransactions()
          .then(() => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }))
          .catch(() => {});
        // Do NOT re-evaluate account age here. The SIGNED_IN handler already
        // persisted the correct value on login. Overriding it here would break
        // resumability — a new user who force-closes and reopens after 5 min
        // would have their onboarding skipped permanently.
      }
      if (restoreCancelled) return;
      setSession(activeUser);
    });

    const timeoutPromise = new Promise<void>(resolve => {
      restoreTimeoutId = setTimeout(() => {
        restoreCancelled = true;
        setSession(null);   // fall through to login screen
        resolve();
      }, AUTH_TIMEOUT_MS);
    });

    Promise.race([sessionRestorePromise, timeoutPromise]).finally(() => setLoading(false));

    // Keep store in sync with Supabase auth events (login, logout, token refresh)
    // getUser() ensures user_metadata (e.g. avatar_url) is always server-authoritative
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Clear cache synchronously — before any await — so no query can
      // refetch with the wrong user's uid during the getUser() round-trip.
      // Skips TOKEN_REFRESHED / USER_UPDATED / INITIAL_SESSION so the
      // current user's live data is never discarded mid-session.
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        queryClient.clear();
      }
      if (event === 'SIGNED_OUT') {
        clearUserSecurity();
        clearHealthScoreMode();
        resetAccountSettings();
        resetAnalyticsUser();
        clearCrashUser();
      }

      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUser = user ?? session.user ?? null;
        if (event === 'SIGNED_IN' && activeUser) {
          // loadSecurity is best-effort — a failure or slow DB must not block navigation.
          // Race against 10 s so a hung Supabase call never leaves the user on Login.
          try {
            await Promise.race([
              loadSecurity(activeUser.id),
              new Promise<void>(resolve => setTimeout(resolve, 10_000)),
            ]);
          } catch {
            // DB query failed (e.g. RLS, network). App proceeds with store defaults.
          }
          identifyUser(activeUser.id, { email: activeUser.email });
          setCrashUser(activeUser.id);
          setHasOnboarded(true);
          applyDueRecurringTransactions()
          .then(() => queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }))
          .catch(() => {});
          // Reset tutorial completion when a different user signs in, so they
          // see fresh coachmarks instead of inheriting the previous user's state.
          setLastSignedInUserId(activeUser.id);
          // Returning users skip onboarding; new accounts reset the flag in case
          // a prior account on this device had left it as true in AsyncStorage.
          const ageMs = Date.now() - new Date(activeUser.created_at ?? 0).getTime();
          setHasSeenNetWorthOnboarding(ageMs > 5 * 60 * 1000);
        }
        setSession(activeUser);
      } else {
        setSession(null);
      }
      setBiometricUnlocked(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-lock: JS timers pause when the app is backgrounded. On resume, the interval fires
  // with a gap equal to time spent in background — no AppState events required.
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    const threshold = THRESHOLDS[autoLockDuration] ?? Infinity;
    lastTickRef.current = Date.now();
    if (threshold === Infinity) return;

    const id = setInterval(() => {
      const now = Date.now();
      const gap = now - lastTickRef.current;
      lastTickRef.current = now;
      if (gap >= threshold && (biometricEnabled || pinEnabled)) {
        setBiometricUnlocked(false);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [autoLockDuration, biometricEnabled, pinEnabled]);

  // Screenshot privacy: enable/disable FLAG_SECURE (Android) and iOS snapshot prevention
  useEffect(() => {
    if (screenshotPrivacyEnabled) {
      ScreenCapture.preventScreenCaptureAsync();
    } else {
      ScreenCapture.allowScreenCaptureAsync();
    }
  }, [screenshotPrivacyEnabled]);

  // Request notification permissions and register push token once authenticated
  useEffect(() => {
    if (!isAuthenticated || !notificationsEnabled) return;

    requestPermissionsAndGetToken().then(token => {
      if (token) savePushToken(token);
    });

    syncWeeklySummary(weeklySummaryEnabled);
    syncDailyReminder(eveningReminderEnabled);

    // Handle taps on notifications (deep-link to BudgetAlerts or a specific screen)
    const sub = addResponseListener(_response => {
      // Future: navigate based on response.notification.request.content.data.type
    });

    return () => sub.remove();
  }, [isAuthenticated, notificationsEnabled, weeklySummaryEnabled, eveningReminderEnabled]);

  const AuthScreen = useCallback(
    () => <AuthNavigator initialRoute={hasOnboarded ? 'Login' : 'Welcome'} />,
    [hasOnboarded],
  );

  // Show lock screen when authenticated but not yet unlocked and at least one auth method is enabled
  const showBiometricLock = isAuthenticated && (biometricEnabled || pinEnabled) && !isBiometricUnlocked;

  if (isLoading) return <AppLoadingScreen />;

  return (
    <View style={styles.root}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {showBiometricLock ? (
          <Root.Screen name="Main" component={BiometricLockScreen} />
        ) : isAuthenticated && !hasSeenNetWorthOnboarding ? (
          <Root.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : isAuthenticated ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthScreen} />
        )}
        <Root.Screen
          name="QuickAddSheet"
          component={QuickAddSheet}
          options={{
            presentation:       'transparentModal',
            cardStyle:          { backgroundColor: 'transparent' },
            headerShown:        false,
            cardOverlayEnabled: true,
          }}
        />
      </Root.Navigator>
      <OfflineBanner />
      {isAuthenticated && <MilestoneModal />}
      <ChartOverlayHost />
    </View>
  );
}
