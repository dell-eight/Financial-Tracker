import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components';
import type { MainTabParamList } from './types';
import { HomeStack }         from './stacks/HomeStack';
import { TransactionsStack } from './stacks/TransactionsStack';
import { BudgetStack }       from './stacks/BudgetStack';
import { WealthStack }       from './stacks/WealthStack';
import { AnalyticsStack }    from './stacks/AnalyticsStack';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"         component={HomeStack} />
      <Tab.Screen name="Transactions" component={TransactionsStack} />
      <Tab.Screen name="Budget"       component={BudgetStack} />
      <Tab.Screen name="Wealth"       component={WealthStack} />
      <Tab.Screen name="Analytics"    component={AnalyticsStack} />
    </Tab.Navigator>
  );
}
