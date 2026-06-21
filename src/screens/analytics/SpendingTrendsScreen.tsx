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
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Line as SvgLine, Circle, Rect } from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme }        from '../../hooks/ui/useTheme';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useMonthlyHistory, useWeeklyHistory } from '../../hooks/queries/useAnalytics';
import type { AnalyticsStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';
import { spendingTicks } from '../../utils/chartUtils';

type Props   = StackScreenProps<AnalyticsStackParamList, 'SpendingTrends'>;
type Period  = 'weekly' | 'monthly' | 'yearly';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_H = 220;
const X_H     = 24;
const Y_W     = 40;
const Y_PAD   = 12;


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

function SpendingChart({ data, color, width }: { data: { label: string; value: number }[]; color: string; width: number }) {
  const theme = useTheme();
  const { colors, fontFamily } = theme;
  const { fmtCompact: fmtK, fmt } = useCurrency();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const W = width;
  const plotW = W - Y_W;
  const plotH = CHART_H - X_H - Y_PAD;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const ticks  = spendingTicks(maxVal);
  const yMax   = ticks[ticks.length - 1];

  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * plotW,
    y: Y_PAD + (1 - d.value / yMax) * plotH,
    label: d.label, value: d.value,
  }));

  const hasPts   = pts.length >= 2;
  const line     = hasPts ? smoothPath(pts) : '';
  const lastPt   = pts[pts.length - 1] ?? { x: 0, y: Y_PAD + plotH };
  const fillPath = hasPts
    ? line + ` L${lastPt.x.toFixed(1)},${(Y_PAD + plotH).toFixed(1)} L0,${(Y_PAD + plotH).toFixed(1)}Z`
    : '';

  const reveal = useSharedValue(0);
  useEffect(() => {
    setSelectedIdx(null);
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [data]);
  const revealStyle = useAnimatedStyle(() => ({ width: Math.max(1, reveal.value * plotW) }));

  // Pre-compute tooltip position in parent View coordinates
  let tooltipLeft  = 0;
  let tooltipTop   = 0;
  let tooltipW     = 108;
  let tooltipLabel = '';
  let tooltipValue = '';

  if (selectedIdx !== null && pts[selectedIdx]) {
    const pt = pts[selectedIdx];
    tooltipValue = fmt(data[selectedIdx].value);
    tooltipLabel = data[selectedIdx].label;
    tooltipW = Math.max(108, Math.max(tooltipValue.length, tooltipLabel.length) * 7 + 16);

    const rawLeft = Y_W + pt.x - tooltipW / 2;
    tooltipLeft   = Math.max(0, Math.min(rawLeft, W - tooltipW));

    const TOOLTIP_H = 44;
    const aboveFits = pt.y - TOOLTIP_H - 8 > 0;
    tooltipTop = aboveFits ? pt.y - TOOLTIP_H - 8 : pt.y + 12;
  }

  return (
    <View style={{ width: W, height: CHART_H }}>
      {ticks.map((v, i) => {
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
          {/* Dismiss zone behind all chart elements */}
          <Rect x={0} y={0} width={plotW} height={CHART_H - X_H} fill="transparent" onPress={() => setSelectedIdx(null)} />
          {ticks.map((v, i) => {
            const y = Y_PAD + (1 - v / yMax) * plotH;
            return <SvgLine key={i} x1={0} y1={y} x2={plotW} y2={y} stroke={colors.chart.gridLine} strokeWidth={1} strokeDasharray={i > 0 ? '4 4' : undefined} opacity={0.5} />;
          })}
          <Path d={fillPath} fill="url(#spendGrad)" />
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {/* Dots — highlighted when selected */}
          {pts.map((p, i) => {
            const isSelected = selectedIdx === i;
            const isLast     = i === pts.length - 1;
            return (
              <Circle
                key={i}
                cx={p.x} cy={p.y}
                r={isSelected ? 6 : isLast ? 5 : 3.5}
                fill={isSelected ? color : isLast ? color : colors.chart.dataPoint}
                stroke={isSelected ? colors.chart.dataPointBorder : colors.chart.dataPointBorder}
                strokeWidth={2}
              />
            );
          })}
          {/* Hit circles — last inside SVG to win touch events */}
          {pts.map((p, i) => (
            <Circle
              key={`hit-${i}`}
              cx={p.x} cy={p.y}
              r={16}
              fill="transparent"
              onPress={() => setSelectedIdx(prev => prev === i ? null : i)}
            />
          ))}
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', left: Y_W, bottom: 0, width: plotW, height: X_H, flexDirection: 'row' }}>
        {data.map((d, i) => {
          const xPos = (i / Math.max(data.length - 1, 1)) * plotW;
          const isFirst = i === 0;
          const isLast  = i === data.length - 1;
          const left    = isFirst ? 0 : isLast ? plotW - 32 : xPos - 16;
          const align   = isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center';
          return (
            <View key={i} style={{ position: 'absolute', left, width: 32, alignItems: align }}>
              <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{d.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Tooltip — outside Animated.View so it isn't clipped by the reveal animation */}
      {selectedIdx !== null && (
        <View
          style={{
            position: 'absolute',
            left: tooltipLeft,
            top: tooltipTop,
            width: tooltipW,
            height: 44,
            backgroundColor: colors.bg.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border.subtle,
            paddingHorizontal: 8,
            paddingVertical: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
          pointerEvents="none"
        >
          <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }} numberOfLines={1}>
            {tooltipLabel}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }} numberOfLines={1}>
            {tooltipValue}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── SpendingTrendsScreen ─────────────────────────────────────────────────────

export function SpendingTrendsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();
  const { data: txns }           = useTransactions();
  const { data: monthlyHistory } = useMonthlyHistory(6);
  const { data: weeklyHistory }  = useWeeklyHistory();

  const [period, setPeriod]     = useState<Period>('monthly');
  const [selectedDow, setSelectedDow] = useState<number | null>(null);
  const [dowContainerW, setDowContainerW] = useState(0);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const CURRENT_MONTH = new Date().toISOString().substring(0, 7);

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

  // Derive chart data from real history
  const chartData = useMemo(() => {
    if (period === 'weekly') return (weeklyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
    if (period === 'yearly') {
      // Aggregate by calendar quarter, labelled "Q1 '26" etc.
      // MonthPoint has no date field, so derive year by comparing the month index
      // against the current month — any month index > currentMonth must be last year.
      const ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const today = new Date();
      const currentYear  = today.getFullYear();
      const currentMonth = today.getMonth(); // 0-indexed

      const quarterMap = new Map<string, number>(); // preserves insertion order
      for (const d of (monthlyHistory ?? [])) {
        const mIdx = ABBRS.indexOf(d.label);
        if (mIdx === -1) continue;
        const year  = mIdx > currentMonth ? currentYear - 1 : currentYear;
        const qNum  = Math.floor(mIdx / 3) + 1;
        const key   = `Q${qNum} '${String(year).slice(2)}`;
        quarterMap.set(key, (quarterMap.get(key) ?? 0) + d.expense);
      }
      return [...quarterMap.entries()].map(([label, value]) => ({ label, value }));
    }
    return (monthlyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
  }, [period, monthlyHistory, weeklyHistory]);

  // Derived day-of-week spending from real transactions this month
  const dowBars = useMemo(() => {
    const DAY = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const totals = [0,0,0,0,0,0,0];
    for (const t of (txns ?? []).filter(t2 => t2.type === 'expense' && t2.date.startsWith(CURRENT_MONTH))) {
      const idx = (new Date(t.date + 'T00:00:00').getDay() + 6) % 7;
      totals[idx] += t.amount;
    }
    const maxVal = Math.max(...totals, 1);
    return DAY.map((label, i) => ({ label, pct: totals[i] / maxVal, amount: totals[i] }));
  }, [txns]);

  const peakDow = useMemo(() => {
    const maxPct = Math.max(...dowBars.map(d => d.pct));
    return dowBars.find(d => d.pct === maxPct)?.label ?? 'Saturday';
  }, [dowBars]);

  const periodTotal = useMemo(() => {
    if (period === 'weekly')  return (weeklyHistory  ?? []).reduce((s, d) => s + d.expense, 0);
    if (period === 'yearly')  return (monthlyHistory ?? []).reduce((s, d) => s + d.expense, 0);
    return totalSpend;
  }, [period, weeklyHistory, monthlyHistory, totalSpend]);

  const hist        = monthlyHistory ?? [];
  // For monthly: compare against the second-to-last month in history.
  // For weekly/yearly: no valid single-period baseline exists in the available data.
  const prevExpense = period === 'monthly' && hist.length >= 2 ? hist[hist.length - 2].expense : 0;
  // Only show a trend when there is a real non-zero baseline to compare against.
  const hasTrend    = prevExpense > 0;
  const delta       = hasTrend ? ((periodTotal - prevExpense) / prevExpense) * 100 : 0;
  const isDown      = delta <= 0;

  const PERIOD_LABELS: Record<Period, string> = { weekly: 'This Week', monthly: 'This Month', yearly: 'This Year' };

  // Reset DoW selection when period or data changes
  useEffect(() => { setSelectedDow(null); }, [period, txns]);

  // Staggered card entrance
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const a = [0, 1, 2, 3, 4].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const styles_a = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 16 }] })));

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />
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
                style={{ flex: 1, height: 36, borderRadius: borderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: period === p ? colors.bg.surfaceRaised : 'transparent' }}
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
              {fmt(periodTotal)}
            </Text>
            {hasTrend && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 4 }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isDown ? colors.income : colors.expense }}>
                  {isDown ? '↓' : '↑'} {Math.abs(delta).toFixed(1)}%
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                  vs last month
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Spending chart */}
        <Animated.View style={[styles_a[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingVertical: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3], paddingHorizontal: spacing[4] }}>
              {period === 'weekly' ? 'Daily Expenses' : period === 'yearly' ? 'Quarterly Expenses' : '6-Month Trend'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[5] }}>
              <SpendingChart
                data={chartData}
                color={colors.expense}
                width={Math.max(SCREEN_W - 80, chartData.length * 52)}
              />
            </ScrollView>
          </View>
        </Animated.View>

        {/* Day of week pattern (monthly only) */}
        {period === 'monthly' && (
          <Animated.View style={[styles_a[3], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
                Spending by Day of Week
              </Text>
              <View
                style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 6, position: 'relative' }}
                onLayout={(e) => setDowContainerW(e.nativeEvent.layout.width)}
              >
                {dowBars.map((d, i) => (
                  <Pressable
                    key={i}
                    style={{ flex: 1, alignItems: 'center', gap: 4, alignSelf: 'stretch', justifyContent: 'flex-end' }}
                    onPress={() => setSelectedDow(prev => prev === i ? null : i)}
                  >
                    <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
                      <View style={{
                        height: `${Math.max(d.pct * 100, 4)}%`,
                        backgroundColor: selectedDow !== null && selectedDow !== i
                          ? colors.expense + '30'
                          : d.pct >= 0.99 ? colors.expense : colors.expense + '60',
                        borderRadius: 4,
                      }} />
                    </View>
                    <Text style={{
                      fontSize: 9,
                      fontFamily: fontFamily.regular,
                      color: selectedDow === i ? colors.text.primary : colors.text.muted,
                    }}>{d.label}</Text>
                  </Pressable>
                ))}

                {/* Tooltip */}
                {selectedDow !== null && dowContainerW > 0 && dowBars[selectedDow]?.amount > 0 && (() => {
                  const d    = dowBars[selectedDow];
                  const TW   = 108;
                  const slotW = dowContainerW / 7;
                  const cx   = (selectedDow + 0.5) * slotW;
                  const left = Math.max(4, Math.min(cx - TW / 2, dowContainerW - TW - 4));
                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        position:          'absolute',
                        top:               4,
                        left,
                        width:             TW,
                        backgroundColor:   colors.bg.surface,
                        borderRadius:      8,
                        borderWidth:       1,
                        borderColor:       colors.border.subtle,
                        paddingHorizontal: 8,
                        paddingVertical:   6,
                        shadowColor:       '#000',
                        shadowOffset:      { width: 0, height: 2 },
                        shadowOpacity:     0.1,
                        shadowRadius:      4,
                        elevation:         3,
                      }}
                    >
                      <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>
                        {d.label}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.expense, marginTop: 2 }}>
                        {fmt(d.amount)}
                      </Text>
                    </View>
                  );
                })()}
              </View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3] }}>
                {selectedDow !== null ? `${dowBars[selectedDow].label}: ${fmt(dowBars[selectedDow].amount)}` : `${peakDow}s have the highest spending this month.`}
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
            {catTotals.length === 0 ? (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', paddingVertical: spacing[4] }}>
                No expenses recorded this month.
              </Text>
            ) : catTotals.slice(0, 6).map((cat, i, arr) => (
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
