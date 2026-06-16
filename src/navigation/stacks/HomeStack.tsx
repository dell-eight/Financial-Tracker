import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types';
import { DashboardScreen }        from '../../screens/dashboard/DashboardScreen';
import { HealthScoreDetailScreen } from '../../screens/home/HealthScoreDetailScreen';
import { SearchScreen }           from '../../screens/home/SearchScreen';
import { NotificationsSheet }     from '../../screens/home/NotificationsSheet';
import { ProfileScreen }          from '../../screens/profile/ProfileScreen';
import { EditProfileScreen }      from '../../screens/profile/EditProfileScreen';
import { MyAccountsScreen }           from '../../screens/profile/MyAccountsScreen';
import { AccountTransactionsScreen }  from '../../screens/profile/AccountTransactionsScreen';
import { DataExportScreen }       from '../../screens/profile/DataExportScreen';
import { SecuritySettingsScreen } from '../../screens/profile/SecuritySettingsScreen';
import { CurrencyPickerScreen }   from '../../screens/profile/CurrencyPickerScreen';
import { TransactionDetailScreen } from '../../screens/transactions/TransactionDetailScreen';

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"          component={DashboardScreen} />
      <Stack.Screen name="HealthScoreDetail" component={HealthScoreDetailScreen} />
      <Stack.Screen name="Search"            component={SearchScreen} />
      <Stack.Screen name="Notifications"     component={NotificationsSheet} />
      <Stack.Screen name="Profile"           component={ProfileScreen} />
      <Stack.Screen name="EditProfile"       component={EditProfileScreen} />
      <Stack.Screen name="MyAccounts"            component={MyAccountsScreen} />
      <Stack.Screen name="AccountTransactions"  component={AccountTransactionsScreen} />
      <Stack.Screen name="DataExport"        component={DataExportScreen} />
      <Stack.Screen name="SecuritySettings"  component={SecuritySettingsScreen} />
      <Stack.Screen name="CurrencyPicker"    component={CurrencyPickerScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </Stack.Navigator>
  );
}
