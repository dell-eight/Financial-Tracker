import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen }  from '../screens/dashboard/DashboardScreen';
import { BudgetScreen }     from '../screens/budget/BudgetScreen';
import { ExpenseScreen }    from '../screens/expenses/ExpenseScreen';
import { AnalyticsScreen }  from '../screens/analytics/AnalyticsScreen';
import { ProfileScreen }    from '../screens/profile/ProfileScreen';
import { BottomTabBar }     from '../components';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={DashboardScreen} />
      <Tab.Screen name="Budget"    component={BudgetScreen} />
      <Tab.Screen name="Expenses"  component={ExpenseScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}
