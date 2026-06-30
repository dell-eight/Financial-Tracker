import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useQueryClient } from '@tanstack/react-query';
import type { StackScreenProps } from '@react-navigation/stack';
import type { NavigationProp } from '@react-navigation/native';

import { useTheme }                   from '../../hooks/ui/useTheme';
import type { ThemeColors }           from '../../theme';
import { useDashboard }               from '../../hooks/queries/useDashboard';
import { useTransactions }            from '../../hooks/queries/useTransactions';
import { useBudgets }                 from '../../hooks/queries/useBudgets';
import { useSavingsGoals }            from '../../hooks/queries/useSavingsGoals';
import { useUserProfile }             from '../../hooks/queries/useAuth';
import { useAuthStore }               from '../../store/auth.store';
import { useAppStore }                from '../../store/app.store';
import { ProgressBar, SectionHeader, ExpenseItem } from '../../components';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';
import { computeHealthScore } from '../../utils/healthScore';
import { useUnreadNotificationCount } from '../../hooks/queries/useNotifications';
import { useTutorialTour } from '../../hooks/ui/useTutorialTour';
import { CoachmarkOverlay } from '../../components/tutorial';
import { TUTORIAL } from '../../constants/tutorials';
import type { TutorialStep } from '../../hooks/ui/useTutorialTour';

type Props = StackScreenProps<HomeStackParamList, 'HomeMain'>;

const { width: SCREEN_W } = Dimensions.get('window');

const DASHBOARD_STEPS: TutorialStep[] = [
  {
    emoji: '📊',
    title: 'Welcome to your dashboard',
    body: 'Your net worth, Health Score, budgets, and transactions are all here. The score in the top band updates every time you log a transaction.',
  },
  {
    emoji: '⚡',
    title: 'Tap + and add an expense',
    body: 'The fastest way to see an accurate picture is to log every day. Tap + now — it takes 10 seconds.',
    requiredAction: 'tap_add_expense',
    inlineFab: true,
  },
];

function formatDateLabel(dateStr: string): string {
  const today    = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yd       = new Date(today);
  yd.setDate(yd.getDate() - 1);
  const yesterStr = yd.toISOString().split('T')[0];
  if (dateStr === todayStr)  return 'Today';
  if (dateStr === yesterStr) return 'Yesterday';
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 18) return 'Good Afternoon';
  if (hour >= 18 && hour < 24) return 'Good Evening';
  if (hour >= 24 && hour < 5) return "Good Night";

  return 'Hello';
}

function getHealthBand(score: number, colors: ThemeColors): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent',       color: colors.income };
  if (score >= 60) return { label: 'Good',            color: colors.accent.primary };
  if (score >= 40) return { label: 'Fair',            color: colors.warning };
  return               { label: 'Needs Attention', color: colors.expense };
}

// ── SkeletonBox ────────────────────────────────────────────────────────────────

function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width?: number | string; height: number; borderRadius?: number; style?: object;
}) {
  const theme   = useTheme();
  const opacity = useSharedValue(0.06);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.14, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width:           width ?? '100%',
          height,
          borderRadius,
          backgroundColor: theme.colors.text.primary,
        },
        animStyle,
        style,
      ]}
    />
  );
}

// ── Zone 1: NetWorthCard ───────────────────────────────────────────────────────

interface NetWorthCardProps {
  netWorth:        number;
  delta:           number;
  deltaPct:        number;
  totalAssets:     number;
  totalDebts:      number;
  investmentValue: number;
  onPress:         () => void;
  loading:         boolean;
}

function NetWorthCard({
  netWorth, delta, deltaPct,
  totalAssets, totalDebts, investmentValue,
  onPress, loading,
}: NetWorthCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt: fmtPh, fmtCompact: fmtK } = useCurrency();

  if (loading) {
    return (
      <View style={{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }}>
        <SkeletonBox height={188} borderRadius={borderRadius.cardLg} />
      </View>
    );
  }

  const isPositive = delta >= 0;

  const chipBg  = isPositive ? 'rgba(52,211,153,0.15)'  : 'rgba(248,113,113,0.15)';

  return (
    <Pressable
      onPress={onPress}
      style={[
        { borderRadius: borderRadius.cardLg, overflow: 'hidden' },
        Platform.OS === 'ios'
          ? { shadowColor: '#0A0720', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.45, shadowRadius: 28 }
          : { elevation: 16 },
      ]}
    >
      <LinearGradient
        colors={['#2A1168', '#17094A', '#0C0828']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[nwStyles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
      >
        {/* Decorative glows */}
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Circle cx="92%" cy="10%" r={80}  fill="rgba(140,100,255,0.12)" />
          <Circle cx="-5%" cy="90%" r={90}  fill="rgba(100,70,230,0.10)"  />
        </Svg>

        {/* Top highlight shimmer */}
        <View style={nwStyles.topShimmer} />

        {/* Label */}
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Total Net Worth
        </Text>

        {/* Primary number */}
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: '#FFFFFF', letterSpacing: -1, marginTop: spacing[1], lineHeight: 50 }}>
          {fmtPh(netWorth)}
        </Text>

        {/* Delta chip */}
        <View style={nwStyles.deltaRow}>
          <View style={[nwStyles.deltaChip, { backgroundColor: chipBg }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isPositive ? colors.income : colors.expense }}>
              {isPositive ? '↑' : '↓'} {fmtPh(Math.abs(delta))} ({isPositive ? '+' : ''}{deltaPct.toFixed(2)}%)
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>
              this month
            </Text>
          </View>
        </View>

        {/* 3-col breakdown strip */}
        <View style={[nwStyles.strip, { marginTop: spacing[4], borderTopColor: 'rgba(255,255,255,0.12)', borderTopWidth: 1, paddingTop: spacing[3] }]}>
          {[
            { label: 'Assets',      value: fmtK(totalAssets),     color: colors.income },
            { label: 'Debts',       value: fmtK(totalDebts),      color: colors.expense },
            { label: 'Investments', value: fmtK(investmentValue), color: colors.accent.secondary },
          ].map((item, i) => (
            <View key={item.label} style={[nwStyles.stripCol, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: item.color, letterSpacing: -0.2 }}>{item.value}</Text>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const nwStyles = StyleSheet.create({
  card:      { overflow: 'hidden', justifyContent: 'space-between' },
  topShimmer: {
    position:            'absolute',
    top:                 0,
    left:                0,
    right:               0,
    height:              1,
    backgroundColor:     'rgba(200,170,255,0.35)',
  },
  deltaRow:  { flexDirection: 'row', marginTop: 8 },
  deltaChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5,
  },
  strip:     { flexDirection: 'row' },
  stripCol:  { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
});

// ── Zone 2: HealthScoreBand ────────────────────────────────────────────────────

function HealthScoreBand({ score, onPress, loading }: {
  score: number | null; onPress: () => void; loading: boolean;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  if (loading || score === null) {
    return <SkeletonBox height={72} borderRadius={borderRadius.card} />;
  }

  const band = getHealthBand(score, colors);

  return (
    <Pressable
      onPress={onPress}
      style={[
        hsStyles.band,
        shadows.card,
        {
          backgroundColor:  colors.bg.surface,
          borderRadius:     borderRadius.card,
          padding:          spacing[4],
          borderLeftWidth:  3,
          borderLeftColor:  band.color,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Financial Health Score: ${score} — ${band.label}`}
    >
      {/* Score circle */}
      <View style={[hsStyles.scoreCircle, { backgroundColor: `${band.color}20`, borderRadius: borderRadius.full, borderWidth: 2, borderColor: band.color }]}>
        <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: band.color, lineHeight: 20 }}>{score}</Text>
      </View>

      {/* Text */}
      <View style={{ flex: 1, marginLeft: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            Financial Health Score
          </Text>
          <View style={{ backgroundColor: `${band.color}20`, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: band.color }}>{band.label}</Text>
          </View>
        </View>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
          Tap for per-factor breakdown and tips
        </Text>
      </View>

      <Text style={{ fontSize: 16, color: colors.text.muted }}>›</Text>
    </Pressable>
  );
}

const hsStyles = StyleSheet.create({
  band:        { flexDirection: 'row', alignItems: 'center' },
  scoreCircle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});

// ── Zone 3: CashFlowStrip ─────────────────────────────────────────────────────

function CashFlowStrip({ income, expenses, saved, onPress, loading }: {
  income: number; expenses: number; saved: number;
  onPress: () => void; loading: boolean;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt: fmtPh } = useCurrency();

  if (loading) {
    return <SkeletonBox height={70} borderRadius={borderRadius.card} />;
  }

  const cols = [
    { label: 'Income',   value: fmtPh(income),   color: colors.income },
    { label: 'Expenses', value: fmtPh(expenses),  color: colors.expense },
    { label: 'Saved',    value: fmtPh(saved),     color: saved >= 0 ? colors.text.primary : colors.expense },
  ];

  return (
    <Pressable
      onPress={onPress}
      style={[
        cfStyles.strip,
        shadows.card,
        { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card },
      ]}
    >
      {cols.map((col, i) => (
        <View
          key={col.label}
          style={[
            cfStyles.col,
            { paddingVertical: spacing[4] },
            i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border.subtle },
          ]}
        >
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: col.color, letterSpacing: -0.3 }} numberOfLines={1} adjustsFontSizeToFit>
            {col.value}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 3 }}>
            {col.label}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}

const cfStyles = StyleSheet.create({
  strip: { flexDirection: 'row' },
  col:   { flex: 1, alignItems: 'center' },
});

// ── Zone 4: BudgetProgressRow ─────────────────────────────────────────────────

function BudgetProgressRow({ icon, label, spent, limit, onPress }: {
  icon: string; label: string; spent: number; limit: number; onPress: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  const { fmt: fmtPh } = useCurrency();

  const ratio   = limit > 0 ? spent / limit : 0;
  const isOver  = ratio > 1;
  const pct     = Math.min(Math.round(ratio * 100), 999);

  return (
    <Pressable
      onPress={onPress}
      style={{ paddingVertical: spacing[3], paddingHorizontal: spacing[4] }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], flex: 1 }}>
          <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{label}</Text>
          {isOver && (
            <View style={{ backgroundColor: `${colors.expense}18`, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.expense }}>OVER</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: isOver ? colors.expense : colors.text.secondary }}>
          {fmtPh(spent)} / {fmtPh(limit)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <ProgressBar ratio={ratio} height={5} style={{ flex: 1 }} />
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.medium, color: isOver ? colors.expense : colors.text.muted, minWidth: 32, textAlign: 'right' }}>
          {pct}%
        </Text>
      </View>
    </Pressable>
  );
}

// ── Zone 5: GoalChip ──────────────────────────────────────────────────────────

function GoalChip({ emoji, name, savedAmount, targetAmount, color, onPress }: {
  emoji: string; name: string; savedAmount: number; targetAmount: number;
  color: string; onPress: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmtCompact: fmtK } = useCurrency();

  const pct = targetAmount > 0 ? Math.round((savedAmount / targetAmount) * 100) : 0;

  return (
    <Pressable
      onPress={onPress}
      style={[
        gcStyles.chip,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[3],
          width:           SCREEN_W * 0.44,
          minWidth:        160,
        },
      ]}
    >
      <Text style={{ fontSize: 24, lineHeight: 30 }}>{emoji}</Text>
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[1] }} numberOfLines={1}>
        {name}
      </Text>
      {/* Thin progress bar */}
      <View style={{ height: 3, backgroundColor: colors.bg.surfaceMuted, borderRadius: 2, marginTop: spacing[2] }}>
        <View style={{ height: 3, width: `${Math.min(pct, 100)}%`, backgroundColor: color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[1] }}>
        {pct}% · {fmtK(savedAmount)}
      </Text>
    </Pressable>
  );
}

const gcStyles = StyleSheet.create({ chip: {} });

// ── DashboardScreen ───────────────────────────────────────────────────────────

export function DashboardScreen({ navigation }: Props) {
  const theme       = useTheme();
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt: fmtPh } = useCurrency();

  // Tutorial tour
  const tour = useTutorialTour(TUTORIAL.DASHBOARD, DASHBOARD_STEPS);
  const setTutorialCompleted = useAppStore(s => s.setTutorialCompleted);
  const user    = useAuthStore(s => s.user);
  const { data: userProfile } = useUserProfile();

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash }  = useDashboard();
  const { data: txns,      isLoading: txLoading,   refetch: refetchTxns }  = useTransactions();
  const { data: budgets,   isLoading: budgLoading,  refetch: refetchBudg }  = useBudgets();
  const { data: goals,     isLoading: goalLoading,  refetch: refetchGoals } = useSavingsGoals();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDash(), refetchTxns(), refetchBudg(), refetchGoals()]);
    setRefreshing(false);
  }, [refetchDash, refetchTxns, refetchBudg, refetchGoals]);

  // ── Health score ───────────────────────────────────────────────────────────

  const healthScore = useMemo(() => {
    if (!dashboard) return null;
    const emergencyMonths = dashboard.monthlyExpenses > 0
      ? dashboard.totalBalance / dashboard.monthlyExpenses : 0;
    const annualIncome = dashboard.monthlyIncome * 12;
    const { total } = computeHealthScore({
      savingsRate:     dashboard.savingsRate,
      emergencyMonths,
      debtRatio:       annualIncome > 0 ? dashboard.totalDebts / annualIncome : 0,
      goalProgress:    goals && goals.length > 0
        ? goals.reduce((s, g) => s + g.savedAmount / g.targetAmount, 0) / goals.length : 0,
    });
    return total;
  }, [dashboard, goals]);

  // ── Derived data ───────────────────────────────────────────────────────────

  const recentTxns = useMemo(() => {
    return [...(txns ?? [])]
      .sort((a, b) => {
        const dc = b.date.localeCompare(a.date);
        return dc !== 0 ? dc : b.time.localeCompare(a.time);
      })
      .slice(0, 5);
  }, [txns]);

  const topBudgets = useMemo(() => {
    return [...(budgets ?? [])]
      .sort((a, b) => {
        const ra = a.limit > 0 ? a.spent / a.limit : 0;
        const rb = b.limit > 0 ? b.spent / b.limit : 0;
        return rb - ra;
      })
      .slice(0, 3);
  }, [budgets]);

  const saved = useMemo(() => {
    if (!dashboard) return 0;
    return dashboard.monthlyIncome - dashboard.monthlyExpenses;
  }, [dashboard]);

  // ── Stagger animations ─────────────────────────────────────────────────────

  const aHeader = useSharedValue(0);
  const aZ1     = useSharedValue(0);
  const aZ2     = useSharedValue(0);
  const aZ3     = useSharedValue(0);
  const aZ4     = useSharedValue(0);
  const aZ5     = useSharedValue(0);
  const aZ6     = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    aHeader.value = withDelay(0,   withTiming(1, { duration: 380, easing: e }));
    aZ1.value     = withDelay(60,  withTiming(1, { duration: 420, easing: e }));
    aZ2.value     = withDelay(140, withTiming(1, { duration: 420, easing: e }));
    aZ3.value     = withDelay(200, withTiming(1, { duration: 400, easing: e }));
    aZ4.value     = withDelay(260, withTiming(1, { duration: 400, easing: e }));
    aZ5.value     = withDelay(320, withTiming(1, { duration: 400, easing: e }));
    aZ6.value     = withDelay(380, withTiming(1, { duration: 400, easing: e }));
  }, []);

  const sHeader = useAnimatedStyle(() => ({
    opacity:   aHeader.value,
    transform: [{ translateY: interpolate(aHeader.value, [0, 1], [12, 0]) }],
  }));
  const sZ1 = useAnimatedStyle(() => ({
    opacity:   aZ1.value,
    transform: [{ translateY: interpolate(aZ1.value, [0, 1], [24, 0]) }],
  }));
  const sZ2 = useAnimatedStyle(() => ({
    opacity:   aZ2.value,
    transform: [{ translateY: interpolate(aZ2.value, [0, 1], [18, 0]) }],
  }));
  const sZ3 = useAnimatedStyle(() => ({
    opacity:   aZ3.value,
    transform: [{ translateY: interpolate(aZ3.value, [0, 1], [16, 0]) }],
  }));
  const sZ4 = useAnimatedStyle(() => ({
    opacity:   aZ4.value,
    transform: [{ translateY: interpolate(aZ4.value, [0, 1], [16, 0]) }],
  }));
  const sZ5 = useAnimatedStyle(() => ({
    opacity:   aZ5.value,
    transform: [{ translateY: interpolate(aZ5.value, [0, 1], [16, 0]) }],
  }));
  const sZ6 = useAnimatedStyle(() => ({
    opacity:   aZ6.value,
    transform: [{ translateY: interpolate(aZ6.value, [0, 1], [16, 0]) }],
  }));

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    ?? (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email?.split('@')[0]
    ?? '';
  const firstName  = displayName.split(' ')[0] || 'there';
  const avatarInit = displayName ? displayName[0].toUpperCase() : 'W';
  const avatarUrl  = userProfile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined);

  // Shared loading flag for hero zones
  const coreLoading = dashLoading || goalLoading;

  // Tab navigator for cross-tab navigation
  function goToTab(tab: keyof MainTabParamList) {
    const p = navigation.getParent<NavigationProp<MainTabParamList>>();
    p?.navigate(tab as never);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + spacing[2], paddingBottom: spacing[12] ?? 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, sHeader, { paddingHorizontal: spacing[5] }]}>
          <View style={{ flex: 1, marginRight: spacing[3] }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              {getGreeting()},
            </Text>
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4, marginTop: 2, lineHeight: 30 }}>
              {firstName} 👋
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Pressable
              onPress={() => navigation.push('Notifications')}
              style={[styles.iconBtn, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full }]}
              accessibilityLabel={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Text style={{ fontSize: 18, lineHeight: 24 }}>🔔</Text>
              {unreadCount > 0 && (
                <View style={{
                  position:         'absolute',
                  top:              0,
                  right:            0,
                  minWidth:         16,
                  height:           16,
                  borderRadius:     8,
                  backgroundColor:  colors.expense,
                  alignItems:       'center',
                  justifyContent:   'center',
                  paddingHorizontal: unreadCount > 9 ? 3 : 0,
                  borderWidth:      1.5,
                  borderColor:      colors.bg.surfaceMuted,
                }}>
                  <Text style={{ fontSize: 9, fontFamily: fontFamily.bold, color: '#FFFFFF', lineHeight: 12 }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={() => navigation.push('Profile')}
              style={[styles.avatar, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.full, overflow: 'hidden' }]}
              accessibilityLabel="Profile"
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 40, height: 40 }} />
              ) : (
                <Text style={{ fontSize: 16, fontFamily: fontFamily.bold, color: '#FFFFFF', lineHeight: 20 }}>
                  {avatarInit}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Zone 1: Net Worth Hero Card ─────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5], paddingHorizontal: spacing[5] }, sZ1]}>
          <NetWorthCard
            netWorth={dashboard?.netWorth ?? 0}
            delta={dashboard?.balanceDelta ?? 0}
            deltaPct={dashboard?.balanceDeltaPct ?? 0}
            totalAssets={dashboard?.totalAssets ?? 0}
            totalDebts={dashboard?.totalDebts ?? 0}
            investmentValue={dashboard?.investmentValue ?? 0}
            onPress={() => goToTab('Wealth')}
            loading={coreLoading}
          />
        </Animated.View>

        {/* ── Zone 2: Financial Health Score ─────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[4], paddingHorizontal: spacing[5] }, sZ2]}>
          <HealthScoreBand
            score={healthScore}
            onPress={() => navigation.push('HealthScoreDetail')}
            loading={coreLoading}
          />
        </Animated.View>

        {/* ── Zone 3: Monthly Cash Flow Strip ────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[4], paddingHorizontal: spacing[5] }, sZ3]}>
          <CashFlowStrip
            income={dashboard?.monthlyIncome ?? 0}
            expenses={dashboard?.monthlyExpenses ?? 0}
            saved={saved}
            onPress={() => goToTab('Transactions')}
            loading={dashLoading}
          />
        </Animated.View>

        {/* ── Zone 4: Budget Progress ─────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, sZ4]}>
          <SectionHeader
            title="Budget Progress"
            actionLabel="All →"
            onAction={() => goToTab('Budget')}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[2] }}
          />
          {budgLoading ? (
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              <SkeletonBox height={56} />
              <SkeletonBox height={56} />
              <SkeletonBox height={56} />
            </View>
          ) : topBudgets.length === 0 ? (
            <Pressable
              onPress={() => goToTab('Budget')}
              style={[styles.emptyCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[5] }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
                No budget set yet — set one up in 2 minutes
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.accent.primary, textAlign: 'center', marginTop: spacing[2] }}>
                Set Up Budget →
              </Text>
            </Pressable>
          ) : (
            <View style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
              {topBudgets.map((b, i) => (
                <View key={b.id}>
                  {i > 0 && <View style={{ height: 1, backgroundColor: colors.border.subtle }} />}
                  <BudgetProgressRow
                    icon={b.icon}
                    label={b.label}
                    spent={b.spent}
                    limit={b.limit}
                    onPress={() => goToTab('Budget')}
                  />
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── Zone 5: Savings Goals ──────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, sZ5]}>
          <SectionHeader
            title="Savings Goals"
            actionLabel="All →"
            onAction={() => goToTab('Wealth')}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />
          {goalLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
              <SkeletonBox width={SCREEN_W * 0.44} height={108} borderRadius={borderRadius.card} />
              <SkeletonBox width={SCREEN_W * 0.44} height={108} borderRadius={borderRadius.card} />
            </ScrollView>
          ) : (goals ?? []).length === 0 ? (
            <Pressable
              onPress={() => goToTab('Wealth')}
              style={[styles.emptyCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[5] }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
                Start a goal — what are you saving for?
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.accent.primary, textAlign: 'center', marginTop: spacing[2] }}>
                Create Goal →
              </Text>
            </Pressable>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: spacing[5], paddingRight: spacing[5], paddingBottom: spacing[2], gap: spacing[3] }}
            >
              {(goals ?? []).map(g => (
                <GoalChip
                  key={g.id}
                  emoji={g.emoji}
                  name={g.name}
                  savedAmount={g.savedAmount}
                  targetAmount={g.targetAmount}
                  color={g.color}
                  onPress={() => goToTab('Wealth')}
                />
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Zone 6: Recent Transactions ────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, sZ6]}>
          <SectionHeader
            title="Recent Transactions"
            actionLabel="See All"
            onAction={() => goToTab('Transactions')}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />
          {txLoading ? (
            <View style={{ paddingHorizontal: spacing[5], gap: spacing[2] }}>
              {[1, 2, 3].map(i => <SkeletonBox key={i} height={60} />)}
            </View>
          ) : recentTxns.length === 0 ? (
            <Pressable
              onPress={() => navigation.getParent()?.getParent()?.navigate('QuickAddSheet' as never)}
              style={[styles.emptyCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[5] }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
                No transactions yet — add your first one
              </Text>
            </Pressable>
          ) : (
            <View style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
              {recentTxns.map((tx, i) => (
                <ExpenseItem
                  key={tx.id}
                  id={tx.id}
                  merchant={tx.merchant}
                  categoryKey={tx.category}
                  categoryLabel={tx.categoryLabel}
                  categoryIcon={<Text style={{ fontSize: 18, lineHeight: 22 }}>{tx.categoryIcon}</Text>}
                  amount={fmtPh(tx.amount)}
                  type={tx.type}
                  date={formatDateLabel(tx.date)}
                  time={tx.time}
                  showDivider={i < recentTxns.length - 1}
                  onPress={() => navigation.push('TransactionDetail', { id: tx.id, type: tx.type })}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Dashboard tutorial overlay */}
      <CoachmarkOverlay
        steps={DASHBOARD_STEPS}
        visible={tour.visible}
        stepIndex={tour.stepIndex}
        total={tour.total}
        stepRefs={[null, null]}
        onNext={tour.next}
        onSkip={tour.skip}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyCard: { alignItems: 'center' },
});

export default DashboardScreen;
