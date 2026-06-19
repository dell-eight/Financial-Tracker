import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AnalyticsStackParamList } from '../types';
import { AnalyticsScreen }           from '../../screens/analytics/AnalyticsScreen';
import { SpendingTrendsScreen }      from '../../screens/analytics/SpendingTrendsScreen';
import { IncomeAnalysisScreen }      from '../../screens/analytics/IncomeAnalysisScreen';
import { NetWorthGrowthScreen }      from '../../screens/analytics/NetWorthGrowthScreen';
import { ForecastScreen }            from '../../screens/analytics/ForecastScreen';
import { ChartFullscreenScreen }     from '../../screens/charts/ChartFullscreenScreen';

const Stack = createStackNavigator<AnalyticsStackParamList>();

export function AnalyticsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnalyticsHome"   component={AnalyticsScreen} />
      <Stack.Screen name="SpendingTrends"  component={SpendingTrendsScreen} />
      <Stack.Screen name="IncomeAnalysis"  component={IncomeAnalysisScreen} />
      <Stack.Screen name="NetWorthGrowth"  component={NetWorthGrowthScreen} />
      <Stack.Screen name="Forecast"        component={ForecastScreen} />
      <Stack.Screen name="ChartFullscreen" component={ChartFullscreenScreen} />
    </Stack.Navigator>
  );
}
