import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../../hooks/ui/useTheme';

export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export function AppInput({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  disabled = false,
  containerStyle,
  value,
  onFocus,
  onBlur,
  ...rest
}: AppInputProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily } = theme;

  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const focusProgress = useSharedValue(0);

  const hasError = Boolean(error);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    focusProgress.value = withTiming(1, { duration: theme.animation.duration.fast });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    focusProgress.value = withTiming(0, { duration: theme.animation.duration.fast });
    onBlur?.(e);
  };

  const borderColor = (() => {
    if (hasError)    return colors.border.error;
    if (isFocused)   return colors.accent.primary;
    return colors.border.subtle;
  })();

  const borderWidth = isFocused || hasError ? 1.5 : 1;

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: hasError
      ? colors.border.error
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [colors.border.subtle, colors.accent.primary],
        ),
  }));

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontSize:   fontSize.bodyMd,
              fontFamily: fontFamily.medium,
              color:      hasError ? colors.border.error : colors.text.secondary,
              marginBottom: spacing[1],
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          animatedContainerStyle,
          {
            height:          theme.layout.inputHeight,
            borderRadius:    borderRadius.md,
            backgroundColor: disabled
              ? colors.bg.surfaceMuted
              : colors.bg.surfaceMuted,
            borderWidth,
            paddingHorizontal: spacing[4],
            opacity: disabled ? theme.animation.disabledOpacity : 1,
          },
        ]}
      >
        {leftIcon && (
          <View style={[styles.icon, { marginRight: spacing[2] }]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={inputRef}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor={colors.text.muted}
          style={[
            styles.input,
            {
              flex:       1,
              fontSize:   fontSize.bodyLg,
              fontFamily: fontFamily.regular,
              color:      colors.text.primary,
            },
          ]}
          {...rest}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={8}
            style={[styles.icon, { marginLeft: spacing[2] }]}
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            {rightIcon}
          </Pressable>
        )}
      </Animated.View>

      {(error || hint) && (
        <Text
          style={[
            styles.helperText,
            {
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.regular,
              color:      hasError ? colors.border.error : colors.text.muted,
              marginTop:  spacing[1],
            },
          ]}
        >
          {error ?? hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  input: {
    paddingVertical: 0, // neutralise Android default padding
  },
  icon: {
    alignItems:     'center',
    justifyContent: 'center',
  },
  helperText: {
    marginTop: 4,
  },
});

export default AppInput;
