import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useSavingsGoals } from '../../../hooks/queries/useSavingsGoals';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import type { SavingsGoal } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'GoalAchieved'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CONFETTI_EMOJIS = ['🎊', '🎉', '⭐', '✨', '🏆', '🌟'];
const NUM_PARTICLES   = 18;

// ─── Confetti particle hook ───────────────────────────────────────────────────

interface Particle {
  x:     Animated.Value;
  y:     Animated.Value;
  rot:   Animated.Value;
  scale: Animated.Value;
  emoji: string;
  delay: number;
}

function useParticles(): Particle[] {
  return useMemo(
    () =>
      Array.from({ length: NUM_PARTICLES }).map((_, i) => ({
        x:     new Animated.Value(0),
        y:     new Animated.Value(0),
        rot:   new Animated.Value(0),
        scale: new Animated.Value(0),
        emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
        delay: i * 70,
      })),
    [],
  );
}

// ─── GoalAchievedScreen ───────────────────────────────────────────────────────

export function GoalAchievedScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { fmtCompact: fmt } = useCurrency();
  const { goalId } = route.params;

  const { data: goals } = useSavingsGoals();
  const goal = useMemo<SavingsGoal | undefined>(
    () => goals?.find(g => g.id === goalId),
    [goals, goalId],
  );

  const topPad    = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad    = insets.bottom > 0 ? insets.bottom : 24;
  const goalColor = goal?.color ?? colors.income;

  // Hero entrance animations — Reanimated (runs on UI thread)
  const trophyEntrance = useSharedValue(0);  // 0→1 fade+scale in
  const trophyScale    = useSharedValue(1);  // pulse after entrance
  const textAnim       = useSharedValue(0);
  const btnAnim        = useSharedValue(0);

  const trophyStyle = useAnimatedStyle(() => ({
    opacity:   trophyEntrance.value,
    transform: [{
      scale: interpolate(trophyEntrance.value, [0, 1], [0.4, 1]) * trophyScale.value,
    }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity:   textAnim.value,
    transform: [{ translateY: interpolate(textAnim.value, [0, 1], [16, 0]) }],
  }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity:   btnAnim.value,
    transform: [{ translateY: interpolate(btnAnim.value, [0, 1], [12, 0]) }],
  }));

  // Legacy Animated kept for confetti only — Math.random() cannot run in Reanimated worklets
  const particles = useParticles();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const e = Easing.out(Easing.cubic);

    // Trophy entrance, then a bounce pulse once it lands
    trophyEntrance.value = withDelay(100, withTiming(1, { duration: 350, easing: e }));
    trophyScale.value    = withDelay(550, withSequence(
      withSpring(1.25, { damping: 8, stiffness: 200 }),
      withSpring(1.0,  { damping: 14, stiffness: 180 }),
    ));

    textAnim.value = withDelay(420, withTiming(1, { duration: 380, easing: e }));
    btnAnim.value  = withDelay(620, withTiming(1, { duration: 320, easing: e }));

    // Confetti burst
    particles.forEach(p => {
      const tx = (Math.random() - 0.5) * 280;
      const ty = -(Math.random() * 320 + 60);
      const dir = Math.random() > 0.5 ? 1 : -1;
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.scale, { toValue: 1,         duration: 200, useNativeDriver: true }),
          Animated.timing(p.x,     { toValue: tx,        duration: 1000, useNativeDriver: true }),
          Animated.timing(p.y,     { toValue: ty,        duration: 1000, useNativeDriver: true }),
          Animated.timing(p.rot,   { toValue: 720 * dir, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.timing(p.scale, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Confetti layer ── */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {particles.map((p, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left:     '50%',
              top:      '50%',
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rot.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] }) },
                { scale: p.scale },
              ],
            }}
          >
            <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
          </Animated.View>
        ))}
      </View>

      {/* ── Main content ── */}
      <View style={[styles.content, { paddingTop: topPad, paddingBottom: btmPad, paddingHorizontal: spacing[6] }]}>

        {/* Trophy */}
        <ReAnimated.View style={[{ alignItems: 'center' }, trophyStyle]}>
          <View style={[styles.trophyCircle, { backgroundColor: goalColor + '20', borderRadius: borderRadius.full, width: 120, height: 120, borderWidth: 4, borderColor: goalColor }]}>
            <Text style={{ fontSize: 56, lineHeight: 68 }}>🏆</Text>
          </View>
        </ReAnimated.View>

        {/* Text block */}
        <ReAnimated.View style={[{ alignItems: 'center', marginTop: spacing[6] }, textStyle]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: goalColor, letterSpacing: 2, textTransform: 'uppercase' }}>
            Goal Achieved!
          </Text>
          <Text style={{ fontSize: 28, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[2], textAlign: 'center', lineHeight: 36, letterSpacing: -0.4 }}>
            {goal?.name ?? 'Your Goal'}
          </Text>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3], textAlign: 'center', lineHeight: 26 }}>
            You reached your target and{'\n'}saved {fmt(goal?.targetAmount ?? 0)}. Amazing! 🎉
          </Text>

          {/* Amount badge */}
          <View style={[styles.amtBadge, { backgroundColor: goalColor + '18', borderRadius: borderRadius.cardLg, paddingHorizontal: spacing[6], paddingVertical: spacing[4], marginTop: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1 }}>
              TOTAL SAVED
            </Text>
            <Text style={{ fontSize: 36, fontFamily: fontFamily.bold, color: goalColor, marginTop: spacing[1], letterSpacing: -0.5 }}>
              {fmt(goal?.targetAmount ?? 0)}
            </Text>
          </View>
        </ReAnimated.View>

        {/* Buttons */}
        <ReAnimated.View style={[{ width: '100%', gap: spacing[3], marginTop: spacing[8] }, btnStyle]}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              navigation.popToTop();
            }}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: pressed ? goalColor + 'cc' : goalColor, borderRadius: borderRadius.button, height: 52 },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
              Back to Savings
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              navigation.popToTop();
              // Push CreateGoal after popping — schedule via microtask so stack settles first
              setTimeout(() => navigation.push('CreateGoal'), 50);
            }}
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: 'transparent', borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border.subtle, height: 52, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.text.secondary }}>
              Set a New Goal
            </Text>
          </Pressable>
        </ReAnimated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1 },
  confettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  content:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  trophyCircle:  { alignItems: 'center', justifyContent: 'center' },
  amtBadge:      { alignItems: 'center' },
  btn:           { alignItems: 'center', justifyContent: 'center', width: '100%' },
});

export default GoalAchievedScreen;
