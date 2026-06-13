import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/ui/useTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ── Provider icon components ───────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// ── Individual provider button ─────────────────────────────────────────────────

interface ProviderButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

function ProviderButton({ label, icon, onPress, style }: ProviderButtonProps) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontFamily, fontSize, animation } = theme;

  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value   = withSpring(0.96, animation.spring.snappy);
        opacity.value = withTiming(0.8, { duration: animation.duration.fast });
      }}
      onPressOut={() => {
        scale.value   = withSpring(1, animation.spring.snappy);
        opacity.value = withTiming(1, { duration: animation.duration.fast });
      }}
      style={[animStyle, style]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.providerBtn,
          {
            backgroundColor: colors.bg.surfaceRaised,
            borderRadius:    borderRadius.button,
            borderWidth:     1,
            borderColor:     colors.border.subtle,
            paddingVertical: spacing[3],
          },
        ]}
      >
        {icon}
        <Text
          style={{
            fontSize:   fontSize.bodyMd,
            fontFamily: fontFamily.medium,
            color:      colors.text.primary,
            marginLeft: spacing[2],
          }}
        >
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

// ── SocialAuthRow (exported) ───────────────────────────────────────────────────

export interface SocialAuthRowProps {
  onGooglePress: () => void;
  style?: ViewStyle;
}

export function SocialAuthRow({ onGooglePress, style }: SocialAuthRowProps) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View style={[styles.container, style]}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
        <Text
          style={{
            fontSize:         fontSize.bodySm,
            fontFamily:       fontFamily.regular,
            color:            colors.text.muted,
            marginHorizontal: spacing[3],
          }}
        >
          or continue with
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
      </View>

      {/* Google button — full width */}
      <ProviderButton
        label="Continue with Google"
        icon={<GoogleIcon />}
        onPress={onGooglePress}
        style={styles.providerFull}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerRow: {
    flexDirection:  'row',
    alignItems:     'center',
    width:          '100%',
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },
  providerFull: {
    width: '100%',
  },
  providerBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
});
