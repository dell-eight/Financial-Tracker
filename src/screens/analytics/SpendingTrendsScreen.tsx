import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine, Circle } from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useTransactions } from '../../hooks/queries/useTransactions';
import type { AnalyticsStackParamList } from '../../navigation/types';

type Props   = StackScreenProps<AnalyticsStackParamList, 'SpendingTrends'>;
type Period  = 'weekly' | 'monthly' | 'yearly';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 180;
const X_H     = 24;
const Y_W     = 40;
const Y_PAD   = 12;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MONTHLY_EXP = [
  { label: 'Jan', value: 3150 },
  { label: 'Feb', value: 2890 },
  { label: 'Mar', value: 3420 },
  { label: 'Apr', value: 2600 },
  { label: 'May', value: 2790 },
  { label: 'Jun', value: 2336 },
];

const WEEKLY_EXP = [
  { label: 'Mon', value: 99 },
  { label: 'Tue', value: 165 },
  { label: 'Wed', value: 112 },
  { label: 'Thu', value: 52 },
  { label: 'Fri', value: 118 },
  { label: 'Sat', value: 210 },
  { label: 'Sun', value: 88 },
];

const YEARLY_EXP = [
  { label: "Q1'25", value: 9460 },
  { label: "Q2'25", value: 8890 },
  { label: "Q3'25", value: 9100 },
  { label: "Q4'25", value: 10200 },
  { label: "Q1'26", value: 9460 },
  { label: "Q2'26", value: 7126 },
];

const DOW_BARS = [
  { label: 'Mon', pct: 0.32 },
  { label: 'Tue', pct: 0.54 },
  { label: 'Wed', pct: 0.37 },
  { label: 'Thu', pct: 0.17 },
  { label: 'Fri', pct: 0.39 },
  { label: 'Sat', pct: 0.69 },
  { label: 'Sun', pct: 0.29 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtK(n: number): string {
  if (n >= 1000) return `₱${(n / 1000).toFixed(1)}k`;
  return `₱${Math.round(n)}`;
}

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], t = 0.35;
    const cp1x = p.x + (c.x - p.x) * t;
    const cp2x = c.x - (c.x - p.x) * t;
    d += ` C${cp1x.toFixed(1)},${p.y.toFixed(1)} ${cp2x.toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return d;
}

// ─── SpendingChart ────────────────────────────────────────────────────────────

function SpendingChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const theme = useTheme();
  const { colors, fontFamily } = theme;
  const W = SCREEN_W - 40;
  const plotW = W - Y_W;
  const plotH = CHART_H - X_H - Y_PAD;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const yTicks = 4;
  const yStep  = Math.ceil(maxVal / yTicks / 100) * 100;
  const yMax   = yStep * yTicks;

  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * plotW,
    y: Y_PAD + (1 - d.value / yMax) * plotH,
    label: d.label, value: d.value,
  }));

  const line     = smoothPath(pts);
  const lastPt   = pts[pts.length - 1];
  const fillPath = line + ` L${lastPt.x.toFixed(1)},${(Y_PAD + plotH).toFixed(1)} L0,${(Y_PAD + plotH).toFixed(1)}Z`;

  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [data]);
  const revealStyle = useAnimatedStyle(() => ({ width: Math.max(1, reveal.value * plotW) }));

  return (
    <View style={{ width: W, height: CHART_H }}>
      {[0, 1, 2, 3, 4].map(i => {
        const v = i * yStep;
        const y = Y_PAD + (1 - v / yMax) * plotH;
        return (
          <Text key={i} style={{ position: 'absolute', left: 0, top: y - 7, width: Y_W - 4, textAlign: 'right', fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>
            {fmtK(v)}
          </Text>
        );
      })}
      <Animated.View style={[revealStyle, { position: 'absolute', left: Y_W, top: 0, height: CHART_H - X_H, overflow: 'hidden' }]}>
        <Svg width={plotW} height={CHART_H - X_H}>
          <Defs>
            <SvgGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.25" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          {[0, 1, 2, 3, 4].map(i => {
            const y = Y_PAD + (1 - (i * yStep) / yMax) * plotH;
            return <SvgLine key={i} x1={0} y1={y} x2={plotW} y2={y} stroke={colors.chart.gridLine} strokeWidth={1} strokeDasharray={i > 0 ? '4 4' : undefined} opacity={0.5} />;
          })}
          <Path d={fillPath} fill="url(#spendGrad)" />
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? color : colors.chart.dataPoint} stroke={colors.chart.dataPointBorder} strokeWidth={2} />
          ))}
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', left: Y_W, bottom: 0, width: plotW, height: X_H, flexDirection: 'row' }}>
        {data.map((d, i) => (
          <View key={i} style={{ position: 'absolute', left: (i / Math.max(data.length - 1, 1)) * plotW - 16, width: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SpendingTrendsScreen ─────────────────────────────────────────────────────

export function SpendingTrendsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: txns } = useTransactions();

  const [period, setPeriod] = useState<Period>('monthly');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const CURRENT_MONTH = new Date().toISOString().substring(0, 7);

  // Live category totals for current month
  const catTotals = useMemo(() => {
    const map = new Map<string, { label: string; icon: string; amount: number; color: string }>();
    const CAT_COLORS: Record<string, string> = {
      food: '#F97316', transport: '#3B82F6', shopping: '#EC4899',
      bills: '#EF4444', health: '#22C55E', entertainment: '#A855F7',
      education: '#14B8A6', other: '#6B7280',
    };
    for (const t of (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(CURRENT_MONTH))) {
      const cur = map.get(t.category) ?? { label: t.categoryLabel, icon: t.categoryIcon, amount: 0, color: CAT_COLORS[t.category] ?? '#6B7280' };
      map.set(t.category, { ...cur, amount: cur.amount + t.amount });
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [txns]);

  const totalSpend = useMemo(() => catTotals.reduce((s, c) => s + c.amount, 0), [catTotals]);
  const maxCat     = catTotals[0]?.amount ?? 1;

  const chartData = period === 'weekly' ? WEEKLY_EXP : period === 'yearly' ? YEARLY_EXP : MONTHLY_EXP;

  const prevTotal = period === 'monthly' ? 2790 : period === 'weekly' ? 844 : 46610;
  const delta     = totalSpend > 0 ? ((totalSpend - prevTotal) / prevTotal) * 100 : 0;
  const isDown    = delta <= 0;

  const PERIOD_LABELS: Record<Period, string> = { weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

  // Staggered card entrance
  const a = [0, 1, 2, 3, 4].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  const styles_a = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 16 }] })));

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Spending Trends</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Period selector */}
        <Animated.View style={[styles_a[0], { paddingHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={{ flexDirection: 'row', backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3 }}>
            {(['weekly', 'monthly', 'yearly'] as Period[]).map(p => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[{ flex: 1, height: 36, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: period === p ? colors.bg.surfaceRaised : 'transparent' }]}
              >
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: period === p ? fontFamily.semiBold : fontFamily.regular, color: period === p ? colors.text.primary : colors.text.muted, textTransform: 'capitalize' }}>
                  {p.replace('ly', '')}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View style={[styles_a[1], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              {PERIOD_LABELS[period]} Spending
            </Text>
            <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.expense, marginTop: spacing[1], letterSpacing: -1 }}>
              {fmt(period === 'monthly' ? totalSpend : period === 'weekly' ? 844 : 46610)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 4 }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isDown ? colors.income : colors.expense }}>
                {isDown ? '↓' : '↑'} {Math.abs(delta).toFixed(1)}%
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                vs {period === 'monthly' ? 'last month' : period === 'weekly' ? 'last week' : 'last year'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Spending chart */}
        <Animated.View style={[styles_a[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              {period === 'weekly' ? 'Daily Expenses' : period === 'yearly' ? 'Quarterly Expenses' : '6-Month Trend'}
            </Text>
            <SpendingChart data={chartData} color={colors.expense} />
          </View>
        </Animated.View>

        {/* Day of week pattern (monthly only) */}
        {period === 'monthly' && (
          <Animated.View style={[styles_a[3], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
                Spending by Day of Week
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6 }}>
                {DOW_BARS.map((d, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                    <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                      <View style={{ height: `${d.pct * 100}%`, backgroundColor: d.pct === Math.max(...DOW_BARS.map(x => x.pct)) ? colors.expense : colors.expense + '60', borderRadius: 4 }} />
                    </View>
                    <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.text.muted }}>{d.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3] }}>
                Saturdays have the highest spending on average.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Category breakdown */}
        <Animated.View style={[styles_a[4], { marginHorizontal: spacing[5] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              By Category {period === 'monthly' ? '(This Month)' : ''}
            </Text>
            {(catTotals.length > 0 ? catTotals : [
              { label: 'Bills & Utilities', icon: '💡', amount: 657, color: '#EF4444' },
              { label: 'Food & Dining',     icon: '🍔', amount: 276, color: '#F97316' },
              { label: 'Shopping',          icon: '🛍️', amount: 255, color: '#EC4899' },
              { label: 'Health',            icon: '💊', amount: 272, color: '#22C55E' },
              { label: 'Transport',         icon: '🚗', amount: 142, color: '#3B82F6' },
            ]).slice(0, 6).map((cat, i, arr) => (
              <View key={i} style={{ marginBottom: i < arr.length - 1 ? spacing[3] : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                  <Text style={{ fontSize: 14, marginRight: spacing[2] }}>{cat.icon}</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary }}>{cat.label}</Text>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{fmt(cat.amount)}</Text>
                </View>
                <View style={{ height: 5, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                  <View style={{ height: '100%', width: `${Math.min((cat.amount / (maxCat || 1)) * 100, 100)}%`, backgroundColor: cat.color, borderRadius: 99 }} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default SpendingTrendsScreen;
