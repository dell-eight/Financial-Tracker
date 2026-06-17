import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, withDelay, interpolate, Easing } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';

const STAGGER       = 80;   // ms between each zone
const START_Y       = 20;   // px translateY start offset
const BASE_DURATION = 420;  // ms for zone 0; each subsequent zone gets +20ms

/**
 * Returns an array of animated styles for screen entry animations.
 * Each zone fades in and slides up from START_Y on mount, staggered by STAGGER ms.
 *
 * Usage:
 *   const [headerStyle, cardStyle, listStyle] = useScreenAnimation(3);
 *   <Animated.View style={headerStyle}>...</Animated.View>
 *
 * Rules of Hooks: useSharedValue must be called unconditionally, so we
 * always declare 5 values and slice to zoneCount at the end.
 */
export function useScreenAnimation(zoneCount: 1 | 2 | 3 | 4 | 5): StyleProp<ViewStyle>[] {
  const v0 = useSharedValue(0);
  const v1 = useSharedValue(0);
  const v2 = useSharedValue(0);
  const v3 = useSharedValue(0);
  const v4 = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    v0.value = withDelay(0 * STAGGER, withTiming(1, { duration: BASE_DURATION + 0 * 20, easing: e }));
    v1.value = withDelay(1 * STAGGER, withTiming(1, { duration: BASE_DURATION + 1 * 20, easing: e }));
    v2.value = withDelay(2 * STAGGER, withTiming(1, { duration: BASE_DURATION + 2 * 20, easing: e }));
    v3.value = withDelay(3 * STAGGER, withTiming(1, { duration: BASE_DURATION + 3 * 20, easing: e }));
    v4.value = withDelay(4 * STAGGER, withTiming(1, { duration: BASE_DURATION + 4 * 20, easing: e }));
  }, []);

  const s0 = useAnimatedStyle(() => ({
    opacity:   v0.value,
    transform: [{ translateY: interpolate(v0.value, [0, 1], [START_Y, 0]) }],
  }));
  const s1 = useAnimatedStyle(() => ({
    opacity:   v1.value,
    transform: [{ translateY: interpolate(v1.value, [0, 1], [START_Y, 0]) }],
  }));
  const s2 = useAnimatedStyle(() => ({
    opacity:   v2.value,
    transform: [{ translateY: interpolate(v2.value, [0, 1], [START_Y, 0]) }],
  }));
  const s3 = useAnimatedStyle(() => ({
    opacity:   v3.value,
    transform: [{ translateY: interpolate(v3.value, [0, 1], [START_Y, 0]) }],
  }));
  const s4 = useAnimatedStyle(() => ({
    opacity:   v4.value,
    transform: [{ translateY: interpolate(v4.value, [0, 1], [START_Y, 0]) }],
  }));

  return [s0, s1, s2, s3, s4].slice(0, zoneCount) as StyleProp<ViewStyle>[];
}
