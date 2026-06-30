import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';

interface Props {
  width?:       number | string;
  height:       number;
  borderRadius?: number;
  style?:        object;
}

export function SkeletonBox({ width, height, borderRadius = 8, style }: Props) {
  const theme   = useTheme();
  const opacity = useSharedValue(0.06);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.14, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.06, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width:           width ?? '100%',
          height,
          borderRadius,
          backgroundColor: theme.colors.text.primary,
        },
        animStyle,
        style,
      ]}
    />
  );
}
