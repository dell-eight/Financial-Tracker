import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppButton } from '../../components';
import { useTheme } from '../../hooks/ui/useTheme';
import type { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FEATURES = [
  { emoji: '💰', label: 'Net Worth' },
  { emoji: '📊', label: 'Insights' },
  { emoji: '🎯', label: 'Goals' },
] as const;

// ── Background glows ───────────────────────────────────────────────────────────

function BackgroundDecor() {
  return (
    <Svg
      width={SCREEN_W}
      height={SCREEN_H}
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="g1" cx="80%" cy="15%" r="45%">
          <Stop offset="0%" stopColor="#755DEF" stopOpacity="0.13" />
          <Stop offset="100%" stopColor="#755DEF" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="g2" cx="5%" cy="72%" r="40%">
          <Stop offset="0%" stopColor="#755DEF" stopOpacity="0.07" />
          <Stop offset="100%" stopColor="#755DEF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={SCREEN_W * 0.8} cy={SCREEN_H * 0.15} r={220} fill="url(#g1)" />
      <Circle cx={SCREEN_W * 0.05} cy={SCREEN_H * 0.72} r={200} fill="url(#g2)" />
    </Svg>
  );
}

// ── Stat column inside the financial card ──────────────────────────────────────

function BreakdownItem({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <View style={breakdownStyles.root}>
      <Text style={[breakdownStyles.value, { color: valueColor }]}>{value}</Text>
      <Text style={breakdownStyles.label}>{label}</Text>
    </View>
  );
}

const breakdownStyles = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center' },
  value: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'capitalize' },
});

// ── WelcomeScreen ──────────────────────────────────────────────────────────────

export function WelcomeScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontFamily, borderRadius } = theme;

  const topBarAnim  = useSharedValue(0);
  const heroAnim    = useSharedValue(0);
  const cardAnim    = useSharedValue(0);
  const featureAnim = useSharedValue(0);
  const ctaAnim     = useSharedValue(0);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    topBarAnim.value  = withDelay(80,  withTiming(1, { duration: 480, easing: ease }));
    heroAnim.value    = withDelay(200, withTiming(1, { duration: 520, easing: ease }));
    cardAnim.value    = withDelay(360, withTiming(1, { duration: 560, easing: ease }));
    featureAnim.value = withDelay(500, withTiming(1, { duration: 480, easing: ease }));
    ctaAnim.value     = withDelay(620, withTiming(1, { duration: 480, easing: ease }));
  }, []);

  const topBarStyle  = useAnimatedStyle(() => ({
    opacity: topBarAnim.value,
    transform: [{ translateY: interpolate(topBarAnim.value, [0, 1], [12, 0]) }],
  }));
  const heroStyle    = useAnimatedStyle(() => ({
    opacity: heroAnim.value,
    transform: [{ translateY: interpolate(heroAnim.value, [0, 1], [20, 0]) }],
  }));
  const cardStyle    = useAnimatedStyle(() => ({
    opacity: cardAnim.value,
    transform: [
      { translateY: interpolate(cardAnim.value, [0, 1], [16, 0]) },
      { scale: interpolate(cardAnim.value, [0, 1], [0.97, 1]) },
    ],
  }));
  const featureStyle = useAnimatedStyle(() => ({
    opacity: featureAnim.value,
    transform: [{ translateY: interpolate(featureAnim.value, [0, 1], [12, 0]) }],
  }));
  const ctaStyle     = useAnimatedStyle(() => ({
    opacity: ctaAnim.value,
    transform: [{ translateY: interpolate(ctaAnim.value, [0, 1], [12, 0]) }],
  }));

  const topPad = insets.top  > 0 ? insets.top  : (Platform.OS === 'ios' ? 44 : 20);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);
  const accent = colors.accent.primary;

  const ctaShadow = Platform.select({
    ios:     { shadowColor: accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 20 },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />
      <BackgroundDecor />

      {/* ── Top bar ── */}
      <Animated.View style={[styles.topBar, topBarStyle, { marginTop: topPad + spacing[3] }]}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/Logo_without_bg.webp')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={[styles.brandName, { color: colors.text.primary, fontFamily: fontFamily.bold }]}>
            Networthy
          </Text>
        </View>
      </Animated.View>

      {/* ── Hero ── */}
      <Animated.View style={[styles.heroBlock, heroStyle, { marginTop: spacing[7] }]}>
        <Text style={[styles.headline, { color: colors.text.primary, fontFamily: fontFamily.bold }]}>
          {'Build\n'}
          <Text style={{ color: accent }}>Wealth</Text>
          {'\nWith Clarity.'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary, fontFamily: fontFamily.regular }]}>
          Track spending, manage investments, and grow your net worth — all in one place.
        </Text>
      </Animated.View>

      {/* ── Financial card ── */}
      <Animated.View
        style={[
          cardStyle,
          {
            marginHorizontal: spacing[5],
            marginTop:        spacing[6],
            borderRadius:     borderRadius.cardLg,
            overflow:         'hidden',
            ...Platform.select({
              ios:     { shadowColor: '#0A0720', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.45, shadowRadius: 28 },
              android: { elevation: 16 },
              default: {},
            }),
          },
        ]}
      >
        <LinearGradient
          colors={['#2A1168', '#17094A', '#0C0828']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.card, { borderRadius: borderRadius.cardLg, padding: spacing[5] }]}
        >
          {/* Decorative glows */}
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Circle cx="92%" cy="10%" r={80} fill="rgba(140,100,255,0.12)" />
            <Circle cx="-5%" cy="90%" r={90} fill="rgba(100,70,230,0.10)" />
          </Svg>

          {/* Top shimmer */}
          <View style={styles.cardShimmer} />

          <Text style={styles.cardLabel}>TOTAL NET WORTH</Text>

          <Text style={[styles.cardAmount, { fontFamily: fontFamily.bold }]}>
            $24,563
            <Text style={styles.cardCents}>.80</Text>
          </Text>

          <View style={[styles.deltaChip, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
            <Text style={[styles.deltaMain, { color: '#4ADE80', fontFamily: fontFamily.semiBold }]}>
              ↑ +$4,060 (+19.8%)
            </Text>
            <Text style={styles.deltaLabel}>  this month</Text>
          </View>

          <View style={styles.breakdownStrip}>
            <BreakdownItem label="Assets"      value="$31K" valueColor="#4ADE80" />
            <View style={styles.stripDivider} />
            <BreakdownItem label="Debts"       value="$7K"  valueColor="#FF8A75" />
            <View style={styles.stripDivider} />
            <BreakdownItem label="Investments" value="$8K"  valueColor="#C4B5FD" />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Feature pills ── */}
      <Animated.View style={[styles.featureRow, featureStyle, { marginTop: spacing[4] }]}>
        {FEATURES.map((f) => (
          <View
            key={f.label}
            style={[
              styles.featurePill,
              {
                backgroundColor: colors.accent.muted,
                borderColor:     colors.accent.muted,
                borderRadius:    borderRadius.full,
              },
            ]}
          >
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={[styles.featureLabel, { color: accent, fontFamily: fontFamily.semiBold }]}>
              {f.label}
            </Text>
          </View>
        ))}
      </Animated.View>

      {/* spacer */}
      <View style={styles.spacer} />

      {/* ── CTA ── */}
      <Animated.View
        style={[
          styles.ctaBlock,
          ctaStyle,
          { paddingHorizontal: spacing[5], paddingBottom: btmPad + spacing[4] },
        ]}
      >
        <View style={ctaShadow}>
          <AppButton
            label="Get Started →"
            onPress={() => navigation.navigate('SignUp')}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>

        <Pressable
          onPress={() => navigation.navigate('Login')}
          style={styles.signinRow}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
          hitSlop={8}
        >
          <Text style={[styles.signinText, { color: colors.text.secondary, fontFamily: fontFamily.regular }]}>
            Already have an account?{' '}
            <Text style={{ color: accent, fontFamily: fontFamily.semiBold }}>Sign In</Text>
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logoImg:     { width: 42, height: 42 },
  brandName:   { fontSize: 16, letterSpacing: -0.3 },
  heroBlock:   { paddingHorizontal: 20 },
  headline:    { fontSize: 38, lineHeight: 44, letterSpacing: -1.2 },
  subtitle:    { fontSize: 14, lineHeight: 22, marginTop: 12, maxWidth: 260 },
  card:        { overflow: 'hidden', justifyContent: 'space-between' },
  cardShimmer: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(200,170,255,0.35)' },
  cardLabel:      { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  cardAmount:     { fontSize: 30, letterSpacing: -1, marginTop: 4, marginBottom: 8, color: '#FFFFFF' },
  cardCents:      { fontSize: 17, letterSpacing: 0, color: 'rgba(255,255,255,0.45)' },
  deltaChip:      { flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  deltaMain:      { fontSize: 12 },
  deltaLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  breakdownStrip: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 12, marginTop: 4 },
  stripDivider:   { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  featureRow:  { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 17, borderWidth: 1.5 },
  featureEmoji:{ fontSize: 13 },
  featureLabel:{ fontSize: 13, letterSpacing: 0.1 },
  spacer:      { flex: 0.4 },
  ctaBlock:    { width: '100%' },
  signinRow:   { marginTop: 16, alignItems: 'center' },
  signinText:  { fontSize: 14 },
});

export default WelcomeScreen;
