import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';
import type { ButtonVariant, ButtonSize } from '../../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const { colors, animation, buttonVariantConfig, buttonSizeConfig, borderRadius } = theme;

  const sizeConfig    = buttonSizeConfig[size];
  const variantConfig = buttonVariantConfig[variant];

  const pressed = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? animation.pressScale : 1, animation.spring.snappy) }],
    opacity:   withTiming(pressed.value ? animation.pressOpacity : 1, { duration: animation.duration.fast }),
  }));

  // Resolve background color per variant
  const bgColor = (() => {
    if (disabled) return colors.accent.primary;
    switch (variant) {
      case 'primary':   return colors.accent.primary;
      case 'secondary': return colors.transparent;
      case 'ghost':     return colors.transparent;
      case 'danger':    return colors.expense;
      case 'social':    return colors.bg.surface;
      default:          return colors.accent.primary;
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'primary':   return colors.text.onAccent;
      case 'secondary': return colors.accent.primary;
      case 'ghost':     return colors.accent.primary;
      case 'danger':    return colors.text.onAccent;
      case 'social':    return colors.text.primary;
      default:          return colors.text.onAccent;
    }
  })();

  const borderColor = (() => {
    switch (variant) {
      case 'secondary': return colors.accent.primary;
      case 'social':    return colors.border.subtle;
      default:          return colors.transparent;
    }
  })();

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { pressed.value = true; }}
      onPressOut={() => { pressed.value = false; }}
      disabled={isDisabled}
      style={[
        animatedStyle,
        !fullWidth && { alignSelf: 'flex-start' as const },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      <View
        style={[
          styles.base,
          {
            height:            sizeConfig.height,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            borderRadius:      sizeConfig.borderRadius,
            backgroundColor:   bgColor,
            borderWidth:       variantConfig.borderWidth,
            borderColor,
            opacity:           isDisabled ? animation.disabledOpacity : 1,
            alignSelf:         fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor}
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <View style={[styles.icon, { marginRight: sizeConfig.iconGap }]}>
                {icon}
              </View>
            )}
            <Text
              style={[
                styles.label,
                {
                  fontSize:    sizeConfig.fontSize,
                  fontFamily:  sizeConfig.fontFamily,
                  fontWeight:  sizeConfig.fontWeight,
                  color:       textColor,
                  letterSpacing: -0.1,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {icon && iconPosition === 'right' && (
              <View style={[styles.icon, { marginLeft: sizeConfig.iconGap }]}>
                {icon}
              </View>
            )}
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  icon: {
    alignItems:     'center',
    justifyContent: 'center',
  },
});

export default AppButton;
