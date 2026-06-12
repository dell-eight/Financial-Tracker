import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';
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

function AppleIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
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
  onApplePress:  () => void;
  style?: ViewStyle;
}

export function SocialAuthRow({ onGooglePress, onApplePress, style }: SocialAuthRowProps) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View style={[styles.container, style]}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
        <Text
          style={{
            fontSize:        fontSize.bodySm,
            fontFamily:      fontFamily.regular,
            color:           colors.text.muted,
            marginHorizontal: spacing[3],
          }}
        >
          or continue with
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]} />
      </View>

      {/* Provider buttons */}
      <View style={styles.btnRow}>
        <ProviderButton
          label="Google"
          icon={<GoogleIcon />}
          onPress={onGooglePress}
          style={styles.providerFlex}
        />
        <View style={{ width: spacing[3] }} />
        <ProviderButton
          label="Apple"
          icon={<AppleIcon color={colors.text.primary} />}
          onPress={onApplePress}
          style={styles.providerFlex}
        />
      </View>
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
  btnRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  providerFlex: {
    flex: 1,
  },
  providerBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
  },
});
