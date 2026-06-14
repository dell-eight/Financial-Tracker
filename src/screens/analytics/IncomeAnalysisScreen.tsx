import React, { useMemo, useEffect } from 'react';
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
import { useTheme }        from '../../hooks/ui/useTheme';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useMonthlyHistory, useIncomeStreams } from '../../hooks/queries/useAnalytics';
import type { AnalyticsStackParamList } from '../../navigation/types';
import { formatFull, formatCompact } from '../../utils/currency';
import { useAppStore } from '../../store/app.store';

type Props = StackScreenProps<AnalyticsStackParamList, 'IncomeAnalysis'>;

const { width: SCREEN_W } = Dimensions.get('window');


// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string  { return formatFull(n,    useAppStore.getState().currency); }
function fmtK(n: number): string { return formatCompact(n, useAppStore.getState().currency); }

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], t = 0.35;
    d += ` C${(p.x + (c.x - p.x) * t).toFixed(1)},${p.y.toFixed(1)} ${(c.x - (c.x - p.x) * t).toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return d;
}

// ─── IncomeLineChart ──────────────────────────────────────────────────────────

function IncomeLineChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  const theme = useTheme();
  const { colors, fontFamily } = theme;
  const W = SCREEN_W - 40;
  const Y_W = 40, X_H = 24, Y_PAD = 12, CHART_H = 168;
  const plotW = W - Y_W;
  const plotH = CHART_H - X_H - Y_PAD;

  const maxV  = Math.max(...data.map(d => d.value), 1);
  const yStep = Math.ceil(maxV / 4 / 500) * 500;
  const yMax  = yStep * 4;

  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * plotW,
    y: Y_PAD + (1 - d.value / yMax) * plotH,
    label: d.label,
  }));

  const hasPts = pts.length >= 2;
  const line   = hasPts ? smoothPath(pts) : '';
  const last   = pts[pts.length - 1] ?? { x: 0, y: Y_PAD + plotH };
  const fill   = hasPts
    ? line + ` L${last.x.toFixed(1)},${(Y_PAD + plotH).toFixed(1)} L0,${(Y_PAD + plotH).toFixed(1)}Z`
    : '';

  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, []);
  const rs = useAnimatedStyle(() => ({ width: Math.max(1, reveal.value * plotW) }));

  return (
    <View style={{ width: W, height: CHART_H }}>
      {[0, 1, 2, 3, 4].map(i => {
        const v = i * yStep;
        const y = Y_PAD + (1 - v / yMax) * plotH;
        return <Text key={i} style={{ position: 'absolute', left: 0, top: y - 7, width: Y_W - 4, textAlign: 'right', fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{fmtK(v)}</Text>;
      })}
      <Animated.View style={[rs, { position: 'absolute', left: Y_W, top: 0, height: CHART_H - X_H, overflow: 'hidden' }]}>
        <Svg width={plotW} height={CHART_H - X_H}>
          <Defs>
            <SvgGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity="0.3" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          {[0, 1, 2, 3, 4].map(i => {
            const y = Y_PAD + (1 - (i * yStep) / yMax) * plotH;
            return <SvgLine key={i} x1={0} y1={y} x2={plotW} y2={y} stroke={colors.chart.gridLine} strokeWidth={1} strokeDasharray={i > 0 ? '4 4' : undefined} opacity={0.5} />;
          })}
          <Path d={fill} fill="url(#incGrad)" />
          <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5} fill={i === pts.length - 1 ? color : colors.chart.dataPoint} stroke={colors.chart.dataPointBorder} strokeWidth={2} />)}
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', left: Y_W, bottom: 0, width: plotW, height: X_H }}>
        {data.map((d, i) => (
          <View key={i} style={{ position: 'absolute', left: (i / (data.length - 1)) * plotW - 16, width: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── IncomeAnalysisScreen ─────────────────────────────────────────────────────

export function IncomeAnalysisScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: txns }           = useTransactions();
  const { data: monthlyHistory } = useMonthlyHistory(6);
  const { data: incomeStreams }  = useIncomeStreams();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const CURRENT_MONTH = new Date().toISOString().substring(0, 7);

  const monthIncome = useMemo(
    () => (txns ?? []).filter(t => t.type === 'income' && t.date.startsWith(CURRENT_MONTH)).reduce((s, t) => s + t.amount, 0),
    [txns],
  );

  const hist          = monthlyHistory ?? [];
  const incomeHistory = hist.map(d => ({ label: d.label, value: d.income }));
  const prevMonthIncome = hist.length >= 2 ? hist[hist.length - 2].income : 0;
  const displayIncome   = monthIncome > 0 ? monthIncome : (hist[hist.length - 1]?.income ?? 0);
  const incomeDelta     = prevMonthIncome > 0 ? ((displayIncome - prevMonthIncome) / prevMonthIncome) * 100 : 0;
  const isUp            = incomeDelta >= 0;

  const ytdTotal   = hist.reduce((s, d) => s + d.income, 0);
  const avgMonthly = hist.length > 0 ? Math.round(ytdTotal / hist.length) : 0;
  const bestMonth  = hist.length > 0
    ? hist.reduce((best, m) => m.income > best.income ? m : best, hist[0])
    : null;

  const variance  = hist.reduce((s, m) => s + Math.pow(m.income - avgMonthly, 2), 0) / Math.max(hist.length, 1);
  const stdDev    = Math.sqrt(variance);
  const cv        = avgMonthly > 0 ? (stdDev / avgMonthly) * 100 : 0;
  const stability = Math.max(0, Math.min(100, Math.round(100 - cv * 2)));

  const a = [0, 1, 2, 3, 4].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  const as = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 14 }] })));

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Income Analysis</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Hero */}
        <Animated.View style={[as[0], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              This Month's Income
            </Text>
            <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.income, marginTop: spacing[1], letterSpacing: -1 }}>
              {fmt(displayIncome)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 4 }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isUp ? colors.income : colors.expense }}>
                {isUp ? '↑' : '↓'} {Math.abs(incomeDelta).toFixed(1)}%
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>vs last month</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[4], marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle }}>
              {[
                { label: 'YTD Total',   value: fmt(ytdTotal) },
                { label: 'Monthly Avg', value: fmt(avgMonthly) },
                { label: 'Best Month',  value: bestMonth?.label ?? '—' },
              ].map(stat => (
                <View key={stat.label} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{stat.label}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 6-month trend chart */}
        <Animated.View style={[as[1], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              6-Month Income Trend
            </Text>
            <IncomeLineChart data={incomeHistory.length > 0 ? incomeHistory : [{ label: '—', value: 0 }]} color={colors.income} />
          </View>
        </Animated.View>

        {/* Income streams */}
        <Animated.View style={[as[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Income Streams
            </Text>
            {(incomeStreams ?? []).map((stream, i) => (
              <View key={i} style={{ marginBottom: i < (incomeStreams ?? []).length - 1 ? spacing[4] : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: stream.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                    <Text style={{ fontSize: 16 }}>{stream.icon}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{stream.label}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: stream.color }}>{fmt(stream.amount)}</Text>
                    <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{stream.pct}%</Text>
                  </View>
                </View>
                <View style={{ height: 5, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                  <View style={{ height: '100%', width: `${stream.pct}%`, backgroundColor: stream.color, borderRadius: 99 }} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Stability score — only when there is real income data */}
        {ytdTotal > 0 && (
          <Animated.View style={[as[3], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
                Income Stability
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 40, fontFamily: fontFamily.bold, color: stability >= 80 ? colors.income : stability >= 60 ? '#F59E0B' : colors.expense, letterSpacing: -1 }}>
                    {stability}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>/ 100</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ height: 10, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, marginBottom: spacing[2], overflow: 'hidden' }}>
                    <View style={{ height: '100%', width: `${stability}%`, backgroundColor: stability >= 80 ? colors.income : stability >= 60 ? '#F59E0B' : colors.expense, borderRadius: 99 }} />
                  </View>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 18 }}>
                    {stability >= 80
                      ? 'Excellent — your income is very consistent month-to-month.'
                      : stability >= 60
                        ? 'Good — minor fluctuations from freelance or variable income.'
                        : 'Variable — consider building a 3-month emergency fund.'}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Growth tip — only when there is real income data */}
        {ytdTotal > 0 && (
          <Animated.View style={[as[4], { marginHorizontal: spacing[5] }]}>
            <View style={{ backgroundColor: colors.income + '12', borderRadius: borderRadius.card, padding: spacing[4], borderWidth: 1, borderColor: colors.income + '25' }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income, marginBottom: spacing[2] }}>
                💡 Income Growth Insight
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
                {(incomeStreams ?? []).length > 1
                  ? `You have ${(incomeStreams ?? []).length} income streams this month. Diversifying further can improve stability and grow your savings rate.`
                  : 'Consider adding freelance or investment income to diversify beyond a single income source.'}
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default IncomeAnalysisScreen;
