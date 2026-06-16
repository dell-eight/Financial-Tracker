import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { WealthStackParamList } from '../types';
import { WealthScreen }                   from '../../screens/wealth/WealthScreen';
import { GoalDetailScreen }               from '../../screens/wealth/savings/GoalDetailScreen';
import { CreateGoalScreen }               from '../../screens/wealth/savings/CreateGoalScreen';
import { AddContributionScreen }          from '../../screens/wealth/savings/AddContributionScreen';
import { GoalAchievedScreen }             from '../../screens/wealth/savings/GoalAchievedScreen';
import { InvestmentAccountDetailScreen }  from '../../screens/wealth/investments/InvestmentAccountDetailScreen';
import { HoldingDetailScreen }            from '../../screens/wealth/investments/HoldingDetailScreen';
import { AddHoldingScreen }               from '../../screens/wealth/investments/AddHoldingScreen';
import { LogTransactionScreen }           from '../../screens/wealth/investments/LogTransactionScreen';
import { AllocationScreen }               from '../../screens/wealth/investments/AllocationScreen';
import { AssetsDetailScreen }             from '../../screens/wealth/networth/AssetsDetailScreen';
import { DebtsDetailScreen }              from '../../screens/wealth/networth/DebtsDetailScreen';
import { AccountTransactionsScreen }      from '../../screens/profile/AccountTransactionsScreen';
import { TransactionDetailScreen }        from '../../screens/transactions/TransactionDetailScreen';

const Stack = createStackNavigator<WealthStackParamList>();

export function WealthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WealthMain"              component={WealthScreen} />
      <Stack.Screen name="GoalDetail"              component={GoalDetailScreen} />
      <Stack.Screen name="CreateGoal"              component={CreateGoalScreen} />
      <Stack.Screen name="AddContribution"         component={AddContributionScreen} />
      <Stack.Screen name="GoalAchieved"            component={GoalAchievedScreen} />
      <Stack.Screen name="InvestmentAccountDetail" component={InvestmentAccountDetailScreen} />
      <Stack.Screen name="HoldingDetail"           component={HoldingDetailScreen} />
      <Stack.Screen name="AddHolding"              component={AddHoldingScreen} />
      <Stack.Screen name="LogTransaction"          component={LogTransactionScreen} />
      <Stack.Screen name="Allocation"              component={AllocationScreen} />
      <Stack.Screen name="AssetsDetail"            component={AssetsDetailScreen} />
      <Stack.Screen name="DebtsDetail"             component={DebtsDetailScreen} />
      <Stack.Screen name="AccountTransactions"     component={AccountTransactionsScreen} />
      <Stack.Screen name="TransactionDetail"       component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}
