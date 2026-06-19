import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
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

  // Chart fills the full safe area
  const chartW = W - insets.left - insets.right;
  const chartH = H - insets.top - insets.bottom;

  // Overlay safe-area offsets for floating controls
  const overlayTop   = insets.top   + 10;
  const overlayLeft  = insets.left  + 12;
  const overlayRight = insets.right + 12;

  return (
    <View style={[sc.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} hidden />

      {/* Chart — fills entire screen */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sc.chart}
        contentContainerStyle={{
          paddingHorizontal: insets.left + 16,
          paddingVertical:   insets.top + 16,
          alignItems:        'center',
        }}
      >
        {chartKey === 'bar' && (
          <GroupedBarChart
            data={barData}
            chartW={Math.max(chartW - 32, barData.length * MIN_BAR_PT_W)}
            chartH={chartH - 32}
          />
        )}
        {chartKey === 'line' && (
          <SpendingLineChart
            data={lineData}
            chartW={Math.max(chartW - 32, lineData.length * MIN_LINE_PT_W)}
            chartH={chartH - 32}
          />
        )}
        {chartKey === 'donut' && (
          <CategoryDonut data={monthCats} />
        )}
        {chartKey === 'networth' && (
          <NetWorthChart
            data={nwHist ?? []}
            width={Math.max(chartW - 32, (nwHist ?? []).length * 32)}
            height={chartH - 32}
          />
        )}
      </ScrollView>

      {/* Floating period selector — top-left */}
      {(chartKey === 'bar' || chartKey === 'line') && (
        <View style={[sc.pillOverlay, { top: overlayTop, left: overlayLeft }]}>
          <View style={{
            flexDirection: 'row', gap: spacing[1],
            backgroundColor: colors.bg.surface + 'E8',
            borderRadius: borderRadius.full, padding: 3,
          }}>
            {(['weekly', 'monthly', 'yearly'] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => setAnalyticsPeriod(p)}
                style={{
                  paddingHorizontal: spacing[3], paddingVertical: 5,
                  borderRadius: borderRadius.full,
                  backgroundColor: analyticsPeriod === p ? colors.accent.primary : 'transparent',
                }}
              >
                <Text style={{
                  fontSize:   fontSize.micro,
                  fontFamily: analyticsPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                  color:      analyticsPeriod === p ? '#FFFFFF' : colors.text.secondary,
                }}>
                  {p === 'weekly' ? 'Week' : p === 'monthly' ? 'Month' : 'Year'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {chartKey === 'networth' && (
        <View style={[sc.pillOverlay, { top: overlayTop, left: overlayLeft }]}>
          <View style={{
            flexDirection: 'row', gap: spacing[1],
            backgroundColor: colors.bg.surface + 'E8',
            borderRadius: borderRadius.full, padding: 3,
          }}>
            {([6, 12, 24] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => setNwPeriod(p)}
                style={{
                  paddingHorizontal: spacing[3], paddingVertical: 5,
                  borderRadius: borderRadius.full,
                  backgroundColor: nwPeriod === p ? colors.accent.primary : 'transparent',
                }}
              >
                <Text style={{
                  fontSize:   fontSize.micro,
                  fontFamily: nwPeriod === p ? fontFamily.semiBold : fontFamily.regular,
                  color:      nwPeriod === p ? '#FFFFFF' : colors.text.secondary,
                }}>
                  {p === 6 ? '6M' : p === 12 ? '1Y' : 'All'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* X close button — top-right */}
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        style={[
          sc.closeBtn,
          {
            top:             overlayTop,
            right:           overlayRight,
            backgroundColor: colors.bg.surface + 'E8',
            borderRadius:    borderRadius.full,
          },
        ]}
      >
        <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20 }}>✕</Text>
      </Pressable>
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  chart: {
    flex: 1,
  },
  pillOverlay: {
    position: 'absolute',
  },
  closeBtn: {
    position: 'absolute',
    width:    36,
    height:   36,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
