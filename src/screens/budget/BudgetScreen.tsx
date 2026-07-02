import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
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

import { useTheme }    from '../../hooks/ui/useTheme';
import { useBudgets }  from '../../hooks/queries/useBudgets';
import { BudgetCard, SectionHeader } from '../../components';
import { QueryError } from '../../components/common/QueryError';
import type { BudgetStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';
import { useTutorialTour } from '../../hooks/ui/useTutorialTour';
import { useStaggeredAnimation } from '../../hooks/ui/useStaggeredAnimation';
import { CoachmarkOverlay } from '../../components/tutorial';
import { TUTORIAL } from '../../constants/tutorials';
import type { TutorialStep } from '../../hooks/ui/useTutorialTour';
import { BudgetOverviewCard }                    from '../../components/budget/BudgetOverviewCard';
import { BudgetHealthRow }                       from '../../components/budget/BudgetHealthRow';
import { BudgetAllocationCard, type BudgetItem } from '../../components/budget/BudgetAllocationCard';

const BUDGET_STEPS: TutorialStep[] = [
  {
    emoji: '🎯',
    title: 'Budgets change behavior',
    body: "People who set spending limits usually spend less — not because of discipline, but because seeing a progress bar creates awareness. This is how it works.",
  },
  {
    emoji: '🚦',
    title: 'Real-time progress tracking',
    body: "Green = on track. Orange = 80%+ used. Red = over limit. You'll get a notification before you overspend — not after.",
  },
  {
    emoji: '⚙️',
    title: 'Create your first budget',
    body: "Tap 'Setup Budgets' and set a limit for Food or Transport. One budget is enough to start. 30 seconds.",
    requiredAction: 'create_budget',
    inlineButton: 'Setup Budgets',
  },
  {
    emoji: '📅',
    title: 'Your whole history, always',
    body: 'Use the month arrows to see how you performed in any past month. Budget history is one of the most valuable things you will build over time.',
  },
];

type Props = StackScreenProps<BudgetStackParamList, 'BudgetOverview'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// ─── CategoryIcon ─────────────────────────────────────────────────────────────

function CategoryIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 20, lineHeight: 24 }}>{icon}</Text>;
}

// ─── RemainingMetricsCard ─────────────────────────────────────────────────────

interface RemainingMetricsProps {
  totalAllocated:   number;
  totalSpent:       number;
  daysInMonth:      number;
  daysPassed:       number;
  currentMonthName: string;
}

function RemainingMetricsCard({
  totalAllocated, totalSpent, daysInMonth, daysPassed, currentMonthName,
}: RemainingMetricsProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();

  const overallRemaining   = totalAllocated - totalSpent;
  const savingsRate        = totalAllocated > 0 ? Math.round(((totalAllocated - totalSpent) / totalAllocated) * 100) : 0;
  const daysRemaining      = daysInMonth - daysPassed;
  const avgDailyBudget     = totalAllocated / daysInMonth;
  const avgDailySpent      = daysPassed > 0 ? totalSpent / daysPassed : 0;
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
      sub:   `in ${currentMonthName}`,
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
        <View style={[remainStyles.projBadge, { backgroundColor: projectedMonthSpend > totalAllocated ? colors.expenseBg : colors.incomeBg, borderRadius: borderRadius.full }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: projectedMonthSpend > totalAllocated ? colors.expense : colors.income }}>
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
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: projectedMonthSpend > totalAllocated ? colors.expense : colors.income }}>
          {Math.round((projectedMonthSpend / totalAllocated) * 100)}% of budget
        </Text>
      </View>

      <View style={[remainStyles.projTrack, { marginTop: spacing[2], backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }]}>
        <View
          style={[
            remainStyles.projFill,
            {
              width:           `${Math.min((projectedMonthSpend / totalAllocated) * 100, 100)}%`,
              backgroundColor: projectedMonthSpend > totalAllocated ? colors.expense : colors.accent.primary,
              borderRadius:    99,
            },
          ]}
        />
        <View style={[remainStyles.limitMark, { left: `${(totalSpent / projectedMonthSpend) * Math.min((projectedMonthSpend / totalAllocated) * 100, 100)}%` }]} />
      </View>

      <View style={[remainStyles.projLegend, { marginTop: spacing[2] }]}>
        <View style={remainStyles.legendDot}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent.primary, marginRight: 4 }} />
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>Current spending</Text>
        </View>
        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          Budget: {fmt(totalAllocated)}
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
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    flexWrap:       'wrap',
    gap:            8,
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

export function BudgetScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const { data: budgetsData, isLoading: budgetsLoading, isError: budgetsError, refetch: refetchBudgets } = useBudgets(period.year, period.month + 1);
  const tour = useTutorialTour(TUTORIAL.BUDGET, BUDGET_STEPS);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // ── Derived budget data ───────────────────────────────────────────────────────

  const budgetItems = useMemo<BudgetItem[]>(() => {
    return (budgetsData ?? []).map(b => ({
      id:       b.id,
      category: b.category,
      label:    b.label,
      icon:     b.icon,
      spent:    b.spent,
      limit:    b.limit,
      color:    b.color,
    }));
  }, [budgetsData]);

  const totalAllocated = useMemo(() => budgetItems.reduce((s, b) => s + b.limit,  0), [budgetItems]);
  const totalSpent     = useMemo(() => budgetItems.reduce((s, b) => s + b.spent, 0), [budgetItems]);

  const { overBudgetCount, nearLimitCount, onTrackCount } = useMemo(() =>
    budgetItems.reduce(
      (acc, b) => {
        if (b.spent > b.limit)                                acc.overBudgetCount++;
        else if (b.spent / b.limit >= 0.80)                   acc.nearLimitCount++;
        else                                                   acc.onTrackCount++;
        return acc;
      },
      { overBudgetCount: 0, nearLimitCount: 0, onTrackCount: 0 },
    ),
  [budgetItems]);

  // Days for the metrics card
  const today       = new Date();
  const daysInMonth = new Date(period.year, period.month + 1, 0).getDate();
  const daysPassed  = (period.month === today.getMonth() && period.year === today.getFullYear())
    ? today.getDate()
    : daysInMonth;

  // ── Animations ───────────────────────────────────────────────────────────────

  const [headerAnim, heroAnim, healthAnim, allocAnim, catAnim, remainAnim] = useStaggeredAnimation(6, {
    stepMs:   80,
    duration: [400, 440, 440, 440, 480, 480],
  });

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

  if (budgetsError) {
    return <QueryError onRetry={refetchBudgets} />;
  }

  return (
    <View style={[screenStyles.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

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

          <View style={{ flexDirection: 'row', gap: spacing[2] }}>
            <Pressable
              onPress={() => navigation.push('AlertSettings')}
              hitSlop={8}
              style={[screenStyles.iconBtn, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border.subtle }]}
              accessibilityRole="button"
              accessibilityLabel="Alert settings"
            >
              <Text style={{ fontSize: 16, lineHeight: 20 }}>⚙️</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.push('BudgetSetupWizard')}
              style={({ pressed }) => [
                screenStyles.addBtn,
                {
                  backgroundColor: pressed ? colors.accent.primary : colors.accent.muted,
                  borderRadius:    borderRadius.full,
                  borderWidth:     1.5,
                  borderColor:     colors.accent.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={budgetItems.length === 0 ? 'Setup budgets' : 'Edit budgets'}
            >
              {({ pressed }) => (
                <>
                  <Text style={{ fontSize: 12, color: pressed ? '#FFFFFF' : colors.accent.primary, lineHeight: 16 }}>✎</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: pressed ? '#FFFFFF' : colors.accent.primary, marginLeft: 5 }}>
                    {budgetItems.length === 0 ? 'Setup Budgets' : 'Edit Budgets'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 2. Month Selector ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            screenStyles.monthRow,
            headerStyle,
            {
              paddingHorizontal: spacing[3],
              marginTop:         spacing[4],
              backgroundColor:   colors.bg.surface,
              borderRadius:      borderRadius.full,
              marginHorizontal:  spacing[5],
              paddingVertical:   spacing[2],
            },
          ]}
        >
          <Pressable
            onPress={() => setPeriod(p => p.month === 0
              ? { year: p.year - 1, month: 11 }
              : { year: p.year, month: p.month - 1 }
            )}
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
            {MONTHS[period.month]} {period.year}
          </Text>

          <Pressable
            onPress={() => setPeriod(p => p.month === 11
              ? { year: p.year + 1, month: 0 }
              : { year: p.year, month: p.month + 1 }
            )}
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

        {budgetsLoading ? (
          /* ── Loading state ───────────────────────────────────────────────── */
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: spacing[12] }}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : budgetItems.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────────────── */
          <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[8], alignItems: 'center' }, heroStyle]}>
            <Text style={{ fontSize: 56, marginBottom: spacing[4] }}>🎯</Text>
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', marginBottom: spacing[2] }}>
              Spend with intention
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', lineHeight: 22, marginBottom: spacing[6] }}>
              People who budget usually spend less — not because of willpower, but because seeing a limit creates awareness. Set one limit to start.
            </Text>
            <Pressable
              onPress={() => navigation.push('BudgetSetupWizard')}
              style={({ pressed }) => [{
                backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary,
                borderRadius: borderRadius.button,
                paddingHorizontal: spacing[6],
                height: 52,
                alignItems: 'center' as const,
                justifyContent: 'center' as const,
              }]}
            >
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
                + Set Up Budget
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {/* ── 3. Budget Overview Hero ──────────────────────────────────── */}
            <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, heroStyle]}>
              <BudgetOverviewCard
                month={MONTHS[period.month]}
                year={period.year}
                totalAllocated={totalAllocated}
                totalSpent={totalSpent}
              />
            </Animated.View>

            {/* ── 4. Budget Health Row ─────────────────────────────────────── */}
            <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, healthStyle]}>
              <BudgetHealthRow
                onTrackCount={onTrackCount}
                nearLimitCount={nearLimitCount}
                overBudgetCount={overBudgetCount}
              />
            </Animated.View>

            {/* ── 5. Budget Allocation Card ────────────────────────────────── */}
            <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[4] }, allocStyle]}>
              <BudgetAllocationCard items={budgetItems} totalAllocated={totalAllocated} />
            </Animated.View>

            {/* ── 6. Budget Categories List ────────────────────────────────── */}
            <Animated.View style={[{ marginTop: spacing[5] }, catStyle]}>
              <SectionHeader
                title="Budget Categories"
                actionLabel="History"
                onAction={() => navigation.push('BudgetHistory')}
                style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
              />
              <View style={[screenStyles.catList, { paddingHorizontal: spacing[5], gap: spacing[3] }]}>
                {budgetItems.map(item => (
                  <BudgetCard
                    key={item.id}
                    category={item.category}
                    categoryLabel={item.label}
                    categoryIcon={<CategoryIcon icon={item.icon} />}
                    spent={item.spent}
                    limit={item.limit}
                    onPress={() => navigation.push('CategoryBudgetDetail', { categoryId: item.id })}
                  />
                ))}
              </View>
            </Animated.View>

            {/* ── 7. Remaining Budget Metrics ──────────────────────────────── */}
            {totalAllocated > 0 && (
              <Animated.View style={[{ paddingHorizontal: spacing[5], marginTop: spacing[5] }, remainStyle]}>
                <RemainingMetricsCard
                  totalAllocated={totalAllocated}
                  totalSpent={totalSpent}
                  daysInMonth={daysInMonth}
                  daysPassed={daysPassed}
                  currentMonthName={MONTHS[period.month].substring(0, 3)}
                />
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Budget tutorial */}
      <CoachmarkOverlay
        steps={BUDGET_STEPS}
        visible={tour.visible && !budgetsLoading}
        stepIndex={tour.stepIndex}
        total={tour.total}
        stepRefs={[null, null, null, null]}
        onNext={tour.next}
        onSkip={tour.skip}
      />
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
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   9,
  },
  iconBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
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
