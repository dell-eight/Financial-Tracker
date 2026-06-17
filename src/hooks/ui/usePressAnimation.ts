import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import type { StyleProp, ViewStyle } from 'react-native';
import { animation } from '../../theme';

interface PressAnimationResult {
  style:    StyleProp<ViewStyle>;
  handlers: { onPressIn: () => void; onPressOut: () => void };
}

/**
 * Returns an animated style + press handlers for scale+opacity feedback.
 * Apply to raw <Pressable> elements that need tactile feedback.
 *
 * Usage:
 *   const { style: pressStyle, handlers } = usePressAnimation();
 *   <Animated.Pressable style={[pressStyle, myStyle]} {...handlers}>
 */
export function usePressAnimation(scale = animation.pressScale): PressAnimationResult {
  const pressed = useSharedValue(false);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scale : 1, animation.spring.snappy) }],
    opacity:   withTiming(pressed.value ? animation.pressOpacity : 1, { duration: animation.duration.fast }),
  }));

  const handlers = {
    onPressIn:  () => { pressed.value = true; },
    onPressOut: () => { pressed.value = false; },
  };

  return { style, handlers };
}
