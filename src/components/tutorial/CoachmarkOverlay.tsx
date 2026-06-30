import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Defs, Mask, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';
import type { TutorialStep } from '../../hooks/ui/useTutorialTour';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const SPOTLIGHT_PADDING = 10;
const ARROW_SIZE        = 10;

type SpotlightTarget = { x: number; y: number; width: number; height: number };

type Props = {
  visible:       boolean;
  steps:         TutorialStep[];
  stepIndex:     number;
  total:         number;
  stepRefs:      (React.RefObject<View | null> | null)[];
  fixedTargets?: (SpotlightTarget | null)[];
  onNext:        () => void;
  onSkip:        () => void;
};

export function CoachmarkOverlay({
  visible, steps, stepIndex, total, stepRefs, fixedTargets, onNext, onSkip,
}: Props) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [target,        setTarget]        = useState<SpotlightTarget | null>(null);
  const [tooltipHeight, setTooltipHeight] = useState(0);
  const [tooltipReady,  setTooltipReady]  = useState(false);
  const { width: screenW, height: screenH } = Dimensions.get('window');

  // Animated spotlight rect
  const spotX = useSharedValue(0);
  const spotY = useSharedValue(0);
  const spotW = useSharedValue(0);
  const spotH = useSharedValue(0);

  // Card entrance scale
  const cardScale = useSharedValue(0.92);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const measureTarget = useCallback(() => {
    if (!visible) return;

    const fixed = fixedTargets?.[stepIndex];
    if (fixed) {
      applyTarget(fixed);
      return;
    }

    const ref = stepRefs[stepIndex];
    if (ref?.current) {
      ref.current.measureInWindow((x, y, w, h) => {
        if (w > 0) applyTarget({ x, y, width: w, height: h });
        else showNoTarget();
      });
    } else {
      showNoTarget();
    }
  }, [visible, stepIndex, stepRefs, fixedTargets]);

  // No spotlight target — show the card centered immediately.
  // We cannot rely on onLayout to un-hide it because onLayout only fires
  // when the card dimensions CHANGE, and same-sized consecutive steps
  // leave tooltipReady=false permanently.
  function showNoTarget() {
    setTarget(null);
    setTooltipReady(true);
  }

  function applyTarget(t: SpotlightTarget) {
    setTarget(t);
    const dur = { duration: 200, easing: Easing.out(Easing.quad) };
    spotX.value = withTiming(t.x - SPOTLIGHT_PADDING, dur);
    spotY.value = withTiming(t.y - SPOTLIGHT_PADDING, dur);
    spotW.value = withTiming(t.width  + SPOTLIGHT_PADDING * 2, dur);
    spotH.value = withTiming(t.height + SPOTLIGHT_PADDING * 2, dur);
  }

  // Measure on step change, with rAF to let layout settle
  useEffect(() => {
    if (!visible) return;
    setTooltipReady(false);
    cardScale.value = 0.92;
    requestAnimationFrame(() => {
      measureTarget();
      cardScale.value = withSpring(1, { damping: 18, stiffness: 220 });
    });
  }, [visible, stepIndex]);

  // Remeasure on orientation change
  useEffect(() => {
    if (!visible) return;
    const sub = Dimensions.addEventListener('change', measureTarget);
    return () => sub.remove();
  }, [visible, measureTarget]);

  const animatedSpotProps = useAnimatedProps(() => ({
    x:      spotX.value,
    y:      spotY.value,
    width:  spotW.value,
    height: spotH.value,
  }));

  // Tooltip positioning: use available space above vs below
  const availableAbove = target ? target.y : 0;
  const availableBelow = target
    ? screenH - (target.y + target.height)
    : 0;
  const tooltipBelow = target ? availableBelow > availableAbove : false;

  const tooltipWidth = screenW - spacing[5] * 2;
  const tooltipX     = spacing[5];
  // Arrows are in-flow (not absolute), so tooltipHeight already includes them.
  // No ARROW_SIZE offset needed — the arrow sits flush between target and card.
  const tooltipY     = target
    ? tooltipBelow
      ? target.y + target.height + 4
      : target.y - tooltipHeight - 4
    : screenH / 2 - tooltipHeight / 2;

  // Arrow horizontal center: align with target center, clamped within tooltip
  const arrowX = target
    ? Math.min(
        Math.max(target.x + target.width / 2 - tooltipX - ARROW_SIZE, spacing[4]),
        tooltipWidth - spacing[4] - ARROW_SIZE * 2,
      )
    : tooltipWidth / 2 - ARROW_SIZE;

  if (!visible) return null;

  const step = steps[stepIndex];

  return (
    <Modal transparent animationType="fade" visible={visible} statusBarTranslucent>
      {/* Dimmed overlay with spotlight hole */}
      <Svg
        width={screenW}
        height={screenH}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <Mask id="spotlight">
            <Rect width={screenW} height={screenH} fill="white" />
            {target && (
              <AnimatedRect
                animatedProps={animatedSpotProps}
                rx={14}
                fill="black"
              />
            )}
          </Mask>
        </Defs>
        <Rect
          width={screenW}
          height={screenH}
          fill="rgba(0,0,0,0.72)"
          mask="url(#spotlight)"
        />
        {/* Subtle glow ring around hole */}
        {target && (
          <AnimatedRect
            animatedProps={animatedSpotProps}
            rx={14}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={2}
          />
        )}
      </Svg>

      {/* Tap backdrop to skip */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onSkip} />

      {/* Tooltip card + arrow */}
      <Animated.View
        style={[
          cardStyle,
          {
            position:  'absolute',
            left:      tooltipX,
            top:       tooltipY,
            width:     tooltipWidth,
            opacity:   tooltipReady ? 1 : 0,
          },
        ]}
        onLayout={(e) => {
          setTooltipHeight(e.nativeEvent.layout.height);
          setTooltipReady(true);
        }}
      >
        {/* Arrow pointing UP — in flow above card (tooltip is below the target) */}
        {target && tooltipBelow && !step.inlineFab && !step.inlineButton && (
          <View style={[styles.arrow, styles.arrowUp, { marginLeft: arrowX, borderBottomColor: colors.bg.surface }]} />
        )}

        {/* Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bg.surface,
              borderRadius:    borderRadius.card,
              padding:         spacing[5],
            },
          ]}
        >
          {/* Header row: step counter + skip */}
          <View style={styles.headerRow}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted }}>
              {stepIndex + 1} / {total}
            </Text>
            <Pressable onPress={onSkip} hitSlop={12}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
                Skip All
              </Text>
            </Pressable>
          </View>

          {/* Emoji + title */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2], marginTop: spacing[3] }}>
            <Text style={{ fontSize: 22, marginRight: spacing[2] }}>{step.emoji}</Text>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.text.primary, flex: 1 }}>
              {step.title}
            </Text>
          </View>

          {/* Inline FAB illustration — steps that highlight the + button */}
          {step.inlineFab && (
            <View style={{ alignItems: 'center', marginVertical: spacing[3] }}>
              <View style={{
                width:           52,
                height:          52,
                borderRadius:    26,
                backgroundColor: colors.accent.primary,
                alignItems:      'center',
                justifyContent:  'center',
                elevation:       4,
                shadowColor:     '#000',
                shadowOffset:    { width: 0, height: 2 },
                shadowOpacity:   0.3,
                shadowRadius:    6,
              }}>
                <Text style={{ fontSize: 28, color: '#FFFFFF', lineHeight: 32, marginTop: -2 }}>+</Text>
              </View>
            </View>
          )}

          {/* Inline button illustration — steps that highlight a named button */}
          {step.inlineButton && (
            <View style={{ alignItems: 'center', marginVertical: spacing[3] }}>
              <View style={{
                paddingHorizontal: spacing[5],
                paddingVertical:   spacing[2],
                borderRadius:      borderRadius.button,
                backgroundColor:   colors.accent.primary,
                elevation:         2,
                shadowColor:       '#000',
                shadowOffset:      { width: 0, height: 1 },
                shadowOpacity:     0.2,
                shadowRadius:      4,
              }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
                  {step.inlineButton}
                </Text>
              </View>
            </View>
          )}

          {/* Body */}
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20, marginBottom: spacing[4] }}>
            {step.body}
          </Text>

          {/* Next button */}
          <Pressable
            onPress={onNext}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary,
              borderRadius:    borderRadius.button,
              height:          44,
              alignItems:      'center' as const,
              justifyContent:  'center' as const,
            })}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
              {stepIndex < total - 1 ? 'Next →' : 'Done'}
            </Text>
          </Pressable>
        </View>

        {/* Arrow pointing DOWN — in flow below card (tooltip is above the target) */}
        {target && !tooltipBelow && !step.inlineFab && !step.inlineButton && (
          <View style={[styles.arrow, styles.arrowDown, { marginLeft: arrowX, borderTopColor: colors.bg.surface }]} />
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  12,
    elevation:     8,
  },
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  arrow: {
    alignSelf:        'flex-start',   // prevent column-stretch from overriding width:0
    width:            0,
    height:           0,
    borderLeftWidth:  ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor:  'transparent',
    borderRightColor: 'transparent',
  },
  arrowDown: {
    borderTopWidth:  ARROW_SIZE,
    borderTopColor:  'transparent',
  },
  arrowUp: {
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: 'transparent',
  },
});
