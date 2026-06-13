import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { QuickAddSheet } from '../screens/home/QuickAddSheet';
import { useAuthStore } from '../store/auth.store';

const Root = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

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
          presentation:  'transparentModal',
          cardStyle:     { backgroundColor: 'transparent' },
          headerShown:   false,
          cardOverlayEnabled: true,
        }}
      />
    </Root.Navigator>
  );
}
