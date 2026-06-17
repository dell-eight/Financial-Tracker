import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme }          from '../../hooks/ui/useTheme';
import { useSavingsGoals }   from '../../hooks/queries/useSavingsGoals';
import { useAssets, useDebts } from '../../hooks/queries/useNetWorth';
import { useMonthlyHistory }  from '../../hooks/queries/useAnalytics';
import type { AnalyticsStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';

type Props = StackScreenProps<AnalyticsStackParamList, 'Forecast'>;

function monthsToPayoff(balance: number, monthly: number, rate: number): number {
  if (monthly <= 0) return 999;
  const r = rate / 100 / 12;
  if (r === 0) return Math.ceil(balance / monthly);
  const inside = 1 - (r * balance) / monthly;
  if (inside <= 0) return 999;
  return Math.ceil(-Math.log(inside) / Math.log(1 + r));
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString('en-PH', { month: 'short', year: 'numeric' });
}

function investmentForecast(principal: number, monthly: number, years: number): number {
  const r  = 0.07 / 12;
  const n  = years * 12;
  return Math.round(principal * Math.pow(1 + r, n) + monthly * ((Math.pow(1 + r, n) - 1) / r));
}

// ─── ForecastScreen ───────────────────────────────────────────────────────────

export function ForecastScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();
  const fmtCurrency = fmt;

  const { data: goals         } = useSavingsGoals();
  const { data: debts         } = useDebts();
  const { data: assets        } = useAssets();
  const { data: monthlyHistory } = useMonthlyHistory(6);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const now = new Date();

  const totalAssets = useMemo(() => (assets ?? []).reduce((s, a) => s + a.balance, 0), [assets]);
  const totalDebts  = useMemo(() => (debts  ?? []).reduce((s, d) => s + d.balance,  0), [debts]);
  const netWorth    = totalAssets - totalDebts;

  const investValue = useMemo(
    () => (assets ?? []).filter(a => a.category === 'investment').reduce((s, a) => s + a.balance, 0),
    [assets],
  );

  const hist          = monthlyHistory ?? [];
  const MONTHLY_SAVINGS = useMemo(() => {
    if (hist.length === 0) return 0;
    const recent = hist[hist.length - 1];
    return Math.max(recent.savings, 0);
  }, [hist]);

  const BASE_INVEST  = investValue || 0;
  const BASE_NW      = netWorth   || 0;

  const inv1yr = investmentForecast(BASE_INVEST, MONTHLY_SAVINGS, 1);
  const inv3yr = investmentForecast(BASE_INVEST, MONTHLY_SAVINGS, 3);
  const inv5yr = investmentForecast(BASE_INVEST, MONTHLY_SAVINGS, 5);

  const nw1yr = Math.round(BASE_NW + MONTHLY_SAVINGS * 12  + BASE_INVEST * 0.07);
  const nw3yr = Math.round(BASE_NW + MONTHLY_SAVINGS * 36  + BASE_INVEST * 0.231);
  const nw5yr = Math.round(BASE_NW + MONTHLY_SAVINGS * 60  + BASE_INVEST * 0.403);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const a = [0, 1, 2, 3, 4].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 80, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const as = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 14 }] })));

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Forecast</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Net Worth Trajectory */}
        <Animated.View style={[as[0], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing[3] }}>
              Net Worth Projection
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {[
                { label: 'Today',   value: BASE_NW, color: colors.text.secondary },
                { label: '1 Year',  value: nw1yr,   color: colors.accent.primary },
                { label: '3 Years', value: nw3yr,   color: colors.income },
                { label: '5 Years', value: nw5yr,   color: '#FFD700' },
              ].map((proj, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: 4 }}>{proj.label}</Text>
                  <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: proj.color, letterSpacing: -0.5, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>
                    {fmtShort(proj.value)}
                  </Text>
                </View>
              ))}
            </View>
            <View style={{ marginTop: spacing[4] }}>
              {[
                { label: '1yr', value: nw1yr, color: colors.accent.primary },
                { label: '3yr', value: nw3yr, color: colors.income },
                { label: '5yr', value: nw5yr, color: '#FFD700' },
              ].map(proj => (
                <View key={proj.label} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: 5 }}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, width: 24 }}>{proj.label}</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                    <View style={{ height: '100%', width: `${(proj.value / nw5yr) * 100}%`, backgroundColor: proj.color, borderRadius: 99 }} />
                  </View>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
              Assumes {fmtCurrency(MONTHLY_SAVINGS)}/mo savings + 7% investment growth
            </Text>
          </View>
        </Animated.View>

        {/* Savings Goals ETA */}
        <Animated.View style={[as[1], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Savings Goals ETA
            </Text>
            {(goals ?? []).map(goal => {
              const remaining  = Math.max(goal.targetAmount - goal.savedAmount, 0);
              const monthsLeft = remaining > 0 ? Math.ceil(remaining / MONTHLY_SAVINGS) : 0;
              const eta        = remaining > 0 ? addMonths(now, monthsLeft) : 'Achieved!';
              const pct        = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 100;
              const isComplete = goal.savedAmount >= goal.targetAmount;
              return (
                <View key={goal.id} style={{ marginBottom: spacing[4] }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: 6 }}>
                    <Text style={{ fontSize: 18 }}>{goal.emoji}</Text>
                    <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{goal.name}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isComplete ? colors.income : goal.color }}>
                        {isComplete ? '🎉 Done' : eta}
                      </Text>
                      {!isComplete && (
                        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{monthsLeft}mo away</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <View style={{ flex: 1, height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                      <View style={{ height: '100%', width: `${pct}%`, backgroundColor: isComplete ? colors.income : goal.color, borderRadius: 99 }} />
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, minWidth: 30 }}>{pct.toFixed(0)}%</Text>
                  </View>
                </View>
              );
            })}
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              Based on {fmtCurrency(MONTHLY_SAVINGS)}/mo available for goals
            </Text>
          </View>
        </Animated.View>

        {/* Debt Payoff Timeline */}
        <Animated.View style={[as[2], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Debt Payoff Timeline
            </Text>
            {(debts ?? []).filter(d => d.balance > 0).sort((a, b) => b.interestRate - a.interestRate).map(debt => {
              const months  = monthsToPayoff(debt.balance, debt.monthlyPayment, debt.interestRate);
              const eta     = months < 999 ? addMonths(now, months) : 'Long-term';
              const paidPct = debt.originalAmount > 0
                ? Math.min(((debt.originalAmount - debt.balance) / debt.originalAmount) * 100, 100)
                : 0;
              return (
                <View key={debt.id} style={{ marginBottom: spacing[3], paddingBottom: spacing[3], borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: 6 }}>
                    <Text style={{ fontSize: 16 }}>{debt.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{debt.name}</Text>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{debt.interestRate}% APR · {fmt(debt.monthlyPayment)}/mo</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>{eta}</Text>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>{months}mo left</Text>
                    </View>
                  </View>
                  <View style={{ height: 5, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                    <View style={{ height: '100%', width: `${paidPct}%`, backgroundColor: colors.income, borderRadius: 99 }} />
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Investment Growth — only when there's an investment base or monthly savings */}
        {(BASE_INVEST > 0 || MONTHLY_SAVINGS > 0) && (
        <Animated.View style={[as[3], { marginHorizontal: spacing[5], marginBottom: spacing[4] }]}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>
              Investment Projection (7% Annual)
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[4] }}>
              Starting from {fmtShort(BASE_INVEST)}, adding {fmtShort(MONTHLY_SAVINGS)}/mo
            </Text>
            {[
              { label: '1 Year',  value: inv1yr, color: colors.accent.primary },
              { label: '3 Years', value: inv3yr, color: colors.income },
              { label: '5 Years', value: inv5yr, color: '#FFD700' },
            ].map((proj, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, minWidth: 64 }}>{proj.label}</Text>
                <View style={{ flex: 1, height: 8, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, marginHorizontal: spacing[3] }}>
                  <View style={{ height: '100%', width: `${(proj.value / inv5yr) * 100}%`, backgroundColor: proj.color, borderRadius: 99 }} />
                </View>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: proj.color, minWidth: 56, textAlign: 'right' }}>
                  {fmtShort(proj.value)}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
        )}

        {/* Disclaimer */}
        <Animated.View style={[as[4], { marginHorizontal: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', lineHeight: 20 }}>
            Projections are estimates based on current rates and average returns. Actual results will vary.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default ForecastScreen;
