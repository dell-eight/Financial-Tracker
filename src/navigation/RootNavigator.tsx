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
  addResponseListener,
} from '../services/notifications.service';
import { migratePinIfNeeded } from '../utils/pin';
import { fetchSecuritySettings, upsertSecuritySettings } from '../services/security.service';

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
  const pinEnabled               = useAppStore(s => s.pinEnabled);
  const autoLockDuration         = useAppStore(s => s.autoLockDuration);
  const screenshotPrivacyEnabled = useAppStore(s => s.screenshotPrivacyEnabled);
  const loadUserSecurity         = useAppStore(s => s.loadUserSecurity);
  const clearUserSecurity        = useAppStore(s => s.clearUserSecurity);
  const resetAccountSettings     = useAppStore(s => s.resetAccountSettings);

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
      // Migrate old global PIN SecureStore key → per-user key (one-time, no-op after)
      migratePinIfNeeded(userId);
    }

    // Restore session on cold start — use getUser() for server-fresh user_metadata
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUser = user ?? session.user ?? null;
        if (activeUser) await loadSecurity(activeUser.id);
        setSession(activeUser);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

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
        resetAccountSettings();
      }

      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        const activeUser = user ?? session.user ?? null;
        if (event === 'SIGNED_IN' && activeUser) {
          await loadSecurity(activeUser.id);
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

    // Handle taps on notifications (deep-link to BudgetAlerts or a specific screen)
    const sub = addResponseListener(_response => {
      // Future: navigate based on response.notification.request.content.data.type
    });

    return () => sub.remove();
  }, [isAuthenticated, notificationsEnabled]);

  // Track whether the user has ever been authenticated this session so that
  // signing out lands on Login instead of the Welcome/onboarding screen.
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated) wasAuthenticatedRef.current = true;
  }, [isAuthenticated]);

  const AuthScreen = useCallback(
    () => <AuthNavigator initialRoute={wasAuthenticatedRef.current ? 'Login' : 'Welcome'} />,
    [],
  );

  // Show lock screen when authenticated but not yet unlocked and at least one auth method is enabled
  const showBiometricLock = isAuthenticated && (biometricEnabled || pinEnabled) && !isBiometricUnlocked;

  if (isLoading) return <AppLoadingScreen />;

  return (
    <View style={styles.root}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {showBiometricLock ? (
          <Root.Screen name="Main" component={BiometricLockScreen} />
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
