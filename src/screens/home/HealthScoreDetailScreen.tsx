import React, { useEffect } from 'react';
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
import { useHealthScore } from '../../hooks/queries/useHealthScore';
import { healthBand, SCORE_BANDS, SCORE_PRESETS } from '../../utils/healthScore';
import type { ScoreFactor, FactorId } from '../../utils/healthScore';
import { useAppStore } from '../../store/app.store';
import type { HomeStackParamList } from '../../navigation/types';
import { WIN, TUTORIAL } from '../../constants/tutorials';

type Props = StackScreenProps<HomeStackParamList, 'HealthScoreDetail'>;

const RING_SIZE   = 160;
const RING_RADIUS = 68;
const RING_CIRCUM = 2 * Math.PI * RING_RADIUS;

const FACTOR_ICONS: Record<FactorId, string> = {
  savings:   '💰',
  emergency: '🛡️',
  debt:      '🔗',
  goal:      '🎯',
};

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

  // Weighted contribution — float arithmetic, round only at display time
  const earnedPts = factor.factor * factor.weight * 100;
  const maxPts    = factor.weight * 100;
  const isMaxed   = Math.abs(earnedPts - maxPts) < 0.5;

  // Next band threshold from centralized constant
  const nextThreshold =
    score < SCORE_BANDS.fair      ? SCORE_BANDS.fair      :
    score < SCORE_BANDS.good      ? SCORE_BANDS.good      :
    score < SCORE_BANDS.excellent ? SCORE_BANDS.excellent : null;

  return (
    <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], marginBottom: spacing[2] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[2] }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text style={{ fontSize: fontSize.bodyLg }}>{FACTOR_ICONS[factor.id]}</Text>
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
          {/* Weighted contribution */}
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.medium, color: isMaxed ? colors.income : colors.text.muted, marginTop: 1 }}>
            {earnedPts.toFixed(0)} / {maxPts.toFixed(0)} pts
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

      {/* Progress bar with target marker */}
      <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 3, position: 'relative' }}>
        <Animated.View style={[{ height: 6, backgroundColor: band.color, borderRadius: 3 }, barStyle]} />
        {nextThreshold !== null && (
          <View style={{
            position:        'absolute',
            left:            `${nextThreshold}%`,
            top:             -2,
            width:           2,
            height:          10,
            borderRadius:    1,
            backgroundColor: colors.text.muted,
            opacity:         0.5,
          }} />
        )}
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

  const healthScoreMode                   = useAppStore(s => s.healthScoreMode);
  const preset                            = SCORE_PRESETS[healthScoreMode];
  const { result, factors, isLoading }    = useHealthScore(healthScoreMode);
  const hasGoals                          = factors?.goalProgress !== null && factors?.goalProgress !== undefined;

  const tutorialVersion      = useAppStore(s => s.tutorialVersion);
  const tutorialsCompleted   = useAppStore(s => s.tutorialsCompleted);
  const setTutorialCompleted = useAppStore(s => s.setTutorialCompleted);

  const tooltipKey = `${TUTORIAL.HEALTH_SCORE}_v${tutorialVersion}`;
  const [tooltipVisible, setTooltipVisible] = React.useState(!tutorialsCompleted[tooltipKey]);

  // Set WIN flag the moment score data loads
  useEffect(() => {
    if (result && !tutorialsCompleted[WIN.HEALTH_SCORE_VIEWED]) {
      setTutorialCompleted(WIN.HEALTH_SCORE_VIEWED);
    }
  }, [!!result]);

  // Auto-dismiss tooltip after 5 seconds
  useEffect(() => {
    if (!tooltipVisible) return;
    const t = setTimeout(() => {
      setTooltipVisible(false);
      setTutorialCompleted(tooltipKey);
    }, 5000);
    return () => clearTimeout(t);
  }, [tooltipVisible]);

  const topPad             = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const band               = result ? healthBand(result.total) : null;
  const activeResultFactors = result
    ? result.factors.filter(f => f.id !== 'goal' || hasGoals)
    : [];
  const worstFactor = activeResultFactors.length > 0
    ? activeResultFactors.reduce((a, b) => a.factor < b.factor ? a : b)
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
        <Pressable
          onPress={() => navigation.push('HealthScoreSettings')}
          hitSlop={12}
          style={{ minWidth: 60, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end', alignSelf: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
            {preset.label}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, color: colors.accent.primary }}>⚙</Text>
        </Pressable>
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

          {/* One-time tooltip: appears below score ring on first visit */}
          {tooltipVisible && (
            <Pressable
              onPress={() => { setTooltipVisible(false); setTutorialCompleted(tooltipKey); }}
              style={{
                marginHorizontal: spacing[5],
                marginBottom:     spacing[4],
                backgroundColor:  colors.bg.surface,
                borderRadius:     borderRadius.card,
                padding:          spacing[4],
                flexDirection:    'row',
                alignItems:       'center',
                gap:              spacing[3],
                borderLeftWidth:  3,
                borderLeftColor:  colors.accent.primary,
              }}
            >
              <Text style={{ fontSize: 20 }}>💚</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: 2 }}>
                  Health Score
                </Text>
                <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                  Your financial fitness score. Tap any section to see how it's calculated.
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted }}>✕</Text>
            </Pressable>
          )}

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
            {activeResultFactors.map(f => (
              <FactorRow key={f.id} factor={f} theme={theme} />
            ))}
          </View>

          {/* How is this calculated */}
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[2], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[2] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
                How is this calculated?
              </Text>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                {preset.label} model
              </Text>
            </View>
            {[
              { label: 'Savings Rate',   weight: preset.weights.savings,   target: 'Save ≥ 20% of income' },
              { label: 'Emergency Fund', weight: preset.weights.emergency,  target: '≥ 6 months of expenses' },
              { label: 'Debt Ratio',     weight: preset.weights.debt,       target: 'Debts < 30% of annual income' },
              ...(hasGoals ? [{ label: 'Goal Progress', weight: preset.weights.goal, target: 'All savings goals funded' }] : []),
            ].map(row => (
              <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, flex: 1 }}>
                  {row.label} ({row.weight}%)
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
