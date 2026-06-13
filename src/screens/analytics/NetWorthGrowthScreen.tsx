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
import { useTheme } from '../../hooks/ui/useTheme';
import { useAssets, useDebts } from '../../hooks/queries/useNetWorth';
import type { AnalyticsStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AnalyticsStackParamList, 'NetWorthGrowth'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mock 12-month history ────────────────────────────────────────────────────

const NW_HISTORY = [
  { label: 'Jul', nw: 760000 },
  { label: 'Aug', nw: 774000 },
  { label: 'Sep', nw: 789000 },
  { label: 'Oct', nw: 801000 },
  { label: 'Nov', nw: 818000 },
  { label: 'Dec', nw: 832000 },
  { label: 'Jan', nw: 841000 },
  { label: 'Feb', nw: 848000 },
  { label: 'Mar', nw: 854000 },
  { label: 'Apr', nw: 859000 },
  { label: 'May', nw: 865000 },
  { label: 'Jun', nw: 876300 },
];

const MILESTONES = [
  { label: '₱750k',  value: 750_000,   reached: true  },
  { label: '₱850k',  value: 850_000,   reached: true  },
  { label: '₱1M',    value: 1_000_000, reached: false },
  { label: '₱1.5M',  value: 1_500_000, reached: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}k`;
  return `₱${Math.round(n)}`;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], t = 0.35;
    d += ` C${(p.x + (c.x - p.x) * t).toFixed(1)},${p.y.toFixed(1)} ${(c.x - (c.x - p.x) * t).toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return d;
}

// ─── NWChart ─────────────────────────────────────────────────────────────────

function NWChart({ data }: { data: typeof NW_HISTORY }) {
  const theme = useTheme();
  const { colors, fontFamily } = theme;
  const W = SCREEN_W - 40;
  const Y_W = 48, X_H = 24, Y_PAD = 12, CHART_H = 200;
  const plotW = W - Y_W;
  const plotH = CHART_H - X_H - Y_PAD;

  const allVals = data.map(d => d.nw);
  const minV    = Math.min(...allVals) * 0.97;
  const maxV    = Math.max(...allVals) * 1.02;
  const range   = maxV - minV || 1;

  const toY = (v: number) => Y_PAD + (1 - (v - minV) / range) * plotH;

  const nwPts  = data.map((d, i) => ({ x: (i / (data.length - 1)) * plotW, y: toY(d.nw) }));
  const nwLine = smoothPath(nwPts);
  const last   = nwPts[nwPts.length - 1];
  const nwFill = nwLine + ` L${last.x.toFixed(1)},${(Y_PAD + plotH).toFixed(1)} L0,${(Y_PAD + plotH).toFixed(1)}Z`;

  const tickStep = Math.ceil((maxV - minV) / 4 / 10000) * 10000;
  const ticks    = [0, 1, 2, 3, 4].map(i => minV + i * tickStep);

  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, []);
  const rs = useAnimatedStyle(() => ({ width: Math.max(1, reveal.value * plotW) }));

  return (
    <View style={{ width: W, height: CHART_H }}>
      {ticks.map((v, i) => {
        const y = toY(v);
        if (y < Y_PAD - 4 || y > Y_PAD + plotH + 4) return null;
        return <Text key={i} style={{ position: 'absolute', left: 0, top: y - 7, width: Y_W - 4, textAlign: 'right', fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{fmtShort(v)}</Text>;
      })}
      <Animated.View style={[rs, { position: 'absolute', left: Y_W, top: 0, height: CHART_H - X_H, overflow: 'hidden' }]}>
        <Svg width={plotW} height={CHART_H - X_H}>
          <Defs>
            <SvgGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.accent.primary} stopOpacity="0.28" />
              <Stop offset="1" stopColor={colors.accent.primary} stopOpacity="0" />
            </SvgGradient>
          </Defs>
          {ticks.map((v, i) => {
            const y = toY(v);
            if (y < Y_PAD - 4 || y > Y_PAD + plotH + 4) return null;
            return <SvgLine key={i} x1={0} y1={y} x2={plotW} y2={y} stroke={colors.chart.gridLine} strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />;
          })}
          <Path d={nwFill} fill="url(#nwGrad)" />
          <Path d={nwLine} stroke={colors.accent.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          {nwPts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={i === nwPts.length - 1 ? 5 : 3}
              fill={i === nwPts.length - 1 ? colors.accent.primary : colors.chart.dataPoint}
              stroke={colors.chart.dataPointBorder} strokeWidth={2} />
          ))}
        </Svg>
      </Animated.View>
      <View style={{ position: 'absolute', left: Y_W, bottom: 0, width: plotW, height: X_H }}>
        {data.filter((_, i) => i % 2 === 0 || i === data.length - 1).map(d => {
          const origIdx = data.indexOf(d);
          const x = (origIdx / (data.length - 1)) * plotW;
          return (
            <View key={origIdx} style={{ position: 'absolute', left: x - 12, width: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── NetWorthGrowthScreen ─────────────────────────────────────────────────────

export function NetWorthGrowthScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const { data: assets } = useAssets();
  const { data: debts  } = useDebts();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const totalAssets = useMemo(() => (assets ?? []).reduce((s, a) => s + a.balance, 0), [assets]);
  const totalDebts  = useMemo(() => (debts  ?? []).reduce((s, d) => s + d.balance,  0), [debts]);
  const netWorth    = totalAssets - totalDebts;

  const currentNW  = netWorth > 0 ? netWorth : NW_HISTORY[NW_HISTORY.length - 1].nw;
  const prevNW     = NW_HISTORY[NW_HISTORY.length - 2].nw;
  const nwDelta    = currentNW - prevNW;

  const nextMilestone  = MILESTONES.find(m => !m.reached);
  const toGo           = nextMilestone ? nextMilestone.value - currentNW : 0;
  const monthsToTarget = Math.ceil(toGo / 11300);

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
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Net Worth Growth</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Hero */}
        <Animated.View style={[as[0], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Net Worth</Text>
            <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
              {fmtShort(currentNW)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 4 }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>
                +{fmtShort(nwDelta)} this month
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.income }}>
                (+{((nwDelta / prevNW) * 100).toFixed(1)}%)
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[4], marginTop: spacing[4], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle }}>
              {[
                { label: 'Total Assets', value: fmtShort(totalAssets || 948300), color: colors.income },
                { label: 'Total Debts',  value: fmtShort(totalDebts  || 72000),  color: colors.expense },
                { label: '12-mo Growth', value: '+13.2%',                          color: colors.accent.primary },
              ].map(stat => (
                <View key={stat.label} style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{stat.label}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: stat.color, marginTop: 2 }}>{stat.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* 12-month chart */}
        <Animated.View style={[as[1], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              12-Month Net Worth
            </Text>
            <NWChart data={NW_HISTORY} />
          </View>
        </Animated.View>

        {/* Monthly delta table */}
        <Animated.View style={[as[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingHorizontal: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, paddingVertical: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
              Monthly Change
            </Text>
            {NW_HISTORY.slice(-6).map((row, i, arr) => {
              const prevIdx = NW_HISTORY.indexOf(row) - 1;
              const prev    = prevIdx >= 0 ? NW_HISTORY[prevIdx].nw : row.nw;
              const delta   = row.nw - prev;
              const up      = delta >= 0;
              return (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border.subtle }}>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, minWidth: 40 }}>{row.label}</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, textAlign: 'right' }}>{fmtShort(row.nw)}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: up ? colors.income : colors.expense, minWidth: 72, textAlign: 'right' }}>
                    {up ? '+' : ''}{fmtShort(delta)}
                  </Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Milestones */}
        <Animated.View style={[as[3], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Milestones
            </Text>
            {MILESTONES.map((m, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: i < MILESTONES.length - 1 ? spacing[3] : 0 }}>
                <Text style={{ fontSize: 18 }}>{m.reached ? '✅' : '🎯'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: m.reached ? colors.text.primary : colors.text.muted }}>{m.label}</Text>
                    {m.reached
                      ? <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>Achieved!</Text>
                      : <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>{fmtShort(m.value - currentNW)} to go</Text>
                    }
                  </View>
                  <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                    <View style={{ height: '100%', width: `${m.reached ? 100 : Math.min((currentNW / m.value) * 100, 100)}%`, backgroundColor: m.reached ? colors.income : colors.accent.primary, borderRadius: 99 }} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ETA card */}
        {nextMilestone && (
          <Animated.View style={[as[4], { marginHorizontal: spacing[5] }]}>
            <View style={{ backgroundColor: colors.accent.primary + '12', borderRadius: borderRadius.card, padding: spacing[4], borderWidth: 1, borderColor: colors.accent.primary + '25' }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary, marginBottom: spacing[2] }}>
                🎯 Next: {nextMilestone.label}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
                You need {fmtShort(toGo)} more. At your current rate of +₱11.3k/month, you'll reach {nextMilestone.label} in approximately{' '}
                <Text style={{ fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{monthsToTarget} months.</Text>
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

export default NetWorthGrowthScreen;
