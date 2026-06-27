import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const TOAST_DURATION_MS = 2200;

const CONFETTI_COLORS = ['#755DEF', '#22C55E', '#F97316', '#3B82F6', '#EC4899', '#14B8A6', '#EAB308', '#EF4444'];
const CONFETTI_COUNT = 12;

// Seeded random for deterministic confetti positions per toast instance
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return ((s >>> 0) / 0xffffffff);
  };
}

interface ConfettiDot {
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
}

function buildDots(): ConfettiDot[] {
  const rng = seeded(42);
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size:   5 + rng() * 5,
    x:      (rng() - 0.5) * 280,
    y:      -(60 + rng() * 120),
    delay:  rng() * 150,
  }));
}

const DOTS = buildDots();

interface ConfettiProps { active: boolean }

function ConfettiBurst({ active }: ConfettiProps) {
  const anims = DOTS.map(() => ({
    scale:    useSharedValue(0),
    opacity:  useSharedValue(0),
    tx:       useSharedValue(0),
    ty:       useSharedValue(0),
  }));

  useEffect(() => {
    if (active) {
      DOTS.forEach((dot, i) => {
        const { scale, opacity, tx, ty } = anims[i];
        opacity.value = withDelay(dot.delay, withTiming(1, { duration: 100 }));
        scale.value   = withDelay(dot.delay, withSpring(1, { damping: 12, stiffness: 80 }));
        tx.value      = withDelay(dot.delay, withSpring(dot.x, { damping: 12, stiffness: 80 }));
        ty.value      = withDelay(dot.delay, withSpring(dot.y, { damping: 12, stiffness: 80 }));
      });
    } else {
      DOTS.forEach((_, i) => {
        anims[i].scale.value   = 0;
        anims[i].opacity.value = 0;
        anims[i].tx.value      = 0;
        anims[i].ty.value      = 0;
      });
    }
  }, [active]);

  return (
    <View style={confettiStyles.container} pointerEvents="none">
      {DOTS.map((dot, i) => {
        const { scale, opacity, tx, ty } = anims[i];
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const style = useAnimatedStyle(() => ({
          transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
          opacity: opacity.value,
          backgroundColor: dot.color,
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size / 2,
          position: 'absolute',
        }));
        return <Animated.View key={i} style={style} />;
      })}
    </View>
  );
}

const confettiStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: '50%' as unknown as number,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});

interface Props {
  visible: boolean;
  emoji: string;
  headline: string;
  followUp: string;
  onDismiss: () => void;
  confetti?: boolean;
}

export function SuccessToast({ visible, emoji, headline, followUp, onDismiss, confetti }: Props) {
  const theme      = useTheme();
  const translateY = useSharedValue(120);
  const opacity    = useSharedValue(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, theme.animation.spring.snappy);
      opacity.value    = withTiming(1, { duration: 200 });
      timerRef.current = setTimeout(onDismiss, TOAST_DURATION_MS);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      translateY.value = withTiming(120, { duration: 250 });
      opacity.value    = withTiming(0, { duration: 200 });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const styles = makeStyles(theme);

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {confetti && <ConfettiBurst active={visible} />}
      <Pressable style={styles.toast} onPress={onDismiss}>
        <Text style={styles.emoji}>{emoji}</Text>
        <View style={styles.textBlock}>
          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.followUp}>{followUp}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      left: 16,
      right: 16,
      zIndex: theme.zIndex.tooltip,
      alignItems: 'center',
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
      width: Math.min(SCREEN_W - 32, 380),
      ...theme.shadows.modal,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.accent.primary,
    },
    emoji: {
      fontSize: 24,
    },
    textBlock: {
      flex: 1,
    },
    headline: {
      fontSize: theme.fontSize.bodyMd,
      fontFamily: theme.fontFamily.bold,
      color: theme.colors.text.primary,
      marginBottom: 2,
    },
    followUp: {
      fontSize: theme.fontSize.bodySm,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.secondary,
    },
  });
}
