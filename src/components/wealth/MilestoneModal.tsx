import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { useMarkCelebrated } from '../../hooks/queries/useMilestones';
import { useCurrency } from '../../utils/currency';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CONFETTI_COUNT = 28;

// Seeded pseudo-random for deterministic confetti layout
function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface ConfettiDot {
  x:     number;
  y:     number;
  color: string;
  size:  number;
  angle: number;
  dist:  number;
}

const CONFETTI_COLORS = [
  '#755DEF', '#22C55E', '#F97316', '#3B82F6',
  '#EC4899', '#14B8A6', '#EAB308', '#EF4444',
];

function buildConfetti(): ConfettiDot[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    x:     (seededRand(i * 3)     - 0.5) * SCREEN_W * 1.2,
    y:     (seededRand(i * 3 + 1) - 0.5) * SCREEN_H * 0.7,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:  6 + seededRand(i * 3 + 2) * 8,
    angle: seededRand(i * 7) * 360,
    dist:  0.4 + seededRand(i * 5) * 0.6,
  }));
}

const CONFETTI_DOTS = buildConfetti();

function ConfettiPiece({ dot, visible }: { dot: ConfettiDot; visible: boolean }) {
  const tx    = useSharedValue(0);
  const ty    = useSharedValue(0);
  const op    = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      tx.value    = 0;
      ty.value    = 0;
      op.value    = 0;
      scale.value = 0;
      const delay = Math.random() * 200;
      tx.value    = withDelay(delay, withSpring(dot.x * dot.dist, { damping: 12, stiffness: 80 }));
      ty.value    = withDelay(delay, withSpring(dot.y * dot.dist, { damping: 12, stiffness: 80 }));
      scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
      op.value    = withDelay(delay, withTiming(1, { duration: 200 }));
    } else {
      op.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
      { rotate: `${dot.angle}deg` },
    ],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        { top: SCREEN_H / 2, left: SCREEN_W / 2, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      pointerEvents="none"
    >
      <View style={{ width: dot.size, height: dot.size * 0.5, backgroundColor: dot.color, borderRadius: 2 }} />
    </Animated.View>
  );
}

export function MilestoneModal() {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();

  const pendingMilestones   = useAppStore(s => s.pendingMilestones);
  const shiftPendingMilestone = useAppStore(s => s.shiftPendingMilestone);
  const { mutate: markCelebrated } = useMarkCelebrated();

  const current = pendingMilestones[0] ?? null;
  const visible = current !== null;

  // Haptic on appearance
  const prevVisible = useRef(false);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevVisible.current = visible;
  }, [visible]);

  // Card entrance animation
  const cardScale = useSharedValue(0.7);
  const cardOp    = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      cardScale.value = 0.7;
      cardOp.value    = 0;
      cardScale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 150 }));
      cardOp.value    = withDelay(100, withTiming(1, { duration: 200 }));
    }
  }, [visible, current?.id]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity:   cardOp.value,
  }));

  function dismiss() {
    if (current) {
      markCelebrated(current.id);
    }
    shiftPendingMilestone();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Confetti */}
        {CONFETTI_DOTS.map((dot, i) => (
          <ConfettiPiece key={i} dot={dot} visible={visible} />
        ))}

        {/* Card */}
        <Animated.View
          style={[
            styles.card,
            shadows.hero,
            {
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.cardLg,
              padding:         spacing[7],
              marginHorizontal: spacing[6],
            },
            cardStyle,
          ]}
        >
          {/* Emoji */}
          <Text style={styles.emoji}>{current?.emoji ?? '🏆'}</Text>

          {/* Label */}
          <Text style={{
            fontSize:   fontSize.headingLg,
            fontFamily: fontFamily.bold,
            color:      colors.text.primary,
            textAlign:  'center',
            marginTop:  spacing[3],
            letterSpacing: -0.5,
          }}>
            {current?.label}
          </Text>

          {/* Net worth */}
          <Text style={{
            fontSize:   fontSize.bodyLg,
            fontFamily: fontFamily.regular,
            color:      colors.text.muted,
            textAlign:  'center',
            marginTop:  spacing[2],
          }}>
            You reached {fmt(current?.netWorth ?? 0)}
          </Text>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing[5] }} />

          {/* CTA */}
          <Pressable
            onPress={dismiss}
            style={({ pressed }) => [{
              backgroundColor: colors.accent.primary,
              borderRadius:    borderRadius.button,
              paddingVertical: spacing[4],
              alignItems:      'center',
              opacity:         pressed ? 0.85 : 1,
            }]}
          >
            <Text style={{
              fontSize:   fontSize.bodyLg,
              fontFamily: fontFamily.semiBold,
              color:      '#FFFFFF',
            }}>
              Amazing! 🎉
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    lineHeight: 76,
  },
});
