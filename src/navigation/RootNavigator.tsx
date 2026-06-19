import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
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

const Root = createStackNavigator<RootStackParamList>();

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

  useEffect(() => {
    // Restore session on cold start — use getUser() for server-fresh user_metadata
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        setSession(user ?? session.user ?? null);
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

      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        setSession(user ?? session.user ?? null);
      } else {
        setSession(null);
      }
      setBiometricUnlocked(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-lock: track time spent in background; lock on resume if threshold exceeded
  const bgTimeRef = useRef(0);
  useEffect(() => {
    const THRESHOLDS: Record<string, number> = {
      '1min':  60_000,
      '5min':  300_000,
      '15min': 900_000,
      'never': Infinity,
    };
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        bgTimeRef.current = Date.now();
      } else if (state === 'active' && bgTimeRef.current > 0) {
        const elapsed   = Date.now() - bgTimeRef.current;
        const threshold = THRESHOLDS[autoLockDuration] ?? Infinity;
        if (elapsed >= threshold && (biometricEnabled || pinEnabled)) {
          setBiometricUnlocked(false);
        }
        bgTimeRef.current = 0;
      }
    });
    return () => sub.remove();
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

  // Show biometric lock screen when authenticated but not yet unlocked
  const showBiometricLock = isAuthenticated && biometricEnabled && !isBiometricUnlocked;

  if (isLoading) return <AppLoadingScreen />;

  return (
    <View style={styles.root}>
      <Root.Navigator screenOptions={{ headerShown: false }}>
        {showBiometricLock ? (
          <Root.Screen name="Main" component={BiometricLockScreen} />
        ) : isAuthenticated ? (
          <Root.Screen name="Main" component={MainNavigator} />
        ) : (
          <Root.Screen name="Auth" component={AuthNavigator} />
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
