import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { QuickAddSheet } from '../screens/home/QuickAddSheet';
import { useAuthStore } from '../store/auth.store';
import { useAppStore } from '../store/app.store';
import { BiometricLockScreen } from '../screens/auth/BiometricLockScreen';
import { supabase } from '../lib/supabase';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { MilestoneModal } from '../components/wealth/MilestoneModal';
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
  const setSession           = useAuthStore(s => s.setSession);
  const biometricEnabled     = useAppStore(s => s.biometricEnabled);
  const isBiometricUnlocked  = useAppStore(s => s.isBiometricUnlocked);
  const setBiometricUnlocked = useAppStore(s => s.setBiometricUnlocked);
  const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
  const weeklySummaryEnabled = useAppStore(s => s.weeklySummaryEnabled);

  useEffect(() => {
    // Restore session on cold start — use getUser() for server-fresh user_metadata
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        setSession(user ?? session.user ?? null);
      } else {
        setSession(null);
      }
    });

    // Keep store in sync with Supabase auth events (login, logout, token refresh)
    // getUser() ensures user_metadata (e.g. avatar_url) is always server-authoritative
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: { user } } = await supabase.auth.getUser();
        setSession(user ?? session.user ?? null);
      } else {
        setSession(null);
      }
      // Reset biometric lock whenever the session changes (login / logout)
      setBiometricUnlocked(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    </View>
  );
}
