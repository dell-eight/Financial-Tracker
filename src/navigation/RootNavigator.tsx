import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const Root = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Root.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Main"
    >
      <Root.Screen name="Auth" component={AuthNavigator} />
      <Root.Screen name="Main" component={MainNavigator} />
    </Root.Navigator>
  );
}
