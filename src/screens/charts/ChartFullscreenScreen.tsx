import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../../hooks/ui/useTheme';
import { useMonthlyHistory, useWeeklyHistory, useNetWorthHistory } from '../../hooks/queries/useAnalytics';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { GroupedBarChart, type BarPoint } from '../../components/charts/GroupedBarChart';
import { SpendingLineChart, type LinePoint } from '../../components/charts/SpendingLineChart';
import { CategoryDonut, type CatStat } from '../../components/charts/CategoryDonut';
import { NetWorthChart } from '../../components/wealth/NetWorthChart';
import type { CategoryKey } from '../../theme';

const MIN_BAR_PT_W  = 52;
const MIN_LINE_PT_W = 38;
const HEADER_H      = 52;
const CTRL_H        = 44;

// Used by both AnalyticsStack and WealthStack — route params typed at call sites
export function ChartFullscreenScreen({ navigation, route }: any) {
  const { chartKey, period: initPeriod } = route.params as {
    chartKey: 'bar' | 'line' | 'donut' | 'networth';
    period:   string | number;
  };

  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme  = useTheme();
  const { colors, spacing, fontFamily, fontSize, borderRadius } = theme;

  // Force landscape on mount, restore portrait on unmount
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Local period state seeded from route param
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(
    typeof initPeriod === 'string' && ['weekly', 'monthly', 'yearly'].includes(initPeriod as string)
      ? (initPeriod as 'weekly' | 'monthly' | 'yearly')
      : 'monthly',
  );
  const [nwPeriod, setNwPeriod] = useState<6 | 12 | 24>(
    [6, 12, 24].includes(Number(initPeriod)) ? (Number(initPeriod) as 6 | 12 | 24) : 12,
  );

  // Data hooks — React Query cache hits from parent screens, no extra network
  const { data: monthlyHistory } = useMonthlyHistory(6);
  const { data: weeklyHistory  } = useWeeklyHistory();
  const { data: txns           } = useTransactions();
  const { data: nwHist         } = useNetWorthHistory(nwPeriod);

  // Derived bar/line data (same logic as AnalyticsScreen)
  const yearlyHistory = useMemo<BarPoint[]>(() => {
    const src = monthlyHistory ?? [];
    if (src.length === 0) return [];
    const quarters = new Map<string, BarPoint>();
    for (const m of src) {
      const qLabel = `Q${Math.ceil((src.indexOf(m) + 1) / 3)}'${new Date().getFullYear().toString().slice(2)}`;
      const cur = quarters.get(qLabel) ?? { label: qLabel, income: 0, expense: 0 };
      quarters.set(qLabel, { label: qLabel, income: cur.income + m.income, expense: cur.expense + m.expense });
    }
    return [...quarters.values()];
  }, [monthlyHistory]);

  const barData = useMemo<BarPoint[]>(() => {
    if (analyticsPeriod === 'weekly') return weeklyHistory ?? [];
    if (analyticsPeriod === 'yearly') return yearlyHistory;
    return (monthlyHistory ?? []).map(d => ({ label: d.label, income: d.income, expense: d.expense }));
  }, [analyticsPeriod, weeklyHistory, monthlyHistory, yearlyHistory]);

  const lineData = useMemo<LinePoint[]>(() => {
    if (analyticsPeriod === 'weekly') return (weeklyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
    if (analyticsPeriod === 'yearly') return yearlyHistory.map(d => ({ label: d.label, value: d.expense }));
    return (monthlyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
  }, [analyticsPeriod, weeklyHistory, monthlyHistory, yearlyHistory]);

  const monthCats = useMemo<CatStat[]>(() => {
    const now = new Date().toISOString().substring(0, 7);
    const expTxns = (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(now));
    const map = new Map<CategoryKey, Omit<CatStat, 'key'>>();
    for (const tx of expTxns) {
      const color = (theme.categoryColors[tx.category] as string) ?? '#6B7280';
      const curr  = map.get(tx.category) ?? { label: tx.categoryLabel, icon: tx.categoryIcon, amount: 0, color };
      map.set(tx.category, { ...curr, amount: curr.amount + tx.amount });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns, theme.categoryColors]);

  // Chart area — W & H reflect landscape dims after rotation
  const hasCtrl  = chartKey === 'bar' || chartKey === 'line' || chartKey === 'networth';
  const ctrlH    = hasCtrl ? CTRL_H : 0;
  const chartW   = W - insets.left - insets.right - 32;
  const chartH   = H - insets.top - insets.bottom - HEADER_H - ctrlH - 16;

  const chartTitle =
    chartKey === 'bar'      ? 'Income vs Expenses'
    : chartKey === 'line'   ? 'Spending Trends'
    : chartKey === 'donut'  ? 'Category Breakdown'
    : 'Net Worth Timeline';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.base }}>
      <StatusBar style={theme.statusBarStyle} hidden />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems:    'center',
        paddingLeft:   insets.left + 16,
        paddingRight:  insets.right + 16,
        height:        HEADER_H + insets.top,
        paddingTop:    insets.top,
      }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 64 }}>
          <Text style={{ color: colors.accent.primary, fontFamily: fontFamily.medium, fontSize: fontSize.bodyMd }}>
            ← Back
          </Text>
        </Pressable>
        <Text
          style={{ flex: 1, textAlign: 'center', fontFamily: fontFamily.semiBold, color: colors.text.primary, fontSize: fontSize.headingMd }}
          numberOfLines={1}
        >
          {chartTitle}
        </Text>
        <View style={{ minWidth: 64 }} />
      </View>

      {/* Period selector — analytics bar / line */}
      {(chartKey === 'bar' || chartKey === 'line') && (
        <View style={{ paddingLeft: insets.left + 16, height: CTRL_H, justifyContent: 'center' }}>
          <View style={{
            flexDirection: 'row', gap: spacing[1],
            backgroundColor: colors.bg.surfaceMuted,
            borderRadius: borderRadius.full, padding: 3, alignSelf: 'flex-start',
          }}>
            {(['weekly', 'monthly', 'yearly'] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => setAnalyticsPeriod(p)}
                style={{
                  paddingHorizontal: spacing[3], paddingVertical: 4,
                  borderRadius: borderRadius.full,
                  backgroundColor: analyticsPeriod === p ? colors.bg.surfaceRaised : 'transparent',
                }}
              >
                <Text style={{
                  fontSize:   fontSize.micro,
                  fontFamily: analyticsPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                  color:      analyticsPeriod === p ? colors.text.primary : colors.text.muted,
                }}>
                  {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'Year'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Period selector — net worth */}
      {chartKey === 'networth' && (
        <View style={{ paddingLeft: insets.left + 16, height: CTRL_H, justifyContent: 'center' }}>
          <View style={{
            flexDirection: 'row', gap: spacing[1],
            backgroundColor: colors.bg.surfaceMuted,
            borderRadius: borderRadius.full, padding: 3, alignSelf: 'flex-start',
          }}>
            {([6, 12, 24] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => setNwPeriod(p)}
                style={{
                  paddingHorizontal: spacing[3], paddingVertical: 4,
                  borderRadius: borderRadius.full,
                  backgroundColor: nwPeriod === p ? colors.bg.surfaceRaised : 'transparent',
                }}
              >
                <Text style={{
                  fontSize:   fontSize.micro,
                  fontFamily: nwPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                  color:      nwPeriod === p ? colors.text.primary : colors.text.muted,
                }}>
                  {p === 6 ? '6M' : p === 12 ? '1Y' : 'All'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Chart */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: insets.left + 16,
          paddingBottom:     insets.bottom + 8,
          alignItems:        'center',
        }}
      >
        {chartKey === 'bar' && (
          <GroupedBarChart
            data={barData}
            chartW={Math.max(chartW, barData.length * MIN_BAR_PT_W)}
            chartH={chartH}
          />
        )}
        {chartKey === 'line' && (
          <SpendingLineChart
            data={lineData}
            chartW={Math.max(chartW, lineData.length * MIN_LINE_PT_W)}
            chartH={chartH}
          />
        )}
        {chartKey === 'donut' && (
          <CategoryDonut data={monthCats} />
        )}
        {chartKey === 'networth' && (
          <NetWorthChart
            data={nwHist ?? []}
            width={Math.max(chartW, (nwHist ?? []).length * 32)}
            height={chartH}
          />
        )}
      </ScrollView>
    </View>
  );
}
