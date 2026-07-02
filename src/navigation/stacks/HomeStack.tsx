import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types';
import { DashboardScreen }        from '../../screens/dashboard/DashboardScreen';
import { HealthScoreDetailScreen } from '../../screens/home/HealthScoreDetailScreen';
import { SearchScreen }           from '../../screens/home/SearchScreen';
import { NotificationsSheet }     from '../../screens/home/NotificationsSheet';
import { ProfileScreen }          from '../../screens/profile/ProfileScreen';
import { EditProfileScreen }      from '../../screens/profile/EditProfileScreen';
import { DataExportScreen }       from '../../screens/profile/DataExportScreen';
import { SecuritySettingsScreen } from '../../screens/profile/SecuritySettingsScreen';
import { CurrencyPickerScreen }   from '../../screens/profile/CurrencyPickerScreen';
import { TransactionDetailScreen } from '../../screens/transactions/TransactionDetailScreen';
import { HelpSupportScreen }        from '../../screens/profile/HelpSupportScreen';
import { PrivacyPolicyScreen }      from '../../screens/profile/PrivacyPolicyScreen';
import { TermsOfServiceScreen }     from '../../screens/profile/TermsOfServiceScreen';
import { SetupPINScreen }              from '../../screens/profile/SetupPINScreen';
import { ChangePINScreen }             from '../../screens/profile/ChangePINScreen';
import { ChangePasswordScreen }        from '../../screens/profile/ChangePasswordScreen';
import { HealthScoreSettingsScreen }    from '../../screens/home/HealthScoreSettingsScreen';
import { DeleteAccountConfirmScreen }   from '../../screens/profile/DeleteAccountConfirmScreen';

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
      <Stack.Screen name="DataExport"        component={DataExportScreen} />
      <Stack.Screen name="SecuritySettings"  component={SecuritySettingsScreen} />
      <Stack.Screen name="CurrencyPicker"    component={CurrencyPickerScreen} />
      <Stack.Screen name="HelpSupport"       component={HelpSupportScreen} />
      <Stack.Screen name="PrivacyPolicy"     component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfService"    component={TermsOfServiceScreen} />
      <Stack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
      <Stack.Screen name="SetupPIN"             component={SetupPINScreen} />
      <Stack.Screen name="ChangePIN"            component={ChangePINScreen} />
      <Stack.Screen name="ChangePassword"       component={ChangePasswordScreen} />
      <Stack.Screen name="HealthScoreSettings"    component={HealthScoreSettingsScreen} />
      <Stack.Screen name="DeleteAccountConfirm"   component={DeleteAccountConfirmScreen} />
    </Stack.Navigator>
  );
}
