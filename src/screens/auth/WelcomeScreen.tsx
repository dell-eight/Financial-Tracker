import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppButton } from '../../components';
import { useTheme } from '../../hooks/ui/useTheme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Decorative background ──────────────────────────────────────────────────────

function BackgroundDecor() {
  return (
    <Svg
      width={SCREEN_W}
      height={SCREEN_H}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="glow1" cx="70%" cy="20%" r="45%">
          <Stop offset="0%" stopColor="#7B61FF" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="glow2" cx="10%" cy="75%" r="40%">
          <Stop offset="0%" stopColor="#7B61FF" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#7B61FF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      {/* Large ambient glows */}
      <Circle cx={SCREEN_W * 0.8}  cy={SCREEN_H * 0.1} r={220} fill="url(#glow1)" />
      <Circle cx={SCREEN_W * 0.05} cy={SCREEN_H * 0.7} r={180} fill="url(#glow2)" />
      {/* Subtle ring accents */}
      <Circle
        cx={SCREEN_W * 0.9} cy={SCREEN_H * 0.18}
        r={90} fill="none"
        stroke="#7B61FF" strokeWidth={1} strokeOpacity={0.12}
      />
      <Circle
        cx={SCREEN_W * 0.1} cy={SCREEN_H * 0.82}
        r={60} fill="none"
        stroke="#7B61FF" strokeWidth={1} strokeOpacity={0.1}
      />
    </Svg>
  );
}

// ── Illustration — simplified finance card preview ─────────────────────────────

function FinanceIllustration() {
  const theme = useTheme();
  const { colors, spacing, borderRadius } = theme;

  return (
    <View style={illStyles.root}>
      {/* Main balance card */}
      <View style={[illStyles.balanceCard, { borderRadius: borderRadius.card }]}>
        <Svg
          width="100%" height="100%"
          style={[StyleSheet.absoluteFillObject, { borderRadius: borderRadius.card }]}
        >
          <Defs>
            <RadialGradient id="cardGrad" cx="0%" cy="0%" r="120%">
              <Stop offset="0%" stopColor="#9B85FF" />
              <Stop offset="100%" stopColor="#5B41D9" />
            </RadialGradient>
          </Defs>
          <Circle cx="0" cy="0" r="120" fill="url(#cardGrad)" />
        </Svg>

        <Text style={illStyles.balanceLabel}>Total Balance</Text>
        <Text style={illStyles.balanceAmount}>$24,563.80</Text>

        {/* Mini chip row */}
        <View style={illStyles.chipRow}>
          <View style={illStyles.chip}>
            <Text style={illStyles.chipLabel}>↑  Income</Text>
            <Text style={illStyles.chipValue}>$6,240</Text>
          </View>
          <View style={[illStyles.chip, { marginLeft: 8 }]}>
            <Text style={illStyles.chipLabel}>↓  Expenses</Text>
            <Text style={illStyles.chipValue}>$2,180</Text>
          </View>
        </View>
      </View>

      {/* Two smaller accent cards */}
      <View style={illStyles.smallCardRow}>
        <View
          style={[
            illStyles.smallCard,
            { backgroundColor: colors.bg.surface, borderRadius: borderRadius.md },
          ]}
        >
          <View style={[illStyles.smallDot, { backgroundColor: '#22C55E26' }]}>
            <Text style={{ fontSize: 12 }}>↑</Text>
          </View>
          <Text style={[illStyles.smallLabel, { color: colors.text.muted }]}>Food & Dining</Text>
          <Text style={[illStyles.smallAmt, { color: colors.text.primary }]}>$342</Text>
        </View>

        <View
          style={[
            illStyles.smallCard,
            { backgroundColor: colors.bg.surface, borderRadius: borderRadius.md, marginLeft: 8 },
          ]}
        >
          <View style={[illStyles.smallDot, { backgroundColor: '#7B61FF26' }]}>
            <Text style={{ fontSize: 12 }}>◎</Text>
          </View>
          <Text style={[illStyles.smallLabel, { color: colors.text.muted }]}>Transport</Text>
          <Text style={[illStyles.smallAmt, { color: colors.text.primary }]}>$128</Text>
        </View>
      </View>
    </View>
  );
}

const illStyles = StyleSheet.create({
  root: {
    width:  '100%',
    alignItems: 'center',
  },
  balanceCard: {
    width:          '100%',
    height:         148,
    overflow:       'hidden',
    padding:        20,
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize:   12,
    color:      'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  balanceAmount: {
    fontSize:   26,
    color:      '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  chipRow: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    8,
    paddingHorizontal: 10,
    paddingVertical:   6,
  },
  chipLabel: {
    fontSize: 10,
    color:    'rgba(255,255,255,0.7)',
  },
  chipValue: {
    fontSize:   13,
    color:      '#FFFFFF',
    fontWeight: '600',
    marginTop:  1,
  },
  smallCardRow: {
    flexDirection: 'row',
    width:         '100%',
    marginTop:     10,
  },
  smallCard: {
    flex:    1,
    padding: 14,
  },
  smallDot: {
    width:          30,
    height:         30,
    borderRadius:   15,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   8,
  },
  smallLabel: {
    fontSize:  11,
    marginBottom: 2,
  },
  smallAmt: {
    fontSize:   15,
    fontWeight: '600',
  },
});

// ── Logo mark ──────────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <View style={logoStyles.root}>
      <Svg width={48} height={48} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={24} fill="#7B61FF" fillOpacity={0.18} />
        <Circle cx={24} cy={24} r={18} fill="#7B61FF" fillOpacity={0.25} />
        {/* Upward bar chart */}
        <Path
          d="M14 32 L14 24 L19 24 L19 32 Z"
          fill="#FFFFFF" fillOpacity={0.9}
        />
        <Path
          d="M21 32 L21 18 L26 18 L26 32 Z"
          fill="#FFFFFF"
        />
        <Path
          d="M28 32 L28 22 L33 22 L33 32 Z"
          fill="#FFFFFF" fillOpacity={0.75}
        />
        {/* Trend line */}
        <Path
          d="M14 26 L19.5 20 L26 22 L33 14"
          stroke="#C4B5FD" strokeWidth={2} strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  root: {
    width:  48,
    height: 48,
    alignItems:     'center',
    justifyContent: 'center',
  },
});

// ── WelcomeScreen ──────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  // Staggered entrance animations
  const logoAnim  = useSharedValue(0);
  const heroAnim  = useSharedValue(0);
  const illAnim   = useSharedValue(0);
  const ctaAnim   = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    logoAnim.value = withDelay(80,  withTiming(1, { duration: 520, easing: ease }));
    heroAnim.value = withDelay(220, withTiming(1, { duration: 540, easing: ease }));
    illAnim.value  = withDelay(360, withTiming(1, { duration: 560, easing: ease }));
    ctaAnim.value  = withDelay(500, withTiming(1, { duration: 500, easing: ease }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoAnim.value,
    transform: [{ translateY: interpolate(logoAnim.value, [0, 1], [16, 0]) }],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    opacity:   heroAnim.value,
    transform: [{ translateY: interpolate(heroAnim.value, [0, 1], [20, 0]) }],
  }));

  const illStyle = useAnimatedStyle(() => ({
    opacity:   illAnim.value,
    transform: [{ translateY: interpolate(illAnim.value, [0, 1], [28, 0]) }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity:   ctaAnim.value,
    transform: [{ translateY: interpolate(ctaAnim.value, [0, 1], [16, 0]) }],
  }));

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 20);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />
      <BackgroundDecor />

      {/* ── Logo + brand ── */}
      <Animated.View
        style={[
          styles.logoRow,
          logoStyle,
          { marginTop: topPad + spacing[6] },
        ]}
      >
        <LogoMark />
        <Text
          style={{
            fontSize:      20,
            fontFamily:    fontFamily.bold,
            color:         colors.text.primary,
            letterSpacing: -0.4,
            marginLeft:    spacing[2],
          }}
        >
          FinTrack
        </Text>
      </Animated.View>

      {/* ── Hero text ── */}
      <Animated.View style={[styles.heroBlock, heroStyle]}>
        <Text
          style={{
            fontSize:      fontSize.displayXl,
            fontFamily:    fontFamily.bold,
            color:         colors.text.primary,
            letterSpacing: -0.8,
            lineHeight:    46,
          }}
        >
          Manage Your{'\n'}
          <Text style={{ color: colors.accent.primary }}>Finances</Text>
          {' Simply.'}
        </Text>
        <Text
          style={{
            fontSize:   fontSize.bodyMd,
            fontFamily: fontFamily.regular,
            color:      colors.text.secondary,
            marginTop:  spacing[3],
            lineHeight: 24,
          }}
        >
          Track expenses, set budgets, and reach{'\n'}your financial goals — all in one place.
        </Text>
      </Animated.View>

      {/* ── Finance illustration ── */}
      <Animated.View
        style={[
          styles.illustration,
          illStyle,
          { paddingHorizontal: spacing[5] },
        ]}
      >
        <FinanceIllustration />
      </Animated.View>

      {/* ── CTA buttons ── */}
      <Animated.View
        style={[
          styles.ctaBlock,
          ctaStyle,
          {
            paddingHorizontal: spacing[5],
            paddingBottom:     btmPad + spacing[4],
          },
        ]}
      >
        <AppButton
          label="Get Started"
          onPress={() => navigation.navigate('SignUp')}
          variant="primary"
          size="lg"
          fullWidth
        />

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: spacing[4], alignItems: 'center' }}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
          hitSlop={8}
        >
          <Text
            style={{
              fontSize:   fontSize.bodyMd,
              fontFamily: fontFamily.regular,
              color:      colors.text.secondary,
            }}
          >
            Already have an account?{' '}
            <Text
              style={{
                color:      colors.accent.primary,
                fontFamily: fontFamily.semiBold,
              }}
            >
              Sign In
            </Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 24,
  },
  heroBlock: {
    paddingHorizontal: 24,
    marginTop:         28,
  },
  illustration: {
    flex:           1,
    justifyContent: 'center',
    marginTop:      28,
  },
  ctaBlock: {
    width: '100%',
  },
});

export default WelcomeScreen;
