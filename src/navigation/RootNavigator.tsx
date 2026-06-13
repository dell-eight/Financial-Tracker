import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { QuickAddSheet } from '../screens/home/QuickAddSheet';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '../lib/supabase';

const Root = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const setSession      = useAuthStore(s => s.setSession);

  useEffect(() => {
    // Restore session on cold start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session?.user ?? null);
    });

    // Keep store in sync with Supabase auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
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
  );
}
