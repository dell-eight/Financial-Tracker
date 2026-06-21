import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';

import { useChartModalStore } from '../../store/chartModal.store';
import { useTheme }           from '../../hooks/ui/useTheme';
import { useTransactions }   from '../../hooks/queries/useTransactions';
import { useBudgets }        from '../../hooks/queries/useBudgets';
import { useMonthlyHistory, useWeeklyHistory } from '../../hooks/queries/useAnalytics';
import { AnalyticsCard, ChartCard, SectionHeader } from '../../components';
import { getCategoryBgColor } from '../../theme';
import type { AnalyticsStackParamList } from '../../navigation/types';
import type { CategoryKey } from '../../theme';
import { useCurrency } from '../../utils/currency';
import { GroupedBarChart } from '../../components/charts/GroupedBarChart';
import { SpendingLineChart } from '../../components/charts/SpendingLineChart';
import { CategoryDonut } from '../../components/charts/CategoryDonut';

type Props   = StackScreenProps<AnalyticsStackParamList, 'AnalyticsHome'>;
type Period  = 'weekly' | 'monthly' | 'yearly';

const _CURRENT_MONTH = new Date().toISOString().substring(0, 7);

// Chart height constants
const LINE_H = 220;
const BAR_H  = 200;

// Minimum px per data point — drives horizontal scroll width for bar charts with many points
const MIN_BAR_PT_W = 52;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BarPoint   { label: string; income: number; expense: number }
interface LinePoint  { label: string; value: number }
interface MonthPoint extends BarPoint { savings: number; month: string }

interface CatStat {
  key:    CategoryKey;
  label:  string;
  icon:   string;
  amount: number;
  color:  string;
}

interface PeriodMeta {
  total:             string;
  income:            string;
  net:               string;
  delta:             string;
  vsLabel:           string;
  savingsRate:       number;
  // null = no prior-period income data; suppress the delta badge
  prevSavingsRate:   number | null;
  hasIncome:         boolean;
  thisMonthSavings:  number;
  ytdSavings:        number;
  avgSavings:        number;
}

// ─── TopCategoriesCard ──────────────────────────────────────────────────────────

function TopCategoriesCard({ data }: { data: CatStat[] }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt: fmtFull } = useCurrency();

  const maxAmt = Math.max(...data.map(d => d.amount), 1);
  const top5   = [...data].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <View
      style={[
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
      ]}
    >
      <SectionHeader title="Top Spending" style={{ marginBottom: spacing[4] }} />

      {top5.map((d, i) => {
        const pct = d.amount / maxAmt;
        return (
          <View key={d.key} style={{ marginBottom: i < top5.length - 1 ? spacing[4] : 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[1] }}>
              {/* Rank badge */}
              <View
                style={{
                  width:           22,
                  height:          22,
                  borderRadius:    11,
                  backgroundColor: i === 0 ? colors.accent.primary : colors.bg.surfaceMuted,
                  alignItems:      'center',
                  justifyContent:  'center',
                  marginRight:     spacing[3],
                  flexShrink:      0,
                }}
              >
                <Text
                  style={{
                    fontSize:   9,
                    fontFamily: fontFamily.bold,
                    color:      i === 0 ? '#FFF' : colors.text.muted,
                    lineHeight: 12,
                  }}
                >
                  {i + 1}
                </Text>
              </View>

              {/* Category icon */}
              <View
                style={{
                  width:          32,
                  height:         32,
                  borderRadius:   16,
                  backgroundColor: getCategoryBgColor(d.key),
                  alignItems:     'center',
                  justifyContent: 'center',
                  marginRight:    spacing[3],
                  flexShrink:     0,
                }}
              >
                <Text style={{ fontSize: 15, lineHeight: 20 }}>{d.icon}</Text>
              </View>

              {/* Name + amount */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text
                    style={{
                      fontSize:   fontSize.bodyMd,
                      fontFamily: fontFamily.medium,
                      color:      colors.text.primary,
                    }}
                    numberOfLines={1}
                  >
                    {d.label}
                  </Text>
                  <Text
                    style={{
                      fontSize:   fontSize.bodyMd,
                      fontFamily: fontFamily.semiBold,
                      color:      colors.text.primary,
                    }}
                  >
                    {fmtFull(d.amount)}
                  </Text>
                </View>

                {/* Progress bar */}
                <View
                  style={{
                    height:          5,
                    backgroundColor: colors.bg.surfaceMuted,
                    borderRadius:    borderRadius.full,
                    overflow:        'hidden',
                  }}
                >
                  <View
                    style={{
                      width:           `${pct * 100}%`,
                      height:          '100%',
                      backgroundColor: d.color,
                      borderRadius:    borderRadius.full,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── SavingsCard ────────────────────────────────────────────────────────────────

function SavingsCard({
  rate, prevRate, history, hasIncome,
  thisMonthSavings, ytdSavings, avgSavings,
}: {
  rate:              number;
  prevRate:          number | null; // null = no prior-period income data
  history:           MonthPoint[];  // sparkline only
  hasIncome:         boolean;
  thisMonthSavings:  number;
  ytdSavings:        number;
  avgSavings:        number;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact } = useCurrency();

  const [sparkIdx, setSparkIdx] = useState<number | null>(null);

  const showDelta = prevRate !== null;
  const delta     = showDelta ? rate - prevRate : 0;
  const positive  = delta >= 0;
  // Use absolute values so negative-savings months still render proportional bars
  const absMax = Math.max(...history.map(h => Math.abs(h.savings)), 1);
  // Color-code the rate: green ≥20%, amber 0–20%, red <0%
  const rateColor = !hasIncome
    ? colors.text.muted
    : rate >= 20
      ? colors.income
      : rate >= 0
        ? colors.warning
        : colors.expense;

  return (
    <View
      style={[
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Rate + delta */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.medium,
              color:      colors.text.muted,
              marginBottom: spacing[1],
            }}
          >
            Savings Rate
          </Text>
          {hasIncome ? (
            <Text
              style={{
                fontSize:      38,
                fontFamily:    fontFamily.bold,
                color:         rateColor,
                letterSpacing: -1,
                lineHeight:    46,
              }}
            >
              {rate.toFixed(1)}%
            </Text>
          ) : (
            <Text
              style={{
                fontSize:   fontSize.bodyMd,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  spacing[2],
              }}
            >
              No income tracked
            </Text>
          )}
          {showDelta && (
            <View
              style={{
                alignSelf:         'flex-start',
                flexDirection:     'row',
                alignItems:        'center',
                gap:               4,
                backgroundColor:   positive ? colors.incomeBg : colors.expenseBg,
                borderRadius:      borderRadius.full,
                paddingHorizontal: spacing[2],
                paddingVertical:   3,
                marginTop:         spacing[1.5],
              }}
            >
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.medium,
                  color:      positive ? colors.income : colors.expense,
                }}
              >
                {positive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs prev
              </Text>
            </View>
          )}
        </View>

        {/* Sparkline (savings by month) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64, paddingBottom: 2, position: 'relative' }}>
          {/* Dismiss layer */}
          <Pressable
            onPress={() => setSparkIdx(null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          {history.map((h, i) => {
            const bh     = Math.max(4, (Math.abs(h.savings) / absMax) * 56);
            const isLast = i === history.length - 1;
            const isPos  = h.savings >= 0;
            return (
              <Pressable
                key={i}
                onPress={() => setSparkIdx(prev => prev === i ? null : i)}
                style={{ alignSelf: 'stretch', width: 10, justifyContent: 'flex-end' }}
              >
                <View
                  style={{
                    width:                10,
                    height:               bh,
                    backgroundColor:      sparkIdx !== null && sparkIdx !== i
                      ? (isPos ? colors.bg.surfaceMuted : colors.expense + '30')
                      : isLast
                        ? (isPos ? colors.accent.primary : colors.expense)
                        : (isPos ? colors.bg.surfaceMuted : colors.expense + '50'),
                    borderTopLeftRadius:  3,
                    borderTopRightRadius: 3,
                    opacity:              sparkIdx !== null && sparkIdx !== i
                      ? 0.3
                      : isLast ? 1 : 0.65 + i * 0.05,
                  }}
                />
              </Pressable>
            );
          })}

          {/* Tooltip — overlays top of sparkline container */}
          {sparkIdx !== null && (() => {
            const h  = history[sparkIdx];
            const isPos = h.savings >= 0;
            // center on tapped bar: each bar is 10px wide + 4px gap
            const barCenterX = sparkIdx * 14 + 5;
            const sparkW     = history.length * 10 + Math.max(0, history.length - 1) * 4;
            const TW         = 76;
            const left       = Math.max(0, Math.min(barCenterX - TW / 2, sparkW - TW));
            return (
              <View
                pointerEvents="none"
                style={{
                  position:          'absolute',
                  top:               0,
                  left,
                  width:             TW,
                  backgroundColor:   colors.bg.surface,
                  borderRadius:      6,
                  borderWidth:       1,
                  borderColor:       colors.border.subtle,
                  paddingHorizontal: 6,
                  paddingVertical:   4,
                  shadowColor:       '#000',
                  shadowOffset:      { width: 0, height: 1 },
                  shadowOpacity:     0.08,
                  shadowRadius:      3,
                  elevation:         2,
                }}
              >
                <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                  {h.label}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: isPos ? colors.income : colors.expense }}>
                  {isPos ? '+' : ''}{fmtCompact(h.savings)}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection:   'row',
          marginTop:       spacing[5],
          paddingTop:      spacing[4],
          borderTopWidth:  1,
          borderTopColor:  colors.border.subtle,
          gap:             spacing[4],
        }}
      >
        {[
          { label: 'This Month', value: fmt(thisMonthSavings), color: thisMonthSavings >= 0 ? colors.income         : colors.expense },
          { label: 'YTD Total',  value: fmt(ytdSavings),       color: ytdSavings       >= 0 ? colors.accent.primary : colors.expense },
          { label: 'Monthly Avg',value: fmt(avgSavings),        color: avgSavings       >= 0 ? colors.text.secondary : colors.expense },
        ].map(({ label, value, color }) => (
          <View key={label} style={{ flex: 1 }}>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginBottom: 3,
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontSize:   fontSize.bodyMd,
                fontFamily: fontFamily.semiBold,
                color,
                lineHeight: 20,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── BudgetPerformanceCard ──────────────────────────────────────────────────────

interface BudgetPerfItem {
  id:    string;
  key:   CategoryKey;
  label: string;
  color: string;
  spent: number;
  limit: number;
}

function BudgetPerformanceCard({ data }: { data: BudgetPerfItem[] }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt: fmtFull } = useCurrency();

  return (
    <View
      style={[
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
      ]}
    >
      <SectionHeader title="Budget Performance" style={{ marginBottom: spacing[4] }} />

      {data.map((item, i) => {
        const ratio = item.spent / item.limit;
        const pct   = Math.min(ratio, 1) * 100;
        const over  = ratio > 1;
        const barColor = over
          ? colors.expense
          : ratio >= 0.9
            ? colors.warning
            : colors.accent.primary;

        return (
          <View key={item.id} style={{ marginBottom: i < data.length - 1 ? spacing[4] : 0 }}>
            {/* Label row */}
            <View
              style={{
                flexDirection:  'row',
                justifyContent: 'space-between',
                alignItems:     'center',
                marginBottom:   spacing[1],
              }}
            >
              <Text
                style={{
                  fontSize:   fontSize.bodyMd,
                  fontFamily: fontFamily.medium,
                  color:      colors.text.primary,
                }}
              >
                {item.label}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Text
                  style={{
                    fontSize:   fontSize.bodySm,
                    fontFamily: fontFamily.regular,
                    color:      colors.text.muted,
                  }}
                >
                  {fmtFull(item.spent)} / {fmtFull(item.limit)}
                </Text>
                {over && (
                  <View
                    style={{
                      backgroundColor:   colors.expenseBg,
                      borderRadius:      borderRadius.full,
                      paddingHorizontal: 6,
                      paddingVertical:   2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize:   9,
                        fontFamily: fontFamily.bold,
                        color:      colors.expense,
                        lineHeight: 13,
                      }}
                    >
                      OVER
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Progress track */}
            <View
              style={{
                height:          6,
                backgroundColor: colors.bg.surfaceMuted,
                borderRadius:    borderRadius.full,
                overflow:        'hidden',
              }}
            >
              <View
                style={{
                  width:           `${pct}%`,
                  height:          '100%',
                  backgroundColor: barColor,
                  borderRadius:    borderRadius.full,
                }}
              />
            </View>

            {/* Over-budget overflow tint */}
            {over && (
              <View
                style={{
                  position:        'absolute',
                  right:           0,
                  bottom:          0,
                  height:          6,
                  width:           `${Math.min((ratio - 1) * 100 * 2, 18)}%`,
                  backgroundColor: colors.expense,
                  borderRadius:    borderRadius.full,
                  opacity:         0.35,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

// ─── AnalyticsScreen ────────────────────────────────────────────────────────────

export function AnalyticsScreen({ navigation }: Props) {
  const openModal = useChartModalStore(s => s.open);
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows, categoryColors } = theme;
  const { fmt: fmtFull } = useCurrency();

  const { data: txns }          = useTransactions();
  const { data: budgets }       = useBudgets();
  const { data: monthlyHistory } = useMonthlyHistory(6);
  const { data: weeklyHistory }  = useWeeklyHistory();

  const [period, setPeriod] = useState<Period>('monthly');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // ── Derived data from queries ─────────────────────────────────────────────

  const monthCats = useMemo<CatStat[]>(() => {
    const expTxns = (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(_CURRENT_MONTH));
    const map = new Map<CategoryKey, Omit<CatStat, 'key'>>();
    for (const tx of expTxns) {
      const color = categoryColors[tx.category] ?? '#6B7280';
      const curr  = map.get(tx.category) ?? { label: tx.categoryLabel, icon: tx.categoryIcon, amount: 0, color };
      map.set(tx.category, { ...curr, amount: curr.amount + tx.amount });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns, categoryColors]);

  const budgetPerfData = useMemo<BudgetPerfItem[]>(() => {
    return (budgets ?? []).map(b => ({
      id:    b.id,
      key:   b.category,
      label: b.label.split(' ')[0],
      color: b.color,
      spent: b.spent,
      limit: b.limit,
    }));
  }, [budgets]);

  // Build quarterly history from monthly data for yearly view
  const yearlyHistory = useMemo<BarPoint[]>(() => {
    const src = monthlyHistory ?? [];
    if (src.length === 0) return [];
    const quarters = new Map<string, BarPoint>();
    for (const m of src) {
      // Find the data's actual date by position (approximation using index order)
      const qLabel = `Q${Math.ceil((src.indexOf(m) + 1) / 3)}'${new Date().getFullYear().toString().slice(2)}`;
      const cur = quarters.get(qLabel) ?? { label: qLabel, income: 0, expense: 0 };
      quarters.set(qLabel, { label: qLabel, income: cur.income + m.income, expense: cur.expense + m.expense });
    }
    return [...quarters.values()];
  }, [monthlyHistory]);

  const meta = useMemo<PeriodMeta>(() => {
    if (period === 'weekly') {
      const wk = weeklyHistory ?? [];
      const income  = wk.reduce((s, d) => s + d.income,  0);
      const expense = wk.reduce((s, d) => s + d.expense, 0);
      const net     = income - expense;
      const sr      = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
      const mhW     = monthlyHistory ?? [];
      const ytdW    = mhW.reduce((s, h) => s + h.savings, 0);
      const avgW    = mhW.length > 0 ? Math.round(ytdW / mhW.length) : 0;
      return { total: fmtFull(expense), income: fmtFull(income), net: fmtFull(Math.max(0, net)), delta: '—', vsLabel: 'this week', savingsRate: sr, prevSavingsRate: null, hasIncome: income > 0, thisMonthSavings: mhW[mhW.length - 1]?.savings ?? 0, ytdSavings: ytdW, avgSavings: avgW };
    }
    if (period === 'yearly') {
      const hist    = monthlyHistory ?? [];
      const income  = hist.reduce((s, d) => s + d.income,  0);
      const expense = hist.reduce((s, d) => s + d.expense, 0);
      const net     = income - expense;
      const sr      = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
      const ytdY    = hist.reduce((s, h) => s + h.savings, 0);
      const avgY    = hist.length > 0 ? Math.round(ytdY / hist.length) : 0;
      return { total: fmtFull(expense), income: fmtFull(income), net: fmtFull(Math.max(0, net)), delta: '—', vsLabel: 'last 6 months', savingsRate: sr, prevSavingsRate: null, hasIncome: income > 0, thisMonthSavings: hist[hist.length - 1]?.savings ?? 0, ytdSavings: ytdY, avgSavings: avgY };
    }
    // monthly
    const monthExpense = (txns ?? [])
      .filter(t => t.type === 'expense' && t.date.startsWith(_CURRENT_MONTH))
      .reduce((s, t) => s + t.amount, 0);
    const monthIncome = (txns ?? [])
      .filter(t => t.type === 'income' && t.date.startsWith(_CURRENT_MONTH))
      .reduce((s, t) => s + t.amount, 0);
    const net             = monthIncome - monthExpense;
    const savingsRate     = monthIncome > 0 ? Math.round((net / monthIncome) * 1000) / 10 : 0;
    const hist            = monthlyHistory ?? [];
    const prev            = hist.length >= 2 ? hist[hist.length - 2] : null;
    const prevExp         = prev?.expense ?? 0;
    const deltaVal        = prevExp > 0 ? ((monthExpense - prevExp) / prevExp) * 100 : 0;
    const deltaStr        = prevExp > 0 ? `${Math.abs(deltaVal).toFixed(1)}% ${deltaVal <= 0 ? 'less' : 'more'}` : '—';
    // null when no prior-period income — suppresses the savings delta badge
    const prevSR          = prev && prev.income > 0 ? Math.round(((prev.income - prev.expense) / prev.income) * 1000) / 10 : null;
    // Use live net for current month; exclude the current-month DB entry (partial/stale) when summing completed months
    const completedMonths = hist.filter(h => !h.month.startsWith(_CURRENT_MONTH));
    const ytdM            = completedMonths.reduce((s, h) => s + h.savings, 0) + net;
    const avgM            = Math.round(ytdM / (completedMonths.length + 1));
    return {
      total:            fmtFull(monthExpense),
      income:           fmtFull(monthIncome),
      net:              fmtFull(Math.max(0, net)),
      delta:            deltaStr,
      vsLabel:          prev ? `vs ${prev.label}` : '',
      savingsRate,
      prevSavingsRate:  prevSR,
      hasIncome:        monthIncome > 0,
      thisMonthSavings: net,
      ytdSavings:       ytdM,
      avgSavings:       avgM,
    };
  }, [period, txns, monthlyHistory, weeklyHistory]);

  const PAD = spacing[5];

  const barData = useMemo<BarPoint[]>(() => {
    if (period === 'weekly')  return weeklyHistory  ?? [];
    if (period === 'yearly')  return yearlyHistory;
    return (monthlyHistory ?? []).map(d => ({ label: d.label, income: d.income, expense: d.expense }));
  }, [period, weeklyHistory, monthlyHistory, yearlyHistory]);

  const lineData = useMemo<LinePoint[]>(() => {
    if (period === 'weekly')  return (weeklyHistory  ?? []).map(d => ({ label: d.label, value: d.expense }));
    if (period === 'yearly')  return yearlyHistory.map(d => ({ label: d.label, value: d.expense }));
    return (monthlyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
  }, [period, weeklyHistory, monthlyHistory, yearlyHistory]);

  // ── Entrance animations ────────────────────────────────────────────────────
  const a0 = useSharedValue(0);
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);
  const a4 = useSharedValue(0);
  const a5 = useSharedValue(0);
  const a6 = useSharedValue(0);
  const a7 = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    a0.value = withDelay(0,   withTiming(1, { duration: 400, easing: e }));
    a1.value = withDelay(60,  withTiming(1, { duration: 440, easing: e }));
    a2.value = withDelay(120, withTiming(1, { duration: 440, easing: e }));
    a3.value = withDelay(180, withTiming(1, { duration: 440, easing: e }));
    a4.value = withDelay(240, withTiming(1, { duration: 440, easing: e }));
    a5.value = withDelay(300, withTiming(1, { duration: 440, easing: e }));
    a6.value = withDelay(360, withTiming(1, { duration: 440, easing: e }));
    a7.value = withDelay(420, withTiming(1, { duration: 440, easing: e }));
  }, []);

  const s0 = useAnimatedStyle(() => ({ opacity: a0.value, transform: [{ translateY: interpolate(a0.value, [0, 1], [12, 0]) }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: a1.value, transform: [{ translateY: interpolate(a1.value, [0, 1], [20, 0]) }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: a2.value, transform: [{ translateY: interpolate(a2.value, [0, 1], [20, 0]) }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: a3.value, transform: [{ translateY: interpolate(a3.value, [0, 1], [20, 0]) }] }));
  const s4 = useAnimatedStyle(() => ({ opacity: a4.value, transform: [{ translateY: interpolate(a4.value, [0, 1], [20, 0]) }] }));
  const s5 = useAnimatedStyle(() => ({ opacity: a5.value, transform: [{ translateY: interpolate(a5.value, [0, 1], [20, 0]) }] }));
  const s6 = useAnimatedStyle(() => ({ opacity: a6.value, transform: [{ translateY: interpolate(a6.value, [0, 1], [20, 0]) }] }));
  const s7 = useAnimatedStyle(() => ({ opacity: a7.value, transform: [{ translateY: interpolate(a7.value, [0, 1], [20, 0]) }] }));

  return (
    <View style={[sc.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop:    topPad + spacing[2],
          paddingBottom: btmPad + spacing[8],
        }}
      >
        {/* ── 0. Screen header ──────────────────────────────────────────────── */}
        <Animated.View
          style={[
            s0,
            sc.headerRow,
            { paddingHorizontal: PAD, marginBottom: spacing[5] },
          ]}
        >
          <View>
            <Text
              style={{
                fontSize:      fontSize.headingLg,
                fontFamily:    fontFamily.bold,
                color:         colors.text.primary,
                letterSpacing: -0.4,
                lineHeight:    28,
              }}
            >
              Analytics
            </Text>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  2,
              }}
            >
              Financial insights overview
            </Text>
          </View>

          <Pressable
            style={[
              shadows.sm,
              {
                width:           40,
                height:          40,
                borderRadius:    borderRadius.full,
                backgroundColor: colors.bg.surface,
                alignItems:      'center',
                justifyContent:  'center',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share report"
          >
            <Text style={{ fontSize: 17, lineHeight: 20, color: colors.text.secondary }}>↗</Text>
          </Pressable>
        </Animated.View>

        {/* ── 0b. Deep-dive quick links ─────────────────────────────────────── */}
        <Animated.View style={[s0, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {([
              { label: 'Spending Trends', icon: '📉', screen: 'SpendingTrends' },
              { label: 'Income Analysis', icon: '💰', screen: 'IncomeAnalysis'  },
              { label: 'Net Worth Growth',icon: '📈', screen: 'NetWorthGrowth'  },
              { label: 'Forecast',        icon: '🔮', screen: 'Forecast'        },
            ] as const).map(item => (
              <Pressable
                key={item.screen}
                onPress={() => navigation.push(item.screen)}
                style={({ pressed }) => [{
                  flexDirection: 'row', alignItems: 'center', gap: spacing[1],
                  paddingVertical: 7, paddingHorizontal: spacing[3],
                  backgroundColor: pressed ? colors.bg.surfaceRaised : colors.bg.surface,
                  borderRadius: borderRadius.full,
                  borderWidth: 1, borderColor: colors.border.subtle,
                }]}
              >
                <Text style={{ fontSize: 12 }}>{item.icon}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* ── 1. Total Spending (AnalyticsCard hero) ─────────────────────────── */}
        <Animated.View style={[s1, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <AnalyticsCard
            title="Total Spending"
            totalAmount={meta.total}
            delta={meta.delta}
            deltaPositive={false}
            period={period}
            onPeriodChange={(p) => setPeriod(p)}
          >
            {/* Income + Net inline summary */}
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              {([
                {
                  label: 'Total Income',
                  value: meta.income,
                  color: colors.income,
                  bg:    colors.incomeBg,
                  icon:  '↑',
                },
                {
                  label: 'Net Savings',
                  value: meta.net,
                  color: colors.accent.primary,
                  bg:    colors.accent.muted,
                  icon:  '=',
                },
              ] as const).map(({ label, value, color, bg, icon }) => (
                <View
                  key={label}
                  style={[
                    shadows.sm,
                    {
                      flex:            1,
                      backgroundColor: colors.bg.surfaceRaised,
                      borderRadius:    borderRadius.lg,
                      padding:         spacing[3],
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems:    'center',
                      gap:           6,
                      marginBottom:  spacing[1],
                    }}
                  >
                    <View
                      style={{
                        width:          20,
                        height:         20,
                        borderRadius:   10,
                        backgroundColor: bg as string,
                        alignItems:     'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize:   11,
                          fontFamily: fontFamily.bold,
                          color:      color as string,
                          lineHeight: 14,
                        }}
                      >
                        {icon}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize:   10,
                        fontFamily: fontFamily.medium,
                        color:      colors.text.muted,
                      }}
                    >
                      {label}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize:      fontSize.headingMd,
                      fontFamily:    fontFamily.bold,
                      color:         colors.text.primary,
                      letterSpacing: -0.3,
                      lineHeight:    24,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {value}
                  </Text>
                </View>
              ))}
            </View>

            <Text
              style={{
                fontSize:   10,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  spacing[3],
              }}
            >
              {meta.vsLabel}
            </Text>
          </AnalyticsCard>
        </Animated.View>

        {/* ── 2. Income vs Expenses grouped bar chart ─────────────────────────── */}
        <Animated.View style={[s2, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <ChartCard
            title="Income vs Expenses"
            subtitle={
              period === 'weekly' ? 'This week, daily'
              : period === 'yearly' ? 'By quarter'
              : 'Last 6 months'
            }
            minHeight={BAR_H + 80}
            scrollable
            chartHeight={BAR_H}
          >
            {(w) => {
              const effectiveW = Math.max(w, barData.length * MIN_BAR_PT_W);
              return <GroupedBarChart data={barData} chartW={effectiveW} animDelay={120} />;
            }}
          </ChartCard>
        </Animated.View>

        {/* ── 3. Spending Trends line chart ────────────────────────────────────── */}
        <Animated.View style={[s3, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <ChartCard
            title="Spending Trends"
            subtitle={
              period === 'weekly' ? 'Daily expense this week'
              : period === 'yearly' ? 'Quarterly expense trend'
              : 'Monthly expense trend'
            }
            minHeight={LINE_H + 40}
            chartHeight={LINE_H}
            scrollable
          >
            {(w) => <SpendingLineChart data={lineData} chartW={Math.max(w, lineData.length * 40)} animDelay={200} />}
          </ChartCard>
        </Animated.View>

        {/* ── 4. Category breakdown donut ──────────────────────────────────────── */}
        <Animated.View style={[s4, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <ChartCard
            title="Category Breakdown"
            subtitle="Tap a segment to inspect"
            minHeight={164 + 80}
          >
            <CategoryDonut data={monthCats} animDelay={260} />
          </ChartCard>
        </Animated.View>

        {/* ── 5. Top spending categories ───────────────────────────────────────── */}
        <Animated.View style={[s5, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <TopCategoriesCard data={monthCats} />
        </Animated.View>

        {/* ── 6. Savings performance ───────────────────────────────────────────── */}
        <Animated.View style={[s6, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <SavingsCard
            rate={meta.savingsRate}
            prevRate={meta.prevSavingsRate}
            history={monthlyHistory ?? []}
            hasIncome={meta.hasIncome}
            thisMonthSavings={meta.thisMonthSavings}
            ytdSavings={meta.ytdSavings}
            avgSavings={meta.avgSavings}
          />
        </Animated.View>

        {/* ── 7. Budget performance ────────────────────────────────────────────── */}
        <Animated.View style={[s7, { paddingHorizontal: PAD }]}>
          <BudgetPerformanceCard data={budgetPerfData} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
});

export default AnalyticsScreen;
