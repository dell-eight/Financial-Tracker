import React, { useEffect } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';
import { getProgressColor } from '../../../theme';

export interface ProgressBarProps {
  /** Value between 0 and 1 (can exceed 1 for overspent state). */
  ratio: number;
  height?: number;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  ratio,
  height,
  style,
  animated = true,
}: ProgressBarProps) {
  const theme = useTheme();
  const { colors, borderRadius, progressBarConfig, animation } = theme;

  const barHeight    = height ?? progressBarConfig.height;
  const clampedRatio = Math.min(ratio, 1);
  const fillColor    = getProgressColor(ratio, colors);

  const progress  = useSharedValue(0);
  const isMounted = React.useRef(false);

  useEffect(() => {
    if (animated) {
      const timing = withTiming(clampedRatio, {
        duration: animation.duration.slow,
        easing:   Easing.out(Easing.cubic),
      });
      // Delay the initial fill so it fires after the screen entry animation.
      // Subsequent ratio changes (live updates) animate immediately.
      progress.value = isMounted.current ? timing : withDelay(200, timing);
    } else {
      progress.value = clampedRatio;
    }
    isMounted.current = true;
  }, [clampedRatio, animated]);

  const animatedFill = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height:          barHeight,
          borderRadius:    progressBarConfig.borderRadius,
          backgroundColor: colors.bg.surfaceMuted,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedRatio * 100) }}
    >
      <Animated.View
        style={[
          styles.fill,
          animatedFill,
          {
            height:       barHeight,
            borderRadius: progressBarConfig.borderRadius,
            backgroundColor: fillColor,
          },
        ]}
      />

      {/* Overspent indicator: red overflow segment at full width */}
      {ratio > 1 && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius:    progressBarConfig.borderRadius,
              backgroundColor: colors.expense,
              opacity:         progressBarConfig.overflowSegmentOpacity,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width:    '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left:     0,
    top:      0,
  },
});

export default ProgressBar;
