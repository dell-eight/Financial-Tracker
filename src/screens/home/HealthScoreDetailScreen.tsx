import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useDashboard } from '../../hooks/queries/useDashboard';
import { useSavingsGoals } from '../../hooks/queries/useSavingsGoals';
import { computeHealthScore, healthBand } from '../../utils/healthScore';
import type { HomeStackParamList } from '../../navigation/types';
import type { ScoreFactor } from '../../utils/healthScore';

type Props = StackScreenProps<HomeStackParamList, 'HealthScoreDetail'>;

const RING_SIZE   = 160;
const RING_RADIUS = 68;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ score, color }: { score: number; color: string }) {
  const dashOffset = RING_CIRCUM * (1 - score / 100);
  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke="rgba(120,120,120,0.15)"
          strokeWidth={10}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeDasharray={RING_CIRCUM}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
    </View>
  );
}

function FactorRow({ factor, theme }: { factor: ScoreFactor; theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const barProgress = useSharedValue(0);
  useEffect(() => {
    barProgress.value = withTiming(factor.factor, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [factor.factor]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barProgress.value * 100}%` as `${number}%`,
  }));

  const band  = healthBand(Math.round(factor.factor * 100));
  const score = Math.round(factor.factor * 100);

  return (
    <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], marginBottom: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
              {factor.label}
            </Text>
            <View style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.medium, color: colors.text.muted }}>
                {Math.round(factor.weight * 100)}%
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {factor.rawLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: band.color }}>
            {score}
          </Text>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: band.color }}>
            {band.label}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 3, overflow: 'hidden' }}>
        <Animated.View style={[{ height: 6, backgroundColor: band.color, borderRadius: 3 }, barStyle]} />
      </View>

      {/* Tip */}
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: spacing[2], lineHeight: 18 }}>
        {factor.tip}
      </Text>
    </View>
  );
}

export function HealthScoreDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: goals,     isLoading: goalLoading  } = useSavingsGoals();

  const topPad    = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const isLoading = dashLoading || goalLoading;

  const result = useMemo(() => {
    if (!dashboard) return null;
    const emergencyMonths = dashboard.monthlyExpenses > 0
      ? dashboard.totalBalance / dashboard.monthlyExpenses : 0;
    const annualIncome = dashboard.monthlyIncome * 12;
    return computeHealthScore({
      savingsRate:     dashboard.savingsRate,
      emergencyMonths,
      debtRatio:       annualIncome > 0 ? dashboard.totalDebts / annualIncome : 0,
      goalProgress:    goals && goals.length > 0
        ? goals.reduce((s, g) => s + g.savedAmount / g.targetAmount, 0) / goals.length : 0,
    });
  }, [dashboard, goals]);

  const band            = result ? healthBand(result.total) : null;
  const worstFactor     = result
    ? result.factors.reduce((a, b) => a.factor < b.factor ? a : b)
    : null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Health Score
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      {isLoading || !result || !band ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

          {/* Score ring */}
          <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
            <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
              <ScoreRing score={result.total} color={band.color} />
              <View style={{ position: 'absolute', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: band.color, lineHeight: 52 }}>
                  {result.total}
                </Text>
                <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: band.color, letterSpacing: 0.5 }}>
                  {band.label.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
              out of 100 · updated just now
            </Text>
          </View>

          {/* Biggest opportunity */}
          {worstFactor && worstFactor.factor < 1 && (
            <View style={{
              marginHorizontal: spacing[4],
              marginBottom:     spacing[4],
              backgroundColor:  `${band.color}15`,
              borderRadius:     borderRadius.card,
              padding:          spacing[4],
              borderLeftWidth:  3,
              borderLeftColor:  band.color,
            }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: band.color, marginBottom: 4 }}>
                BIGGEST OPPORTUNITY
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>
                {worstFactor.label}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: 2, lineHeight: 18 }}>
                {worstFactor.tip}
              </Text>
            </View>
          )}

          {/* Factor breakdown */}
          <View style={{ paddingHorizontal: spacing[4] }}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: spacing[3] }}>
              Factor Breakdown
            </Text>
            {result.factors.map(f => (
              <FactorRow key={f.label} factor={f} theme={theme} />
            ))}
          </View>

          {/* How is this calculated */}
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[2], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary, marginBottom: spacing[2] }}>
              How is this calculated?
            </Text>
            {[
              { label: 'Savings Rate',   weight: '30%', target: 'Save ≥ 20% of income' },
              { label: 'Emergency Fund', weight: '25%', target: '≥ 6 months of expenses' },
              { label: 'Debt Ratio',     weight: '25%', target: 'Debts < 30% of annual income' },
              { label: 'Goal Progress',  weight: '20%', target: 'All savings goals funded' },
            ].map(row => (
              <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, flex: 1 }}>
                  {row.label} ({row.weight})
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'right', flex: 1 }}>
                  {row.target}
                </Text>
              </View>
            ))}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default HealthScoreDetailScreen;
