import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
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

  // Hero entrance animations
  const trophyScale   = useRef(new Animated.Value(0)).current;
  const trophyOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;

  const particles = useParticles();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Entrance sequence
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(trophyScale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 80 }),
        Animated.timing(trophyOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnOpacity,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

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
      <StatusBar style="light" />

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
        <Animated.View style={{ transform: [{ scale: trophyScale }], opacity: trophyOpacity, alignItems: 'center' }}>
          <View style={[styles.trophyCircle, { backgroundColor: goalColor + '20', borderRadius: borderRadius.full, width: 120, height: 120, borderWidth: 4, borderColor: goalColor }]}>
            <Text style={{ fontSize: 56, lineHeight: 68 }}>🏆</Text>
          </View>
        </Animated.View>

        {/* Text block */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: spacing[6] }}>
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
        </Animated.View>

        {/* Buttons */}
        <Animated.View style={{ opacity: btnOpacity, width: '100%', gap: spacing[3], marginTop: spacing[8] }}>
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
        </Animated.View>
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
