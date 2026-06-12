import React, { useEffect, useState } from 'react';
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../../hooks/ui/useTheme';
import { BudgetCard, SectionHeader } from '../../components';
import type { MainTabParamList } from '../../navigation/types';
import type { CategoryKey } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Budget'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mock data ────────────────────────────────────────────────────────────────

const MONTHLY_BUDGET = 5000;

interface BudgetItem {
  id:       string;
  category: CategoryKey;
  label:    string;
  icon:     string;
  spent:    number;
  limit:    number;
  color:    string;
}

const BUDGET_ITEMS: BudgetItem[] = [
  { id: 'b1', category: 'food',          label: 'Food & Dining',    icon: '🍔', spent: 620.00, limit: 800.00, color: '#F97316' },
  { id: 'b2', category: 'transport',     label: 'Transport',         icon: '🚗', spent: 245.00, limit: 300.00, color: '#3B82F6' },
  { id: 'b3', category: 'shopping',      label: 'Shopping',          icon: '🛍', spent: 890.00, limit: 700.00, color: '#EC4899' },
  { id: 'b4', category: 'bills',         label: 'Bills & Utilities', icon: '📄', spent: 480.00, limit: 500.00, color: '#EF4444' },
  { id: 'b5', category: 'entertainment', label: 'Entertainment',     icon: '🎬', spent: 180.00, limit: 250.00, color: '#A855F7' },
  { id: 'b6', category: 'health',        label: 'Health',            icon: '💊', spent: 220.00, limit: 300.00, color: '#22C55E' },
  { id: 'b7', category: 'education',     label: 'Education',         icon: '📚', spent: 95.00,  limit: 150.00, color: '#14B8A6' },
  { id: 'b8', category: 'other',         label: 'Other',             icon: '💰', spent: 117.50, limit: 200.00, color: '#6B7280' },
];

const TOTAL_ALLOCATED = BUDGET_ITEMS.reduce((s, b) => s + b.limit, 0);   // 3200
const TOTAL_SPENT     = BUDGET_ITEMS.reduce((s, b) => s + b.spent, 0);   // 2847.50

const OVER_BUDGET = BUDGET_ITEMS.filter(b => b.spent > b.limit);
const WARNING_CAT = BUDGET_ITEMS.filter(b => b.spent <= b.limit && b.spent / b.limit >= 0.80);
const ON_TRACK    = BUDGET_ITEMS.filter(b => b.spent / b.limit < 0.80);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

// ─── CategoryIcon ─────────────────────────────────────────────────────────────

function CategoryIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20, lineHeight: 24 }}>{icon}</Text>;
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

const DONUT_SIZE = 156;
const OUTER_R    = 65;
const INNER_R    = 42;
const ARC_GAP    = 2.5;

function polarToCart(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function buildArcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  a1: number, a2: number,
): string {
  const sweep = a2 - a1;
  if (sweep >= 360) { a2 = a1 + 359.98; }
  const large = (a2 - a1) > 180 ? 1 : 0;
  const p1 = polarToCart(cx, cy, outerR, a1);
  const p2 = polarToCart(cx, cy, outerR, a2);
  const p3 = polarToCart(cx, cy, innerR, a2);
  const p4 = polarToCart(cx, cy, innerR, a1);
  return [
    `M${p1.x.toFixed(2)},${p1.y.toFixed(2)}`,
    `A${outerR},${outerR},0,${large},1,${p2.x.toFixed(2)},${p2.y.toFixed(2)}`,
    `L${p3.x.toFixed(2)},${p3.y.toFixed(2)}`,
    `A${innerR},${innerR},0,${large},0,${p4.x.toFixed(2)},${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

interface DonutSegment { value: number; color: string; }

function DonutChart({ segments, holeFill }: { segments: DonutSegment[]; holeFill: string }) {
  const cx    = DONUT_SIZE / 2;
  const cy    = DONUT_SIZE / 2;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let angle = 0;

  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      {segments.map((seg, i) => {
        const sweep  = (seg.value / total) * 360;
        const half   = sweep > ARC_GAP * 3 ? ARC_GAP / 2 : 0;
        const d      = buildArcPath(cx, cy, OUTER_R, INNER_R, angle + half, angle + sweep - half);
        angle       += sweep;
        return <Path key={i} d={d} fill={seg.color} />;
      })}
      {/* Inner circle — shows bg color to make donut hole */}
      <Circle cx={cx} cy={cy} r={INNER_R - 1} fill={holeFill} />
    </Svg>
  );
}

// ─── BudgetOverviewCard ───────────────────────────────────────────────────────

function BudgetOverviewCard({ month, year }: { month: string; year: number }) {
  const theme = useTheme();
  const { spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const ratio     = TOTAL_SPENT / MONTHLY_BUDGET;
  const remaining = MONTHLY_BUDGET - TOTAL_SPENT;

  return (
    <View style={[{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }, shadows.hero]}>
      <LinearGradient
        colors={['#9B85FF', '#5B41D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[heroStyles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
      >
        {/* Decorative bg shapes */}
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <Circle cx="95%" cy="-5%" r={110} fill="rgba(255,255,255,0.08)" />
          <Circle cx="-5%" cy="110%" r={130} fill="rgba(255,255,255,0.05)" />
          <Circle cx="75%" cy="115%" r={70}  fill="rgba(255,255,255,0.04)" />
        </Svg>

        {/* Header row */}
        <View style={heroStyles.topRow}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: 'rgba(255,255,255,0.70)', letterSpacing: 0.7, textTransform: 'uppercase' }}>
            Monthly Budget
          </Text>
          <View style={heroStyles.monthPill}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.88)' }}>
              {month} {year}
            </Text>
          </View>
        </View>

        {/* Total budget amount */}
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: '#FFFFFF', letterSpacing: -1, marginTop: spacing[1], lineHeight: 48 }}>
          {fmt(MONTHLY_BUDGET)}
        </Text>

        {/* Progress track */}
        <View style={[heroStyles.track, { marginTop: spacing[4] }]}>
          <View style={[heroStyles.fill, { width: `${Math.min(ratio * 100, 100)}%` }]} />
        </View>

        {/* Pct label */}
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.62)', marginTop: spacing[1] }}>
          {Math.round(ratio * 100)}% of budget used
        </Text>

        {/* Stat trio */}
        <View style={[heroStyles.statRow, { marginTop: spacing[4] }]}>
          <View style={heroStyles.statItem}>
            <Text style={heroStyles.statLabel}>Spent</Text>
            <Text style={heroStyles.statValue}>{fmt(TOTAL_SPENT)}</Text>
          </View>

          <View style={heroStyles.divider} />

          <View style={[heroStyles.statItem, { alignItems: 'center' }]}>
            <Text style={heroStyles.statLabel}>Allocated</Text>
            <Text style={heroStyles.statValue}>{fmt(TOTAL_ALLOCATED)}</Text>
          </View>

          <View style={heroStyles.divider} />

          <View style={[heroStyles.statItem, { alignItems: 'flex-end' }]}>
            <Text style={heroStyles.statLabel}>Remaining</Text>
            <Text style={[heroStyles.statValue, { color: remaining >= 0 ? '#4ADE80' : '#F87171' }]}>
              {fmt(Math.abs(remaining))}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    minHeight: 0,
  },
  topRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  monthPill: {
    backgroundColor:   'rgba(255,255,255,0.14)',
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   4,
  },
  track: {
    height:          8,
    borderRadius:    99,
    backgroundColor: 'rgba(255,255,255,0.20)',
    overflow:        'hidden',
  },
  fill: {
    height:          '100%',
    borderRadius:    99,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex:       1,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize:   11,
    fontFamily: 'PlusJakartaSans-Regular',
    color:      'rgba(255,255,255,0.58)',
    lineHeight: 16,
  },
  statValue: {
    fontSize:      14,
    fontFamily:    'PlusJakartaSans-Bold',
    color:         '#FFFFFF',
    letterSpacing: -0.2,
    marginTop:     2,
    lineHeight:    20,
  },
  divider: {
    width:           1,
    height:          36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 8,
  },
});

// ─── BudgetHealthRow ──────────────────────────────────────────────────────────

function BudgetHealthRow() {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const chips = [
    {
      count:  ON_TRACK.length,
      label:  'On Track',
      icon:   '✓',
      bg:     `${colors.income}18`,
      border: `${colors.income}30`,
      text:   colors.income,
    },
    {
      count:  WARNING_CAT.length,
      label:  'Near Limit',
      icon:   '!',
      bg:     `${colors.warning}18`,
      border: `${colors.warning}30`,
      text:   colors.warning,
    },
    {
      count:  OVER_BUDGET.length,
      label:  'Over Budget',
      icon:   '↑',
      bg:     `${colors.expense}18`,
      border: `${colors.expense}30`,
      text:   colors.expense,
    },
  ];

  return (
    <View style={[healthStyles.row, { gap: spacing[3] }]}>
      {chips.map((chip, i) => (
        <View
          key={i}
          style={[
            healthStyles.chip,
            shadows.sm,
            {
              flex:            1,
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.lg,
              padding:         spacing[4],
              borderWidth:     1,
              borderColor:     chip.border,
            },
          ]}
        >
          <View
            style={[
              healthStyles.iconBadge,
              { backgroundColor: chip.bg, borderRadius: borderRadius.full },
            ]}
          >
            <Text style={{ fontSize: 12, fontFamily: fontFamily.bold, color: chip.text, lineHeight: 16 }}>
              {chip.icon}
            </Text>
          </View>

          <Text
            style={{
              fontSize:      fontSize.headingMd,
              fontFamily:    fontFamily.bold,
              color:         chip.text,
              marginTop:     spacing[2],
              lineHeight:    26,
            }}
          >
            {chip.count}
          </Text>
          <Text
            style={{
              fontSize:   10,
              fontFamily: fontFamily.regular,
              color:      colors.text.muted,
              marginTop:  2,
              lineHeight: 14,
            }}
          >
            {chip.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const healthStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  chip: {
    alignItems: 'flex-start',
  },
  iconBadge: {
    width:          28,
    height:         28,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

// ─── BudgetAllocationCard ─────────────────────────────────────────────────────

function BudgetAllocationCard() {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const segments = BUDGET_ITEMS.map(b => ({ value: b.limit, color: b.color }));

  return (
    <View
      style={[
        allocStyles.card,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
      ]}
    >
      {/* Title row */}
      <View style={allocStyles.titleRow}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            Budget Allocation
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {fmt(TOTAL_ALLOCATED)} across {BUDGET_ITEMS.length} categories
          </Text>
        </View>
        <View style={[allocStyles.totalBadge, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.full }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
            {BUDGET_ITEMS.length} active
          </Text>
        </View>
      </View>

      {/* Donut + center text */}
      <View style={[allocStyles.chartRow, { marginTop: spacing[5] }]}>
        <View style={allocStyles.donutContainer}>
          <DonutChart segments={segments} holeFill={colors.bg.surface} />
          {/* Center overlay */}
          <View style={allocStyles.donutCenter} pointerEvents="none">
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
              Total
            </Text>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', letterSpacing: -0.3, marginTop: 1 }}>
              {fmtShort(TOTAL_ALLOCATED)}
            </Text>
          </View>
        </View>

        {/* Legend — top 6 categories */}
        <View style={allocStyles.legend}>
          {BUDGET_ITEMS.slice(0, 6).map((item, i) => (
            <View key={i} style={[allocStyles.legendItem, { marginBottom: i < 5 ? 10 : 0 }]}>
              <View style={[allocStyles.legendDot, { backgroundColor: item.color }]} />
              <Text
                style={{
                  flex:       1,
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.regular,
                  color:      colors.text.secondary,
                }}
                numberOfLines={1}
              >
                {item.label.split(' ')[0]}
              </Text>
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.semiBold,
                  color:      colors.text.primary,
                  marginLeft: 4,
                }}
              >
                {Math.round((item.limit / TOTAL_ALLOCATED) * 100)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Full legend grid (2 cols) */}
      <View style={[allocStyles.fullGrid, { marginTop: spacing[5], borderTopWidth: 1, borderTopColor: colors.border.subtle, paddingTop: spacing[4] }]}>
        {BUDGET_ITEMS.map((item, i) => (
          <View key={i} style={allocStyles.gridItem}>
            <View style={[allocStyles.gridDot, { backgroundColor: item.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.medium, color: colors.text.secondary }} numberOfLines={1}>
                {item.label}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>
                {fmt(item.limit)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const allocStyles = StyleSheet.create({
  card: {
    width: '100%',
  },
  titleRow: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
  },
  totalBadge: {
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           16,
  },
  donutContainer: {
    width:    DONUT_SIZE,
    height:   DONUT_SIZE,
    position: 'relative',
  },
  donutCenter: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    bottom:         0,
    alignItems:     'center',
    justifyContent: 'center',
  },
  legend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },
  legendDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    flexShrink:   0,
  },
  fullGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           12,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems:    'center',
    width:         '47%',
    gap:           8,
  },
  gridDot: {
    width:        10,
    height:       10,
    borderRadius: 5,
    flexShrink:   0,
  },
});

// ─── RemainingMetricsCard ─────────────────────────────────────────────────────

function RemainingMetricsCard() {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const overallRemaining  = MONTHLY_BUDGET - TOTAL_SPENT;
  const savingsRate        = Math.round(((MONTHLY_BUDGET - TOTAL_SPENT) / MONTHLY_BUDGET) * 100);
  const daysInMonth        = 30;
  const daysPassed         = 12; // June 12
  const daysRemaining      = daysInMonth - daysPassed;
  const avgDailyBudget     = MONTHLY_BUDGET / daysInMonth;
  const avgDailySpent      = TOTAL_SPENT / daysPassed;
  const projectedMonthSpend = avgDailySpent * daysInMonth;

  const metrics = [
    {
      label: 'Remaining',
      value: fmt(overallRemaining),
      sub:   'of monthly budget',
      color: overallRemaining >= 0 ? colors.income : colors.expense,
      icon:  '💰',
      iconBg: `${colors.income}18`,
    },
    {
      label: 'Savings Rate',
      value: `${savingsRate}%`,
      sub:   'this month',
      color: savingsRate >= 20 ? colors.income : colors.warning,
      icon:  '📊',
      iconBg: `${colors.accent.primary}18`,
    },
    {
      label: 'Days Left',
      value: `${daysRemaining}`,
      sub:   'in June',
      color: colors.text.primary,
      icon:  '📅',
      iconBg: `${colors.warning}18`,
    },
    {
      label: 'Daily Avg',
      value: fmtShort(avgDailySpent),
      sub:   `vs ${fmtShort(avgDailyBudget)} target`,
      color: avgDailySpent <= avgDailyBudget ? colors.income : colors.expense,
      icon:  '📈',
      iconBg: `${colors.expense}18`,
    },
  ];

  return (
    <View
      style={[
        remainStyles.card,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[5],
        },
      ]}
    >
      {/* Title */}
      <View style={remainStyles.titleRow}>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
          Remaining Budget
        </Text>
        <View style={[remainStyles.projBadge, { backgroundColor: projectedMonthSpend > MONTHLY_BUDGET ? colors.expenseBg : colors.incomeBg, borderRadius: borderRadius.full }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: projectedMonthSpend > MONTHLY_BUDGET ? colors.expense : colors.income }}>
            Projected: {fmt(projectedMonthSpend)}
          </Text>
        </View>
      </View>

      {/* 2×2 Metrics grid */}
      <View style={[remainStyles.grid, { marginTop: spacing[4], gap: spacing[3] }]}>
        {metrics.map((m, i) => (
          <View
            key={i}
            style={[
              remainStyles.metricTile,
              {
                backgroundColor: colors.bg.surfaceRaised,
                borderRadius:    borderRadius.lg,
                padding:         spacing[4],
              },
            ]}
          >
            <View style={[remainStyles.metricIcon, { backgroundColor: m.iconBg, borderRadius: borderRadius.full }]}>
              <Text style={{ fontSize: 14, lineHeight: 18 }}>{m.icon}</Text>
            </View>
            <Text
              style={{
                fontSize:      fontSize.headingMd,
                fontFamily:    fontFamily.bold,
                color:         m.color,
                marginTop:     spacing[2],
                letterSpacing: -0.3,
                lineHeight:    24,
              }}
            >
              {m.value}
            </Text>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.medium,
                color:      colors.text.primary,
                marginTop:  2,
                lineHeight: 18,
              }}
            >
              {m.label}
            </Text>
            <Text
              style={{
                fontSize:   10,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  2,
                lineHeight: 14,
              }}
              numberOfLines={1}
            >
              {m.sub}
            </Text>
          </View>
        ))}
      </View>

      {/* Projected vs budget progress bar */}
      <View style={[remainStyles.projRow, { marginTop: spacing[4] }]}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          Monthly projection
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: projectedMonthSpend > MONTHLY_BUDGET ? colors.expense : colors.income }}>
          {Math.round((projectedMonthSpend / MONTHLY_BUDGET) * 100)}% of budget
        </Text>
      </View>

      <View style={[remainStyles.projTrack, { marginTop: spacing[2], backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }]}>
        <View
          style={[
            remainStyles.projFill,
            {
              width:           `${Math.min((projectedMonthSpend / MONTHLY_BUDGET) * 100, 100)}%`,
              backgroundColor: projectedMonthSpend > MONTHLY_BUDGET ? colors.expense : colors.accent.primary,
              borderRadius:    99,
            },
          ]}
        />
        {/* Budget limit marker */}
        <View style={[remainStyles.limitMark, { left: `${(TOTAL_SPENT / projectedMonthSpend) * Math.min((projectedMonthSpend / MONTHLY_BUDGET) * 100, 100)}%` }]} />
      </View>

      <View style={[remainStyles.projLegend, { marginTop: spacing[2] }]}>
        <View style={remainStyles.legendDot}>
          <View style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.primary, marginRight: 4 }]} />
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>Current spending</Text>
        </View>
        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          Budget: {fmt(MONTHLY_BUDGET)}
        </Text>
      </View>
    </View>
  );
}

const remainStyles = StyleSheet.create({
  card: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    justifyContent: 'space-between',
    flexWrap:      'wrap',
    gap:           8,
  },
  projBadge: {
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
  },
  metricTile: {
    width: '47.5%',
  },
  metricIcon: {
    width:          32,
    height:         32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  projRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  projTrack: {
    height:   6,
    overflow: 'hidden',
    position: 'relative',
  },
  projFill: {
    position: 'absolute',
    left:     0,
    top:      0,
    height:   '100%',
  },
  limitMark: {
    position:        'absolute',
    top:             -2,
    width:           2,
    height:          10,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderRadius:    1,
    transform:       [{ translateX: -1 }],
  },
  projLegend: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  legendDot: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});

// ─── BudgetScreen ─────────────────────────────────────────────────────────────

export function BudgetScreen(_props: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [monthIdx, setMonthIdx] = useState(5); // June
  const year = 2026;

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // Staggered entrance animations
  const headerAnim  = useSharedValue(0);
  const heroAnim    = useSharedValue(0);
  const healthAnim  = useSharedValue(0);
  const allocAnim   = useSharedValue(0);
  const catAnim     = useSharedValue(0);
  const remainAnim  = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    headerAnim.value = withDelay(0,   withTiming(1, { duration: 400, easing: e }));
    heroAnim.value   = withDelay(80,  withTiming(1, { duration: 440, easing: e }));
    healthAnim.value = withDelay(160, withTiming(1, { duration: 440, easing: e }));
    allocAnim.value  = withDelay(240, withTiming(1, { duration: 440, easing: e }));
    catAnim.value    = withDelay(320, withTiming(1, { duration: 480, easing: e }));
    remainAnim.value = withDelay(400, withTiming(1, { duration: 480, easing: e }));
  }, []);

  const headerStyle  = useAnimatedStyle(() => ({
    opacity:   headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value,  [0, 1], [12, 0]) }],
  }));
  const heroStyle    = useAnimatedStyle(() => ({
    opacity:   heroAnim.value,
    transform: [{ translateY: interpolate(heroAnim.value,    [0, 1], [24, 0]) }],
  }));
  const healthStyle  = useAnimatedStyle(() => ({
    opacity:   healthAnim.value,
    transform: [{ translateY: interpolate(healthAnim.value,  [0, 1], [18, 0]) }],
  }));
  const allocStyle   = useAnimatedStyle(() => ({
    opacity:   allocAnim.value,
    transform: [{ translateY: interpolate(allocAnim.value,   [0, 1], [18, 0]) }],
  }));
  const catStyle     = useAnimatedStyle(() => ({
    opacity:   catAnim.value,
    transform: [{ translateY: interpolate(catAnim.value,     [0, 1], [16, 0]) }],
  }));
  const remainStyle  = useAnimatedStyle(() => ({
    opacity:   remainAnim.value,
    transform: [{ translateY: interpolate(remainAnim.value,  [0, 1], [16, 0]) }],
  }));

  return (
    <View style={[screenStyles.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          screenStyles.scroll,
          { paddingTop: topPad + spacing[2], paddingBottom: btmPad + spacing[8] },
        ]}
      >
        {/* ── 1. Header ─────────────────────────────────────────────────────── */}
        <Animated.View style={[screenStyles.header, headerStyle, { paddingHorizontal: spacing[5] }]}>
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
              Budget
            </Text>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
                marginTop:  2,
              }}
            >
              Track & manage spending
            </Text>
          </View>

          <Pressable
            style={[
              screenStyles.addBtn,
              { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add new budget"
          >
            <Text style={{ fontSize: 18, fontFamily: fontFamily.bold, color: '#FFFFFF', lineHeight: 22 }}>+</Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#FFFFFF', marginLeft: 4 }}>
              Add
            </Text>
          </Pressable>
        </Animated.View>

        {/* ── 2. Month Selector ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            screenStyles.monthRow,
            headerStyle,
            {
              paddingHorizontal: spacing[5],
              marginTop:         spacing[4],
              backgroundColor:   colors.bg.surface,
              borderRadius:      borderRadius.full,
              marginHorizontal:  spacing[5],
              paddingVertical:   spacing[2],
            },
          ]}
        >
          <Pressable
            onPress={() => setMonthIdx(m => (m - 1 + 12) % 12)}
            style={[
              screenStyles.arrowBtn,
              { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20 }}>‹</Text>
          </Pressable>

          <Text
            style={{
              fontSize:      fontSize.bodyLg,
              fontFamily:    fontFamily.semiBold,
              color:         colors.text.primary,
              letterSpacing: -0.2,
            }}
          >
            {MONTHS[monthIdx]} {year}
          </Text>

          <Pressable
            onPress={() => setMonthIdx(m => (m + 1) % 12)}
            style={[
              screenStyles.arrowBtn,
              { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full },
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 20 }}>›</Text>
          </Pressable>
        </Animated.View>

        {/* ── 3. Budget Overview Hero ────────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, heroStyle]}>
          <BudgetOverviewCard month={MONTHS[monthIdx]} year={year} />
        </Animated.View>

        {/* ── 4. Budget Health Row ──────────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, healthStyle]}>
          <BudgetHealthRow />
        </Animated.View>

        {/* ── 5. Budget Allocation Card ─────────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, allocStyle]}>
          <BudgetAllocationCard />
        </Animated.View>

        {/* ── 6. Budget Categories List ─────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, catStyle]}>
          <SectionHeader
            title="Budget Categories"
            actionLabel="Edit All"
            onAction={() => {}}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />

          <View style={[screenStyles.catList, { paddingHorizontal: spacing[5], gap: spacing[3] }]}>
            {BUDGET_ITEMS.map(item => (
              <BudgetCard
                key={item.id}
                category={item.category}
                categoryLabel={item.label}
                categoryIcon={<CategoryIcon icon={item.icon} />}
                spent={item.spent}
                limit={item.limit}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── 7. Remaining Budget Metrics ───────────────────────────────────── */}
        <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[5] }, remainStyle]}>
          <RemainingMetricsCard />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  addBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 16,
    paddingVertical:   9,
  },
  monthRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  arrowBtn: {
    width:          34,
    height:         34,
    alignItems:     'center',
    justifyContent: 'center',
  },
  catList: {
    // gap applied inline
  },
});

export default BudgetScreen;
