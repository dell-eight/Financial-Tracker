import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
const PAD           = 20;

// Used by both AnalyticsStack and WealthStack — route params typed at call sites
export function ChartFullscreenScreen({ navigation, route }: any) {
  const { chartKey, period: initPeriod } = route.params as {
    chartKey: 'bar' | 'line' | 'donut' | 'networth';
    period:   string | number;
  };

  const { width: W } = useWindowDimensions();
  const insets        = useSafeAreaInsets();
  const theme         = useTheme();
  const { colors, spacing, fontFamily, fontSize, borderRadius } = theme;

  // Local period state seeded from route param
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'weekly' | 'monthly' | 'yearly'>(
    typeof initPeriod === 'string' && ['weekly', 'monthly', 'yearly'].includes(initPeriod as string)
      ? (initPeriod as 'weekly' | 'monthly' | 'yearly')
      : 'monthly',
  );
  const [nwPeriod, setNwPeriod] = useState<6 | 12 | 24>(
    [6, 12, 24].includes(Number(initPeriod)) ? (Number(initPeriod) as 6 | 12 | 24) : 12,
  );

  // Chart height driven by onLayout — stable 300 default prevents one-frame blank
  const [chartH, setChartH] = useState(300);

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

  // Chart width — explicit per chartKey; minDataW guards empty-dataset collapse
  const containerMinW = W;
  const minDataW      = Math.max(W - PAD * 2, 200);

  function getChartW(): number {
    switch (chartKey) {
      case 'bar':      return Math.max(minDataW, barData.length  * MIN_BAR_PT_W);
      case 'line':     return Math.max(minDataW, lineData.length * MIN_LINE_PT_W);
      case 'donut':    return minDataW;
      case 'networth': return Math.max(minDataW, (nwHist ?? []).length * 32);
    }
  }
  const chartW       = getChartW();
  const shouldScroll = chartW > W;

  const chartTitle = {
    bar:      'Income vs Expenses',
    line:     'Spending Trend',
    donut:    'Category Breakdown',
    networth: 'Net Worth',
  }[chartKey];

  return (
    <View style={[sc.root, {
      paddingTop:      insets.top + 6,
      paddingBottom:   insets.bottom,
      backgroundColor: colors.bg.base,
    }]}>
      <StatusBar style={theme.statusBarStyle} hidden />

      {/* Header — title + period pills on the left, ✕ on the right */}
      <View style={[sc.header, { paddingHorizontal: PAD }]}>
        <View style={sc.titleBlock}>
          <Text style={{
            fontFamily: fontFamily.semiBold,
            fontSize:   fontSize.headingMd,
            color:      colors.text.primary,
            lineHeight: 24,
          }}>
            {chartTitle}
          </Text>

          {/* Period pills — bar / line */}
          {(chartKey === 'bar' || chartKey === 'line') && (
            <View style={{
              flexDirection:   'row',
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.full,
              padding:         3,
              alignSelf:       'flex-start',
            }}>
              {(['weekly', 'monthly', 'yearly'] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setAnalyticsPeriod(p)}
                  style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical:   5,
                    borderRadius:      borderRadius.full,
                    backgroundColor:   analyticsPeriod === p ? colors.accent.primary : 'transparent',
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
          )}

          {/* Period pills — networth */}
          {chartKey === 'networth' && (
            <View style={{
              flexDirection:   'row',
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.full,
              padding:         3,
              alignSelf:       'flex-start',
            }}>
              {([6, 12, 24] as const).map(p => (
                <Pressable
                  key={p}
                  onPress={() => setNwPeriod(p)}
                  style={{
                    paddingHorizontal: spacing[3],
                    paddingVertical:   5,
                    borderRadius:      borderRadius.full,
                    backgroundColor:   nwPeriod === p ? colors.accent.primary : 'transparent',
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
          )}
        </View>

        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          style={[sc.closeBtn, {
            backgroundColor: colors.bg.surface,
            borderRadius:    borderRadius.full,
          }]}
          accessibilityRole="button"
          accessibilityLabel="Close chart"
        >
          <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20 }}>✕</Text>
        </Pressable>
      </View>

      {/* Chart area — flex fills all remaining space; onLayout measures real height */}
      <View
        style={sc.chartArea}
        onLayout={e => setChartH(e.nativeEvent.layout.height)}
      >
        <ScrollView
          horizontal={shouldScroll}
          scrollEnabled={shouldScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            minWidth:          containerMinW,
            paddingHorizontal: PAD,
            paddingVertical:   PAD,
            alignItems:        'center',
          }}
        >
          {chartKey === 'bar' && (
            <GroupedBarChart
              data={barData}
              chartW={chartW}
              chartH={chartH}
            />
          )}
          {chartKey === 'line' && (
            <SpendingLineChart
              data={lineData}
              chartW={chartW}
              chartH={chartH}
            />
          )}
          {chartKey === 'donut' && (
            <CategoryDonut data={monthCats} />
          )}
          {chartKey === 'networth' && (
            <NetWorthChart
              data={nwHist ?? []}
              width={chartW}
              height={chartH}
            />
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingVertical: 12,
  },
  titleBlock: {
    flex: 1,
    gap:  6,
  },
  chartArea: {
    flex: 1,
  },
  closeBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
    marginLeft:     12,
  },
});
