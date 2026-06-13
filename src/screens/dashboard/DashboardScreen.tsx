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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useTheme }                          from '../../hooks/ui/useTheme';
import { useDashboard, useAccounts }         from '../../hooks/queries/useDashboard';
import { useTransactions }                   from '../../hooks/queries/useTransactions';
import { useAuthStore }                      from '../../store/auth.store';
import {
  TransactionCard,
  StatCard,
  SectionHeader,
  ChartCard,
  ExpenseItem,
} from '../../components';
import type { MainTabParamList } from '../../navigation/types';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPh(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(dateStr: string): string {
  const today     = new Date();
  const todayStr  = today.toISOString().split('T')[0];
  const yd        = new Date(today);
  yd.setDate(yd.getDate() - 1);
  const yesterStr = yd.toISOString().split('T')[0];
  if (dateStr === todayStr)  return 'Today';
  if (dateStr === yesterStr) return 'Yesterday';
  const dt = new Date(dateStr + 'T12:00:00');
  return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

// ─── CategoryIcon ─────────────────────────────────────────────────────────────

function CategoryIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>;
}

// ─── BalanceHeroCard ──────────────────────────────────────────────────────────

interface HeroCardProps {
  netWorth:     string;
  delta:        string;
  accountCount: number;
}

function BalanceHeroCard({ netWorth, delta, accountCount }: HeroCardProps) {
  const theme = useTheme();
  const { spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  return (
    <View style={[{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }, shadows.hero]}>
      <LinearGradient
        colors={['#9B85FF', '#5B41D9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[heroCardStyles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
      >
        {/* Decorative circles */}
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <Circle cx="92%" cy="-5%" r={110} fill="rgba(255,255,255,0.07)" />
          <Circle cx="-5%"  cy="115%" r={130} fill="rgba(255,255,255,0.05)" />
          <Circle cx="85%"  cy="105%" r={70}  fill="rgba(255,255,255,0.05)" />
        </Svg>

        <Text
          style={{
            fontSize:      fontSize.bodySm,
            fontFamily:    fontFamily.medium,
            color:         'rgba(255,255,255,0.72)',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}
        >
          Net Worth
        </Text>

        <Text
          style={{
            fontSize:      fontSize.displayXl,
            fontFamily:    fontFamily.bold,
            color:         '#FFFFFF',
            letterSpacing: -1,
            marginTop:     spacing[1],
            lineHeight:    48,
          }}
        >
          {netWorth}
        </Text>

        <View style={heroCardStyles.changeBadge}>
          <View style={heroCardStyles.changeChip}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#4ADE80' }}>
              ↑ {delta}
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>
              this month
            </Text>
          </View>
        </View>

        <View style={[heroCardStyles.bottomRow, { marginTop: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.62)' }}>
            {accountCount} linked {accountCount === 1 ? 'account' : 'accounts'}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.45)' }}>
            Updated just now
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const heroCardStyles = StyleSheet.create({
  card: {
    minHeight:      168,
    overflow:       'hidden',
    justifyContent: 'space-between',
  },
  changeBadge: {
    flexDirection: 'row',
    marginTop:     8,
  },
  changeChip: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   'rgba(255,255,255,0.12)',
    borderRadius:      99,
    paddingHorizontal: 12,
    paddingVertical:   5,
  },
  bottomRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
});

// ─── SpendingBarChart ─────────────────────────────────────────────────────────

const WEEK_DAYS       = 7;
const CHART_CONTENT_W = SCREEN_W - 80;
const BAR_GAP         = 8;
const BAR_H           = 108;
const BAR_W           = Math.floor((CHART_CONTENT_W - BAR_GAP * (WEEK_DAYS - 1)) / WEEK_DAYS);

function SpendingBarChart({ data }: { data: { day: string; amount: number }[] }) {
  const theme  = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const maxAmount            = Math.max(...data.map(d => d.amount), 1);
  const [selected, setSelected] = useState(Math.max(data.length - 2, 0));

  return (
    <View>
      {/* Bar columns */}
      <View style={[barChartStyles.barsRow, { height: BAR_H }]}>
        {data.map((item, i) => {
          const ratio      = item.amount / maxAmount;
          const barHeight  = Math.max(6, Math.round(ratio * BAR_H));
          const isSelected = i === selected;

          return (
            <Pressable
              key={item.day + i}
              onPress={() => setSelected(i)}
              style={[
                barChartStyles.barWrapper,
                {
                  width:          BAR_W,
                  marginRight:    i < data.length - 1 ? BAR_GAP : 0,
                  justifyContent: 'flex-end',
                },
              ]}
              hitSlop={4}
            >
              <View
                style={{
                  width:           BAR_W,
                  height:          barHeight,
                  borderRadius:    4,
                  backgroundColor: isSelected
                    ? colors.accent.primary
                    : `${colors.accent.primary}38`,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      {/* X-axis labels */}
      <View style={[barChartStyles.barsRow, { marginTop: spacing[2] }]}>
        {data.map((item, i) => (
          <Text
            key={item.day + i}
            style={{
              width:       BAR_W,
              marginRight: i < data.length - 1 ? BAR_GAP : 0,
              fontSize:    fontSize.micro,
              fontFamily:  fontFamily.regular,
              color:       i === selected ? colors.text.secondary : colors.text.muted,
              textAlign:   'center',
            }}
          >
            {item.day}
          </Text>
        ))}
      </View>

      {/* Selected value callout */}
      <View style={[barChartStyles.callout, { marginTop: spacing[3] }]}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          {data[selected]?.day}:{'  '}
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          {fmtPh(data[selected]?.amount ?? 0)}
        </Text>
      </View>
    </View>
  );
}

const barChartStyles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    alignItems:    'flex-end',
  },
  barWrapper: {
    alignItems: 'center',
  },
  callout: {
    flexDirection: 'row',
    alignItems:    'center',
  },
});

// ─── SummaryMiniCard ──────────────────────────────────────────────────────────

interface SummaryMiniCardProps {
  icon:    string;
  label:   string;
  amount:  string;
  trend:   string;
  trendUp: boolean;
  iconBg:  string;
}

function SummaryMiniCard({ icon, label, amount, trend, trendUp, iconBg }: SummaryMiniCardProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  const trendColor = trendUp ? colors.income : colors.expense;
  const trendBg    = trendUp ? `${colors.income}1A` : `${colors.expense}1A`;

  return (
    <View
      style={[
        summaryStyles.card,
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.lg,
          padding:         spacing[4],
        },
      ]}
    >
      <View
        style={[
          summaryStyles.iconCircle,
          { backgroundColor: iconBg, borderRadius: borderRadius.full },
        ]}
      >
        <Text style={{ fontSize: 16, lineHeight: 20 }}>{icon}</Text>
      </View>

      <Text
        style={{
          fontSize:   fontSize.bodySm,
          fontFamily: fontFamily.regular,
          color:      colors.text.muted,
          marginTop:  spacing[2],
        }}
        numberOfLines={1}
      >
        {label}
      </Text>

      <Text
        style={{
          fontSize:      fontSize.headingSm,
          fontFamily:    fontFamily.bold,
          color:         colors.text.primary,
          marginTop:     spacing[1],
          letterSpacing: -0.3,
        }}
        numberOfLines={1}
      >
        {amount}
      </Text>

      <View
        style={[
          summaryStyles.trendPill,
          { backgroundColor: trendBg, borderRadius: borderRadius.full, marginTop: spacing[2] },
        ]}
      >
        <Text
          style={{
            fontSize:   fontSize.micro,
            fontFamily: fontFamily.semiBold,
            color:      trendColor,
          }}
        >
          {trendUp ? '↑' : '↓'} {trend}
        </Text>
      </View>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
  },
  iconCircle: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  trendPill: {
    alignSelf:         'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   3,
  },
});

// ─── DashboardScreen ──────────────────────────────────────────────────────────

export function DashboardScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const user                   = useAuthStore(s => s.user);
  const { data: dashboard }    = useDashboard();
  const { data: accountsData } = useAccounts();
  const { data: txns }         = useTransactions();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // ── Derived data ─────────────────────────────────────────────────────────────

  const weekData = useMemo(() => {
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; amount: number }[] = [];
    for (let i = WEEK_DAYS - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const amount  = (txns ?? [])
        .filter(t => t.date === dateStr && t.type === 'expense')
        .reduce((s, t) => s + t.amount, 0);
      result.push({ day: DAY_NAMES[d.getDay()], amount });
    }
    return result;
  }, [txns]);

  const recentTxns = useMemo(() => {
    return [...(txns ?? [])]
      .sort((a, b) => {
        const dc = b.date.localeCompare(a.date);
        return dc !== 0 ? dc : b.time.localeCompare(a.time);
      })
      .slice(0, 5);
  }, [txns]);

  const accountCards = useMemo(() => {
    const typeLabel: Record<string, string> = {
      checking: 'Checking',
      savings:  'Savings',
      credit:   'Credit',
    };
    return (accountsData ?? []).map(acc => ({
      id:              acc.id,
      institutionName: acc.institutionName,
      maskedNumber:    acc.maskedNumber,
      balance:         fmtPh(acc.balance),
      accountType:     typeLabel[acc.type] ?? acc.type,
      gradientIndex:   acc.gradientIndex,
    }));
  }, [accountsData]);

  // ── Animations ───────────────────────────────────────────────────────────────

  const headerAnim  = useSharedValue(0);
  const heroAnim    = useSharedValue(0);
  const acctAnim    = useSharedValue(0);
  const statAnim    = useSharedValue(0);
  const chartAnim   = useSharedValue(0);
  const summaryAnim = useSharedValue(0);
  const txAnim      = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    headerAnim.value  = withDelay(0,   withTiming(1, { duration: 420, easing: e }));
    heroAnim.value    = withDelay(80,  withTiming(1, { duration: 440, easing: e }));
    acctAnim.value    = withDelay(160, withTiming(1, { duration: 440, easing: e }));
    statAnim.value    = withDelay(240, withTiming(1, { duration: 440, easing: e }));
    chartAnim.value   = withDelay(320, withTiming(1, { duration: 440, easing: e }));
    summaryAnim.value = withDelay(400, withTiming(1, { duration: 440, easing: e }));
    txAnim.value      = withDelay(480, withTiming(1, { duration: 440, easing: e }));
  }, []);

  const headerStyle  = useAnimatedStyle(() => ({
    opacity:   headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value,  [0, 1], [12, 0]) }],
  }));
  const heroStyle    = useAnimatedStyle(() => ({
    opacity:   heroAnim.value,
    transform: [{ translateY: interpolate(heroAnim.value,    [0, 1], [24, 0]) }],
  }));
  const acctStyle    = useAnimatedStyle(() => ({
    opacity:   acctAnim.value,
    transform: [{ translateY: interpolate(acctAnim.value,    [0, 1], [20, 0]) }],
  }));
  const statStyle    = useAnimatedStyle(() => ({
    opacity:   statAnim.value,
    transform: [{ translateY: interpolate(statAnim.value,    [0, 1], [18, 0]) }],
  }));
  const chartStyle   = useAnimatedStyle(() => ({
    opacity:   chartAnim.value,
    transform: [{ translateY: interpolate(chartAnim.value,   [0, 1], [20, 0]) }],
  }));
  const summaryStyle = useAnimatedStyle(() => ({
    opacity:   summaryAnim.value,
    transform: [{ translateY: interpolate(summaryAnim.value, [0, 1], [18, 0]) }],
  }));
  const txStyle      = useAnimatedStyle(() => ({
    opacity:   txAnim.value,
    transform: [{ translateY: interpolate(txAnim.value,      [0, 1], [18, 0]) }],
  }));

  const firstName  = user?.name.split(' ')[0] ?? 'there';
  const avatarInit = user?.avatarInitials?.[0] ?? 'W';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop:    topPad + spacing[2],
            paddingBottom: btmPad + spacing[6],
          },
        ]}
      >
        {/* ─── 1. Header ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.header, headerStyle, { paddingHorizontal: spacing[5] }]}
        >
          <View>
            <Text
              style={{
                fontSize:   fontSize.bodySm,
                fontFamily: fontFamily.regular,
                color:      colors.text.muted,
              }}
            >
              Good Morning,
            </Text>
            <Text
              style={{
                fontSize:      fontSize.headingLg,
                fontFamily:    fontFamily.bold,
                color:         colors.text.primary,
                letterSpacing: -0.4,
                marginTop:     2,
                lineHeight:    30,
              }}
            >
              {firstName} 👋
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.bg.surfaceMuted,
                  borderRadius:    borderRadius.full,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
            >
              <Text style={{ fontSize: 18, lineHeight: 24 }}>🔔</Text>
            </Pressable>

            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: colors.accent.primary,
                  borderRadius:    borderRadius.full,
                  marginLeft:      spacing[2],
                },
              ]}
            >
              <Text
                style={{
                  fontSize:   16,
                  fontFamily: fontFamily.bold,
                  color:      '#FFFFFF',
                  lineHeight: 20,
                }}
              >
                {avatarInit}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── 2. Net Worth Hero Card ────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5], paddingHorizontal: spacing[5] }, heroStyle]}>
          <BalanceHeroCard
            netWorth={dashboard ? fmtPh(dashboard.netWorth) : '—'}
            delta={dashboard ? fmtPh(Math.abs(dashboard.balanceDelta)) : '—'}
            accountCount={accountsData?.length ?? 0}
          />
        </Animated.View>

        {/* ─── 3. Account Balance Overview ──────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, acctStyle]}>
          <SectionHeader
            title="My Accounts"
            actionLabel="View All"
            onAction={() => {}}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft:  spacing[5],
              paddingRight: spacing[5],
            }}
          >
            {accountCards.map((acc, i) => (
              <TransactionCard
                key={acc.id}
                institutionName={acc.institutionName}
                maskedNumber={acc.maskedNumber}
                balance={acc.balance}
                accountType={acc.accountType}
                gradientIndex={acc.gradientIndex}
                style={{
                  width:       SCREEN_W * 0.68,
                  minWidth:    240,
                  marginRight: i < accountCards.length - 1 ? spacing[3] : 0,
                }}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* ─── 4. Income / Expense summary row ──────────────────────────────── */}
        <Animated.View
          style={[
            styles.statsRow,
            statStyle,
            {
              paddingHorizontal: spacing[5],
              marginTop:         spacing[5],
              gap:               spacing[3],
            },
          ]}
        >
          <StatCard
            type="income"
            amount={dashboard ? fmtPh(dashboard.monthlyIncome) : '—'}
            label="Total Income"
          />
          <StatCard
            type="expense"
            amount={dashboard ? fmtPh(dashboard.monthlyExpenses) : '—'}
            label="Total Expenses"
          />
        </Animated.View>

        {/* ─── 5. Spending Chart ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            { paddingHorizontal: spacing[5], marginTop: spacing[5] },
            chartStyle,
          ]}
        >
          <ChartCard
            title="Spending Overview"
            subtitle="This week"
            minHeight={220}
            action={
              <Pressable
                style={[
                  styles.periodBtn,
                  {
                    backgroundColor: colors.bg.surfaceMuted,
                    borderRadius:    borderRadius.full,
                  },
                ]}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text
                  style={{
                    fontSize:   fontSize.bodySm,
                    fontFamily: fontFamily.medium,
                    color:      colors.text.secondary,
                  }}
                >
                  Weekly ▾
                </Text>
              </Pressable>
            }
          >
            <SpendingBarChart data={weekData} />
          </ChartCard>
        </Animated.View>

        {/* ─── 6. Financial Summary ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            { paddingHorizontal: spacing[5], marginTop: spacing[5] },
            summaryStyle,
          ]}
        >
          <SectionHeader title="Financial Summary" style={{ marginBottom: spacing[3] }} />

          <View style={[styles.summaryRow, { gap: spacing[3] }]}>
            <SummaryMiniCard
              icon="💳"
              label="Spending"
              amount={dashboard ? fmtPh(dashboard.monthlyExpenses) : '—'}
              trend="8.2% vs last mo"
              trendUp={false}
              iconBg="rgba(239,68,68,0.15)"
            />
            <SummaryMiniCard
              icon="🏦"
              label="Savings"
              amount={dashboard ? fmtPh(dashboard.totalBalance) : '—'}
              trend="12.5% growth"
              trendUp={true}
              iconBg="rgba(34,197,94,0.15)"
            />
          </View>

          <View style={[styles.summaryRow, { gap: spacing[3], marginTop: spacing[3] }]}>
            <SummaryMiniCard
              icon="📈"
              label="Investments"
              amount="₱6,890"
              trend="4.1% return"
              trendUp={true}
              iconBg="rgba(123,97,255,0.15)"
            />
            <SummaryMiniCard
              icon="🎯"
              label="Goals"
              amount="₱1,200"
              trend="60% complete"
              trendUp={true}
              iconBg="rgba(59,130,246,0.15)"
            />
          </View>
        </Animated.View>

        {/* ─── 7. Recent Transactions ────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5] }, txStyle]}>
          <SectionHeader
            title="Recent Transactions"
            actionLabel="See All"
            onAction={() => {}}
            style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}
          />

          <View
            style={[
              styles.txList,
              shadows.card,
              {
                backgroundColor:  colors.bg.surface,
                borderRadius:     borderRadius.card,
                marginHorizontal: spacing[5],
                overflow:         'hidden',
              },
            ]}
          >
            {recentTxns.map((tx, i) => (
              <ExpenseItem
                key={tx.id}
                id={tx.id}
                merchant={tx.merchant}
                categoryKey={tx.category}
                categoryLabel={tx.categoryLabel}
                categoryIcon={<CategoryIcon icon={tx.categoryIcon} />}
                amount={fmtPh(tx.amount)}
                type={tx.type}
                date={formatDateLabel(tx.date)}
                time={tx.time}
                showDivider={i < recentTxns.length - 1}
              />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  iconBtn: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  avatar: {
    width:          40,
    height:         40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical:   5,
  },
  summaryRow: {
    flexDirection: 'row',
  },
  txList: {
    // overflow hidden for border radius clipping
  },
});

export default DashboardScreen;
