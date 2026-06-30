import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components';
import type { MainTabParamList } from './types';
import { HomeStack }         from './stacks/HomeStack';
import { TransactionsStack } from './stacks/TransactionsStack';
import { BudgetStack }       from './stacks/BudgetStack';
import { WealthStack }       from './stacks/WealthStack';
import { AnalyticsStack }    from './stacks/AnalyticsStack';
import { ErrorBoundary }     from '../components/common/ErrorBoundary';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator() {
  return (
    <ErrorBoundary>
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Transactions', { screen: 'TransactionList' });
          },
        })}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Budget', { screen: 'BudgetOverview' });
          },
        })}
      />
      <Tab.Screen
        name="Wealth"
        component={WealthStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Wealth', { screen: 'WealthMain' });
          },
        })}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Analytics', { screen: 'AnalyticsHome' });
          },
        })}
      />
    </Tab.Navigator>
    </ErrorBoundary>
  );
}
