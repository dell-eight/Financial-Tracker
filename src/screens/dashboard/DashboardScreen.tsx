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
import Svg, { Circle } from 'react-native-svg';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '../../hooks/ui/useTheme';
import {
  TransactionCard,
  StatCard,
  SectionHeader,
  ChartCard,
  ExpenseItem,
} from '../../components';
import type { MainTabParamList } from '../../navigation/types';
import type { CategoryKey } from '../../theme';

type Props = BottomTabScreenProps<MainTabParamList, 'Home'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACCOUNTS = [
  { id: '1', institutionName: 'Chase',           maskedNumber: '•••• 4242', balance: '$12,922.84', accountType: 'Debit',   gradientIndex: 0 },
  { id: '2', institutionName: 'Bank of America', maskedNumber: '•••• 8801', balance: '$8,450.00',  accountType: 'Savings', gradientIndex: 1 },
  { id: '3', institutionName: 'Citi',            maskedNumber: '•••• 5599', balance: '$3,191.96',  accountType: 'Credit',  gradientIndex: 2 },
];

const WEEK_DATA = [
  { day: 'Mon', amount: 45  },
  { day: 'Tue', amount: 120 },
  { day: 'Wed', amount: 80  },
  { day: 'Thu', amount: 200 },
  { day: 'Fri', amount: 160 },
  { day: 'Sat', amount: 95  },
  { day: 'Sun', amount: 60  },
];

interface TxData {
  id:            string;
  merchant:      string;
  categoryKey:   CategoryKey;
  categoryLabel: string;
  icon:          string;
  amount:        string;
  type:          'income' | 'expense';
  date:          string;
  time:          string;
}

const TRANSACTIONS: TxData[] = [
  { id: 't1', merchant: 'Starbucks',      categoryKey: 'food',          categoryLabel: 'Food & Dining',  icon: '☕', amount: '$6.50',     type: 'expense', date: 'Today',     time: '9:12 AM'  },
  { id: 't2', merchant: 'Netflix',        categoryKey: 'entertainment', categoryLabel: 'Entertainment',  icon: '🎬', amount: '$15.99',    type: 'expense', date: 'Today',     time: '8:00 AM'  },
  { id: 't3', merchant: 'Salary Deposit', categoryKey: 'other',         categoryLabel: 'Income',         icon: '💰', amount: '$4,200.00', type: 'income',  date: 'Yesterday', time: '12:00 PM' },
  { id: 't4', merchant: 'Uber',           categoryKey: 'transport',     categoryLabel: 'Transport',      icon: '🚗', amount: '$12.40',    type: 'expense', date: 'Yesterday', time: '7:30 PM'  },
  { id: 't5', merchant: 'Amazon',         categoryKey: 'shopping',      categoryLabel: 'Shopping',       icon: '🛍', amount: '$89.99',    type: 'expense', date: 'Jun 10',    time: '3:45 PM'  },
];

// ─── CategoryIcon ─────────────────────────────────────────────────────────────

function CategoryIcon({ icon }: { icon: string }) {
  return <Text style={{ fontSize: 18, lineHeight: 22 }}>{icon}</Text>;
}

// ─── BalanceHeroCard ──────────────────────────────────────────────────────────

function BalanceHeroCard({ style }: { style?: object }) {
  const theme = useTheme();
  const { spacing, borderRadius, fontSize, fontFamily, shadows } = theme;

  return (
    <View style={[{ borderRadius: borderRadius.cardLg, overflow: 'hidden' }, shadows.hero, style]}>
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
          $24,563.80
        </Text>

        <View style={heroCardStyles.changeBadge}>
          <View style={heroCardStyles.changeChip}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#4ADE80' }}>
              ↑ +$342.50
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.6)', marginLeft: 6 }}>
              this month
            </Text>
          </View>
        </View>

        <View style={[heroCardStyles.bottomRow, { marginTop: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: 'rgba(255,255,255,0.62)' }}>
            3 linked accounts
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

// Available chart content width = SCREEN_W - 2*screenPad - 2*cardPad
// screenPad (spacing[5]=20) × 2 = 40, cardPad (spacing[5]=20) × 2 = 40
const CHART_CONTENT_W = SCREEN_W - 80;
const BAR_GAP         = 8;
const BAR_H           = 108;
const BAR_W           = Math.floor((CHART_CONTENT_W - BAR_GAP * (WEEK_DATA.length - 1)) / WEEK_DATA.length);

function SpendingBarChart() {
  const theme  = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const maxAmount   = Math.max(...WEEK_DATA.map(d => d.amount));
  const [selected, setSelected] = useState(3); // Thu — peak day

  return (
    <View>
      {/* Bar columns */}
      <View style={[barChartStyles.barsRow, { height: BAR_H }]}>
        {WEEK_DATA.map((item, i) => {
          const ratio      = item.amount / maxAmount;
          const barHeight  = Math.max(6, Math.round(ratio * BAR_H));
          const isSelected = i === selected;

          return (
            <Pressable
              key={item.day}
              onPress={() => setSelected(i)}
              style={[
                barChartStyles.barWrapper,
                {
                  width:       BAR_W,
                  marginRight: i < WEEK_DATA.length - 1 ? BAR_GAP : 0,
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
        {WEEK_DATA.map((item, i) => (
          <Text
            key={item.day}
            style={{
              width:        BAR_W,
              marginRight:  i < WEEK_DATA.length - 1 ? BAR_GAP : 0,
              fontSize:     fontSize.micro,
              fontFamily:   fontFamily.regular,
              color:        i === selected ? colors.text.secondary : colors.text.muted,
              textAlign:    'center',
            }}
          >
            {item.day}
          </Text>
        ))}
      </View>

      {/* Selected value callout */}
      <View style={[barChartStyles.callout, { marginTop: spacing[3] }]}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
          {WEEK_DATA[selected].day}:{'  '}
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          ${WEEK_DATA[selected].amount}
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

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  // Staggered entrance animations
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
              John Doe 👋
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
                J
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ─── 2. Net Worth Hero Card ────────────────────────────────────────── */}
        <Animated.View style={[{ marginTop: spacing[5], paddingHorizontal: spacing[5] }, heroStyle]}>
          <BalanceHeroCard />
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
            {ACCOUNTS.map((acc, i) => (
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
                  marginRight: i < ACCOUNTS.length - 1 ? spacing[3] : 0,
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
          <StatCard type="income"  amount="$6,240.00" label="Total Income"   />
          <StatCard type="expense" amount="$2,180.50" label="Total Expenses"  />
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
            <SpendingBarChart />
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
              amount="$2,180"
              trend="8.2% vs last mo"
              trendUp={false}
              iconBg="rgba(239,68,68,0.15)"
            />
            <SummaryMiniCard
              icon="🏦"
              label="Savings"
              amount="$8,450"
              trend="12.5% growth"
              trendUp={true}
              iconBg="rgba(34,197,94,0.15)"
            />
          </View>

          <View style={[styles.summaryRow, { gap: spacing[3], marginTop: spacing[3] }]}>
            <SummaryMiniCard
              icon="📈"
              label="Investments"
              amount="$6,890"
              trend="4.1% return"
              trendUp={true}
              iconBg="rgba(123,97,255,0.15)"
            />
            <SummaryMiniCard
              icon="🎯"
              label="Goals"
              amount="$1,200"
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
                backgroundColor: colors.bg.surface,
                borderRadius:    borderRadius.card,
                marginHorizontal: spacing[5],
                overflow:         'hidden',
              },
            ]}
          >
            {TRANSACTIONS.map((tx, i) => (
              <ExpenseItem
                key={tx.id}
                id={tx.id}
                merchant={tx.merchant}
                categoryKey={tx.categoryKey}
                categoryLabel={tx.categoryLabel}
                categoryIcon={<CategoryIcon icon={tx.icon} />}
                amount={tx.amount}
                type={tx.type}
                date={tx.date}
                time={tx.time}
                showDivider={i < TRANSACTIONS.length - 1}
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
