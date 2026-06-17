import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
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
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Line as SvgLine,
  Text as SvgText,
} from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';

import { useTheme }          from '../../hooks/ui/useTheme';
import { useTransactions }   from '../../hooks/queries/useTransactions';
import { useBudgets }        from '../../hooks/queries/useBudgets';
import { useMonthlyHistory, useWeeklyHistory } from '../../hooks/queries/useAnalytics';
import { AnalyticsCard, ChartCard, SectionHeader } from '../../components';
import { getCategoryBgColor } from '../../theme';
import type { AnalyticsStackParamList } from '../../navigation/types';
import type { CategoryKey } from '../../theme';
import { useCurrency } from '../../utils/currency';

type Props   = StackScreenProps<AnalyticsStackParamList, 'AnalyticsHome'>;
type Period  = 'weekly' | 'monthly' | 'yearly';

const { width: SCREEN_W } = Dimensions.get('window');

const _CURRENT_MONTH = new Date().toISOString().substring(0, 7);

// Chart geometry constants
const Y_LABEL_W  = 44;   // y-axis label column
const X_LABEL_H  = 28;   // x-axis label row
const Y_PAD      = 14;   // top breathing room inside plot
const LINE_H     = 200;  // line chart height
const BAR_H      = 200;  // bar chart height (includes x-axis)
const BAR_PLOT_H = BAR_H - X_LABEL_H;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BarPoint  { label: string; income: number; expense: number }
interface LinePoint { label: string; value: number }
interface MonthPoint extends BarPoint { savings: number }

interface CatStat {
  key:    CategoryKey;
  label:  string;
  icon:   string;
  amount: number;
  color:  string;
}

const MONTH_CATS: CatStat[] = [
  { key: 'bills',         label: 'Bills & Utilities', icon: '⚡', amount: 657.49, color: '#EF4444' },
  { key: 'food',          label: 'Food & Dining',     icon: '🍔', amount: 650.00, color: '#F97316' },
  { key: 'other',         label: 'Other',             icon: '💰', amount: 405.29, color: '#6B7280' },
  { key: 'shopping',      label: 'Shopping',          icon: '🛍', amount: 348.73, color: '#EC4899' },
  { key: 'health',        label: 'Health',            icon: '💊', amount: 86.60,  color: '#22C55E' },
  { key: 'transport',     label: 'Transport',         icon: '🚗', amount: 85.70,  color: '#3B82F6' },
  { key: 'entertainment', label: 'Entertainment',     icon: '🎬', amount: 51.97,  color: '#A855F7' },
  { key: 'education',     label: 'Education',         icon: '📚', amount: 49.99,  color: '#14B8A6' },
];
// Sum = 2335.77

interface PeriodMeta {
  total:           string;
  income:          string;
  net:             string;
  delta:           string;
  vsLabel:         string;
  savingsRate:     number;
  prevSavingsRate: number;
}

const EMPTY_META: PeriodMeta = {
  total: '$0.00', income: '$0.00', net: '$0.00',
  delta: '—', vsLabel: '',
  savingsRate: 0, prevSavingsRate: 0,
};

// Smooth cubic bezier through points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const c = pts[i];
    const t = 0.35;
    const cp1x = p.x + (c.x - p.x) * t;
    const cp2x = c.x - (c.x - p.x) * t;
    d += ` C ${cp1x.toFixed(2)},${p.y.toFixed(2)} ${cp2x.toFixed(2)},${c.y.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`;
  }
  return d;
}

// SVG donut arc math
function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArc(cx: number, cy: number, outerR: number, innerR: number, a1: number, a2: number): string {
  if (a2 - a1 >= 360) { a2 = a1 + 359.98; }
  const large = (a2 - a1) > 180 ? 1 : 0;
  const p1 = polarToCart(cx, cy, outerR, a1);
  const p2 = polarToCart(cx, cy, outerR, a2);
  const p3 = polarToCart(cx, cy, innerR, a2);
  const p4 = polarToCart(cx, cy, innerR, a1);
  return [
    `M${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
    `A${outerR},${outerR},0,${large},1,${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
    `L${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
    `A${innerR},${innerR},0,${large},0,${p4.x.toFixed(2)},${p4.y.toFixed(2)}Z`,
  ].join(' ');
}

// ─── AnimatedBar ───────────────────────────────────────────────────────────────
// Accepts a SharedValue for smooth co-ordinated animation across bar groups.

function AnimatedBar({
  progress, targetH, maxH, barW, color,
}: {
  progress: SharedValue<number>;
  targetH: number;
  maxH: number;
  barW: number;
  color: string;
}) {
  const style = useAnimatedStyle(() => {
    const h = Math.max(2, progress.value * targetH);
    return { height: h, marginTop: maxH - h };
  });
  return (
    <Animated.View
      style={[
        style,
        { width: barW, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
      ]}
    />
  );
}

// ─── GroupedBarChart ───────────────────────────────────────────────────────────

function GroupedBarChart({
  data, chartW, animDelay = 0,
}: {
  data: BarPoint[];
  chartW: number;
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, spacing, fontFamily } = theme;

  const N       = data.length;
  const maxVal  = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);
  const GROUP_W = Math.floor(chartW / N);
  const BAR_W   = Math.floor((GROUP_W - 8) / 2);
  const BAR_GAP = 3;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      animDelay,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [data]);

  return (
    <View style={{ width: chartW }}>
      {/* Bars */}
      <View style={{ flexDirection: 'row', height: BAR_PLOT_H, alignItems: 'flex-end' }}>
        {data.map((d, i) => {
          const incH = (d.income  / maxVal) * BAR_PLOT_H;
          const expH = (d.expense / maxVal) * BAR_PLOT_H;
          return (
            <View
              key={i}
              style={{
                width:          GROUP_W,
                height:         BAR_PLOT_H,
                flexDirection:  'row',
                alignItems:     'flex-end',
                paddingHorizontal: 2,
                gap:             BAR_GAP,
              }}
            >
              <AnimatedBar
                progress={progress}
                targetH={incH}
                maxH={BAR_PLOT_H}
                barW={BAR_W}
                color={colors.income}
              />
              <AnimatedBar
                progress={progress}
                targetH={expH}
                maxH={BAR_PLOT_H}
                barW={BAR_W}
                color={colors.expense}
              />
            </View>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', height: X_LABEL_H, alignItems: 'flex-start', paddingTop: 6 }}>
        {data.map((d, i) => (
          <View key={i} style={{ width: GROUP_W, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.chart.axisLabel }}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[5], marginTop: spacing[2] }}>
        {([
          { color: colors.income,  label: 'Income'   },
          { color: colors.expense, label: 'Expenses' },
        ] as const).map(({ color, label }) => (
          <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 11, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── SpendingLineChart ─────────────────────────────────────────────────────────

function SpendingLineChart({
  data, chartW, animDelay = 0,
}: {
  data: LinePoint[];
  chartW: number;
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, fontFamily: FF } = theme;
  const { fmtCompact: fmtK } = useCurrency();

  const PLOT_W = chartW - Y_LABEL_W;
  const PLOT_H = LINE_H  - X_LABEL_H - Y_PAD;

  const rawMax  = Math.max(...data.map(d => d.value), 100);
  const Y_TICKS = 4;
  const yStep   = Math.ceil(rawMax / Y_TICKS / 100) * 100;
  const yMax    = yStep * Y_TICKS;
  const yLabels = Array.from({ length: Y_TICKS + 1 }, (_, i) => i * yStep);

  const pts = data.map((d, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * PLOT_W,
    y: Y_PAD + (1 - Math.min(d.value, yMax) / yMax) * PLOT_H,
    label: d.label,
    value: d.value,
  }));

  const hasPts   = pts.length >= 2;
  const line     = hasPts ? smoothPath(pts) : '';
  const lastPt   = pts[pts.length - 1] ?? { x: 0, y: Y_PAD + PLOT_H };
  const fillPath = hasPts
    ? line + ` L ${lastPt.x.toFixed(2)},${(Y_PAD + PLOT_H).toFixed(2)} L 0,${(Y_PAD + PLOT_H).toFixed(2)} Z`
    : '';

  // Left-to-right reveal
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = 0;
    reveal.value = withDelay(
      animDelay,
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
    );
  }, [data]);

  const revealStyle = useAnimatedStyle(() => ({
    width: Math.max(1, reveal.value * PLOT_W),
  }));

  return (
    <View style={{ width: chartW, height: LINE_H }}>
      {/* Y-axis labels (static — not clipped) */}
      {yLabels.map((v, i) => {
        const y = Y_PAD + (1 - v / yMax) * PLOT_H;
        return (
          <Text
            key={i}
            style={{
              position:   'absolute',
              left:       0,
              top:        y - 7,
              width:      Y_LABEL_W - 4,
              textAlign:  'right',
              fontSize:   10,
              fontFamily: FF.regular,
              color:      colors.chart.axisLabel,
            }}
          >
            {fmtK(v)}
          </Text>
        );
      })}

      {/* Animated plot area */}
      <Animated.View
        style={[
          revealStyle,
          {
            position: 'absolute',
            left:     Y_LABEL_W,
            top:      0,
            height:   LINE_H - X_LABEL_H,
            overflow: 'hidden',
          },
        ]}
      >
        <Svg width={PLOT_W} height={LINE_H - X_LABEL_H}>
          <Defs>
            <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0"   stopColor={colors.accent.primary} stopOpacity="0.22" />
              <Stop offset="1"   stopColor={colors.accent.primary} stopOpacity="0"    />
            </SvgGradient>
          </Defs>

          {/* Dashed grid lines */}
          {yLabels.map((v, i) => {
            const y = Y_PAD + (1 - v / yMax) * PLOT_H;
            return (
              <SvgLine
                key={i}
                x1={0}  y1={y}
                x2={PLOT_W} y2={y}
                stroke={colors.chart.gridLine}
                strokeWidth={1}
                strokeDasharray={v === 0 ? undefined : '4 4'}
                opacity={0.6}
              />
            );
          })}

          {/* Gradient fill under line */}
          <Path d={fillPath} fill="url(#areaGrad)" />

          {/* Smooth line */}
          <Path
            d={line}
            stroke={colors.chart.lineStroke}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots */}
          {pts.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.chart.dataPoint}
              stroke={colors.chart.dataPointBorder}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* X-axis labels */}
      <View
        style={{
          position:      'absolute',
          left:          Y_LABEL_W,
          bottom:        0,
          width:         PLOT_W,
          height:        X_LABEL_H,
          flexDirection: 'row',
          alignItems:    'flex-start',
          paddingTop:    6,
        }}
      >
        {data.map((d, i) => {
          const x = (i / Math.max(data.length - 1, 1)) * PLOT_W;
          return (
            <View
              key={i}
              style={{ position: 'absolute', left: x - 20, width: 40, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 10, fontFamily: FF.regular, color: colors.chart.axisLabel, textAlign: 'center' }}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── CategoryDonut ──────────────────────────────────────────────────────────────

const DNUT_SIZE  = 164;
const DNUT_CX    = DNUT_SIZE / 2;
const DNUT_CY    = DNUT_SIZE / 2;
const OUTER_R    = 68;
const INNER_R    = 44;
const SEG_GAP    = 2.5;

function CategoryDonut({
  data, animDelay = 0,
}: {
  data: CatStat[];
  animDelay?: number;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { fmtCompact: fmtK, fmt: fmtFull } = useCurrency();

  const [selIdx, setSelIdx] = useState<number | null>(null);

  const total = data.reduce((s, d) => s + d.amount, 0);

  let angle = 0;
  const segments = data.map((d, i) => {
    const sweep = (d.amount / total) * 360;
    const a1    = angle + SEG_GAP / 2;
    const a2    = angle + sweep - SEG_GAP / 2;
    angle += sweep;
    return {
      ...d,
      a1, a2,
      pct:    Math.round((d.amount / total) * 100),
      outerR: selIdx === i ? OUTER_R + 7 : OUTER_R,
    };
  });

  const sel = selIdx !== null ? segments[selIdx] : null;

  // Donut scale+fade in
  const sc = useSharedValue(0.82);
  const op = useSharedValue(0);
  useEffect(() => {
    sc.value = withDelay(animDelay, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.15)) }));
    op.value = withDelay(animDelay, withTiming(1, { duration: 380 }));
  }, []);

  const donutStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity:   op.value,
  }));

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[5] }}>
        {/* Donut SVG */}
        <Animated.View style={donutStyle}>
          <Svg width={DNUT_SIZE} height={DNUT_SIZE}>
            {segments.map((seg, i) => (
              <Path
                key={i}
                d={buildArc(DNUT_CX, DNUT_CY, seg.outerR, INNER_R, seg.a1, seg.a2)}
                fill={seg.color}
                opacity={selIdx === null || selIdx === i ? 1 : 0.38}
                onPress={() => setSelIdx(selIdx === i ? null : i)}
              />
            ))}

            {/* Center label */}
            <SvgText
              x={DNUT_CX} y={DNUT_CY - 9}
              textAnchor="middle"
              fontSize={sel ? 11 : 10}
              fontFamily={fontFamily.medium}
              fill={sel ? sel.color : colors.text.muted}
            >
              {sel ? sel.label.split(/[\s&]/)[0] : 'Total'}
            </SvgText>
            <SvgText
              x={DNUT_CX} y={DNUT_CY + 11}
              textAnchor="middle"
              fontSize={sel ? 15 : 14}
              fontFamily={fontFamily.bold}
              fill={colors.text.primary}
            >
              {sel ? fmtK(sel.amount) : fmtK(total)}
            </SvgText>
            {sel && (
              <SvgText
                x={DNUT_CX} y={DNUT_CY + 27}
                textAnchor="middle"
                fontSize={10}
                fontFamily={fontFamily.regular}
                fill={colors.text.muted}
              >
                {/* eslint-disable-next-line react-native/no-raw-text */}
                {sel.pct}%
              </SvgText>
            )}
          </Svg>
        </Animated.View>

        {/* Legend (right side) */}
        <View style={{ flex: 1, gap: 7 }}>
          {data.slice(0, 7).map((d, i) => {
            const pct = Math.round((d.amount / total) * 100);
            return (
              <Pressable
                key={d.key}
                onPress={() => setSelIdx(selIdx === i ? null : i)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}
                accessibilityRole="button"
                accessibilityLabel={`${d.label}: ${pct}%`}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color, flexShrink: 0 }} />
                <Text
                  style={{
                    flex: 1,
                    fontSize: 11,
                    fontFamily: fontFamily.regular,
                    color: selIdx === i ? d.color : colors.text.secondary,
                    lineHeight: 15,
                  }}
                  numberOfLines={1}
                >
                  {d.label}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                  {pct}%
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tap hint */}
      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
        {sel ? `${sel.label} · ${fmtFull(sel.amount)}` : 'Tap a segment to explore'}
      </Text>
    </View>
  );
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
  rate, prevRate, history,
}: {
  rate:     number;
  prevRate: number;
  history:  MonthPoint[];
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();

  const delta    = rate - prevRate;
  const positive = delta >= 0;
  const maxSav    = Math.max(...history.map(h => h.savings), 1);
  const ytdSaved  = history.reduce((s, h) => s + h.savings, 0);
  const avgSaved  = history.length > 0 ? Math.round(ytdSaved / history.length) : 0;
  const thisMonth = history.length > 0 ? (history[history.length - 1].savings ?? 0) : 0;

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
          <Text
            style={{
              fontSize:      38,
              fontFamily:    fontFamily.bold,
              color:         colors.text.primary,
              letterSpacing: -1,
              lineHeight:    46,
            }}
          >
            {rate.toFixed(1)}%
          </Text>
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
        </View>

        {/* Sparkline (savings by month) */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 64, paddingBottom: 2 }}>
          {history.map((h, i) => {
            const bh     = Math.max(4, (h.savings / maxSav) * 56);
            const isLast = i === history.length - 1;
            return (
              <View
                key={i}
                style={{
                  width:                10,
                  height:               bh,
                  backgroundColor:      isLast ? colors.accent.primary : colors.bg.surfaceMuted,
                  borderTopLeftRadius:  3,
                  borderTopRightRadius: 3,
                  opacity:              isLast ? 1 : 0.65 + i * 0.05,
                }}
              />
            );
          })}
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
        {([
          { label: 'This Month', value: fmt(thisMonth), color: colors.income          },
          { label: 'YTD Total',  value: fmt(ytdSaved),  color: colors.accent.primary  },
          { label: 'Monthly Avg',value: fmt(avgSaved),  color: colors.text.secondary  },
        ] as const).map(({ label, value, color }) => (
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
                color:      color as string,
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
          <View key={item.key} style={{ marginBottom: i < data.length - 1 ? spacing[4] : 0 }}>
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
      return { total: fmtFull(expense), income: fmtFull(income), net: fmtFull(Math.max(0, net)), delta: '—', vsLabel: 'this week', savingsRate: sr, prevSavingsRate: 0 };
    }
    if (period === 'yearly') {
      const hist = monthlyHistory ?? [];
      const income  = hist.reduce((s, d) => s + d.income,  0);
      const expense = hist.reduce((s, d) => s + d.expense, 0);
      const net     = income - expense;
      const sr      = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
      return { total: fmtFull(expense), income: fmtFull(income), net: fmtFull(Math.max(0, net)), delta: '—', vsLabel: 'last 6 months', savingsRate: sr, prevSavingsRate: 0 };
    }
    // monthly
    const monthExpense = (txns ?? [])
      .filter(t => t.type === 'expense' && t.date.startsWith(_CURRENT_MONTH))
      .reduce((s, t) => s + t.amount, 0);
    const monthIncome = (txns ?? [])
      .filter(t => t.type === 'income' && t.date.startsWith(_CURRENT_MONTH))
      .reduce((s, t) => s + t.amount, 0);
    const net         = monthIncome - monthExpense;
    const savingsRate = monthIncome > 0 ? Math.round((net / monthIncome) * 1000) / 10 : 0;
    const hist        = monthlyHistory ?? [];
    const prev        = hist.length >= 2 ? hist[hist.length - 2] : null;
    const prevExp     = prev?.expense ?? 0;
    const deltaVal    = prevExp > 0 ? ((monthExpense - prevExp) / prevExp) * 100 : 0;
    const deltaStr    = prevExp > 0 ? `${Math.abs(deltaVal).toFixed(1)}% ${deltaVal <= 0 ? 'less' : 'more'}` : '—';
    const prevSR      = prev && prev.income > 0 ? Math.round(((prev.income - prev.expense) / prev.income) * 1000) / 10 : 0;
    return {
      total:           fmtFull(monthExpense),
      income:          fmtFull(monthIncome),
      net:             fmtFull(Math.max(0, net)),
      delta:           deltaStr,
      vsLabel:         prev ? `vs ${prev.label}` : '',
      savingsRate,
      prevSavingsRate: prevSR,
    };
  }, [period, txns, monthlyHistory, weeklyHistory]);

  const PAD     = spacing[5];
  const CHART_W = SCREEN_W - PAD * 4;

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
      <StatusBar style="light" />

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
          >
            <GroupedBarChart data={barData} chartW={CHART_W} animDelay={120} />
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
            minHeight={LINE_H + 80}
          >
            <SpendingLineChart data={lineData} chartW={CHART_W} animDelay={200} />
          </ChartCard>
        </Animated.View>

        {/* ── 4. Category breakdown donut ──────────────────────────────────────── */}
        <Animated.View style={[s4, { paddingHorizontal: PAD, marginBottom: spacing[4] }]}>
          <ChartCard
            title="Category Breakdown"
            subtitle="Tap a segment to inspect"
            minHeight={DNUT_SIZE + 80}
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
