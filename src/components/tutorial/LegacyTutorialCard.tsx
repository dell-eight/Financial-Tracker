import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';
import type { TutorialStep } from '../../hooks/ui/useTutorialTour';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  steps: TutorialStep[];
  visible: boolean;
  stepIndex: number;
  onNext: () => void;
  onSkip: () => void;
}

export function TutorialCard({ steps, visible, stepIndex, onNext, onSkip }: Props) {
  const theme = useTheme();
  const scale   = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value   = withSpring(1, theme.animation.spring.snappy);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value   = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  // Animate card pop on step change
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, theme.animation.spring.snappy);
    }
  }, [stepIndex]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const step = steps[stepIndex];
  if (!step) return null;

  const isLast = stepIndex === steps.length - 1;
  const hasRequiredAction = !!step.requiredAction;

  const styles = makeStyles(theme);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.counter}>{stepIndex + 1} of {steps.length}</Text>
            <Pressable onPress={onSkip} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          </View>

          {/* Content */}
          <Text style={styles.emoji}>{step.emoji}</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>

          {/* CTA */}
          <Pressable style={[styles.cta, { backgroundColor: theme.colors.accent.primary }]} onPress={onNext}>
            <Text style={styles.ctaText}>
              {isLast ? "Let's go →" : 'Got it →'}
            </Text>
          </Pressable>
          {/* For interactive steps, show a hint below the CTA */}
          {hasRequiredAction && (
            <Text style={[styles.hintText, { color: theme.colors.text.muted }]}>
              You can do this now and come back
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.68)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    card: {
      width: Math.min(SCREEN_W - 48, 360),
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.borderRadius.cardLg,
      padding: 24,
      ...theme.shadows.modal,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    counter: {
      fontSize: theme.fontSize.micro,
      color: theme.colors.text.muted,
      fontFamily: theme.fontFamily.medium,
    },
    skip: {
      fontSize: theme.fontSize.bodySm,
      color: theme.colors.text.muted,
      fontFamily: theme.fontFamily.medium,
    },
    emoji: {
      fontSize: 40,
      textAlign: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: theme.fontSize.bodyLg,
      fontFamily: theme.fontFamily.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: theme.lineHeight.bodyLg,
    },
    body: {
      fontSize: theme.fontSize.bodySm,
      fontFamily: theme.fontFamily.regular,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: theme.lineHeight.bodySm * 1.5,
      marginBottom: 24,
    },
    cta: {
      borderRadius: theme.borderRadius.button,
      paddingVertical: 14,
      alignItems: 'center',
    },
    ctaText: {
      fontSize: theme.fontSize.bodyMd,
      fontFamily: theme.fontFamily.semiBold,
      color: '#FFFFFF',
    },
    hintText: {
      fontSize: theme.fontSize.micro,
      fontFamily: theme.fontFamily.regular,
      textAlign: 'center',
      marginTop: 8,
    },
  });
}
