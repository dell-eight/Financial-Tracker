import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { BudgetStackParamList } from '../types';
import { BudgetScreen }               from '../../screens/budget/BudgetScreen';
import { BudgetSetupWizard }          from '../../screens/budget/BudgetSetupWizard';
import { CategoryBudgetDetailScreen } from '../../screens/budget/CategoryBudgetDetailScreen';
import { BudgetHistoryScreen }        from '../../screens/budget/BudgetHistoryScreen';
import { AlertSettingsScreen }        from '../../screens/budget/AlertSettingsScreen';

const Stack = createStackNavigator<BudgetStackParamList>();

export function BudgetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BudgetOverview"       component={BudgetScreen} />
      <Stack.Screen name="BudgetSetupWizard"    component={BudgetSetupWizard} />
      <Stack.Screen name="CategoryBudgetDetail" component={CategoryBudgetDetailScreen} />
      <Stack.Screen name="BudgetHistory"        component={BudgetHistoryScreen} />
      <Stack.Screen name="AlertSettings"        component={AlertSettingsScreen} />
    </Stack.Navigator>
  );
}
