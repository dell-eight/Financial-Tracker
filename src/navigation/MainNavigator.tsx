import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BudgetScreen } from '../screens/budget/BudgetScreen';
import { ExpenseScreen } from '../screens/expenses/ExpenseScreen';
import { BottomTabBar } from '../components';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={placeholderStyles.screen}>
      <Text style={placeholderStyles.text}>{label}</Text>
    </View>
  );
}

const placeholderStyles = StyleSheet.create({
  screen: {
    flex:           1,
    backgroundColor: '#0D0D1A',
    alignItems:     'center',
    justifyContent: 'center',
  },
  text: {
    fontSize:   18,
    color:      'rgba(255,255,255,0.4)',
  },
});

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={DashboardScreen} />
      <Tab.Screen name="Budget"    component={BudgetScreen} />
      <Tab.Screen name="Expenses"  component={ExpenseScreen} />
      <Tab.Screen name="Analytics" children={() => <PlaceholderScreen label="Analytics" />} />
      <Tab.Screen name="Profile"   children={() => <PlaceholderScreen label="Profile" />} />
    </Tab.Navigator>
  );
}
