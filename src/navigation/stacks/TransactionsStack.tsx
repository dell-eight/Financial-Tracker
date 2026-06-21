import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { TransactionsStackParamList } from '../types';
import { ExpenseScreen }            from '../../screens/expenses/ExpenseScreen';
import { TransactionDetailScreen }  from '../../screens/transactions/TransactionDetailScreen';
import { AddExpenseScreen }         from '../../screens/transactions/AddExpenseScreen';
import { AddIncomeScreen }          from '../../screens/transactions/AddIncomeScreen';
import { FilterSheet }              from '../../screens/transactions/FilterSheet';
import { BulkEditScreen }           from '../../screens/transactions/BulkEditScreen';

const Stack = createStackNavigator<TransactionsStackParamList>();

export function TransactionsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TransactionList"   component={ExpenseScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="AddExpense"        component={AddExpenseScreen} />
      <Stack.Screen name="AddIncome"         component={AddIncomeScreen} />
      <Stack.Screen name="Filter"            component={FilterSheet} />
      <Stack.Screen name="BulkEdit"          component={BulkEditScreen} />
    </Stack.Navigator>
  );
}
