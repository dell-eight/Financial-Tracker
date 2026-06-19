import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import type { HomeStackParamList } from '../../navigation/types';
import { SUPPORT_EMAIL, LAST_UPDATED } from '../../constants/app';

type Props = StackScreenProps<HomeStackParamList, 'PrivacyPolicy'>;

// ── PolicySection ─────────────────────────────────────────────────────────────

function PolicySection({
  title,
  children,
  theme,
}: {
  title:    string;
  children: string;
  theme:    ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <View style={{ marginBottom: spacing[2] }}>
      <Text
        style={{
          fontSize:   fontSize.headingSm,
          fontFamily: fontFamily.semiBold,
          color:      colors.text.primary,
          marginTop:  spacing[5],
          marginBottom: spacing[2],
          lineHeight: 22,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize:   fontSize.bodyMd,
          fontFamily: fontFamily.regular,
          color:      colors.text.secondary,
          lineHeight: 22,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

// ── PrivacyPolicyScreen ───────────────────────────────────────────────────────

export function PrivacyPolicyScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const anim = useSharedValue(0);
  useEffect(() => {
    anim.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity:   anim.value,
    transform: [{ translateY: (1 - anim.value) * 10 }],
  }));

  return (
    <View style={[sc.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View
        style={[
          sc.header,
          {
            paddingTop:        topPad + spacing[1],
            paddingHorizontal: spacing[5],
            paddingBottom:     spacing[3],
            backgroundColor:   colors.bg.base,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
            ← Back
          </Text>
        </Pressable>

        <Text
          style={{
            fontSize:   fontSize.headingMd,
            fontFamily: fontFamily.bold,
            color:      colors.text.primary,
          }}
        >
          Privacy Policy
        </Text>

        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing[5],
          paddingBottom:     btmPad + 80,
          paddingTop:        spacing[2],
        }}
      >
        <Animated.View style={animStyle}>
          {/* Last updated */}
          <Text
            style={{
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.regular,
              color:      colors.text.muted,
              marginBottom: spacing[1],
            }}
          >
            Last updated: {LAST_UPDATED}
          </Text>

          {/* Divider */}
          <View
            style={{
              height:          1,
              backgroundColor: colors.border.subtle,
              marginBottom:    spacing[2],
            }}
          />

          <PolicySection title="Introduction" theme={theme}>
            {`This Privacy Policy describes how FinTrack collects, uses, and protects your personal information when you use our mobile application. By using FinTrack, you agree to the collection and use of information in accordance with this policy.`}
          </PolicySection>

          <PolicySection title="Information We Collect" theme={theme}>
            {`We collect the following types of information:\n\n(a) Account Information — your name, email address, and authentication credentials when you create an account.\n\n(b) Financial Records — all expense, income, transfer, savings goal, investment, and debt data you enter into the app. This data is entered voluntarily by you and is never accessed for purposes other than providing the service.\n\n(c) Device Information — device type, operating system version, and app version for diagnostic and compatibility purposes.\n\n(d) Usage Analytics — aggregated, anonymized usage patterns to help us improve the app experience. No personally identifiable financial data is included in analytics.`}
          </PolicySection>

          <PolicySection title="How We Use Your Information" theme={theme}>
            {`Your information is used to:\n\n• Provide and maintain the app's core functionality\n• Synchronize your financial data securely across sessions and devices\n• Improve the app experience based on aggregated usage patterns\n• Ensure the security and integrity of your account and data\n• Send optional budget alerts and notifications you have explicitly enabled in Settings`}
          </PolicySection>

          <PolicySection title="Data Storage & Security" theme={theme}>
            {`Your financial data is stored securely on Supabase infrastructure, a trusted cloud platform with enterprise-grade security practices.\n\nAll data is encrypted in transit using TLS 1.2+ and encrypted at rest. We implement multiple layers of application security including biometric app lock, rate-limited login protection (5 attempts / 5-minute lockout), and secure token storage using platform-native secure storage (iOS SecureStore / Android Keystore).\n\nWe do not sell, rent, or share your personal financial data with any third parties for marketing or commercial purposes.`}
          </PolicySection>

          <PolicySection title="Third-Party Services" theme={theme}>
            {`FinTrack uses the following third-party services to deliver its functionality:\n\n(a) Supabase — database hosting, user authentication, and file storage. Supabase processes data in accordance with their own privacy policy.\n\n(b) Expo — the application framework powering device APIs, push notifications, and app delivery.\n\n(c) Google — optional sign-in via Google OAuth, available if you choose to use it. Google's privacy policy governs any data they process during authentication.\n\nEach provider has its own privacy policy. We encourage you to review them.`}
          </PolicySection>

          <PolicySection title="Your Rights" theme={theme}>
            {`You have the following rights regarding your data:\n\n• Access — all financial data you have entered is always visible and accessible within the app\n• Update — you may correct or update any information at any time\n• Delete — you may delete individual records (transactions, goals, accounts, etc.) at any time within the app\n• Account Deletion — you may request complete removal of your account and all associated data by contacting our support team. Deletion is permanent and irreversible.`}
          </PolicySection>

          <PolicySection title="Contact Us" theme={theme}>
            {`If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:\n\n${SUPPORT_EMAIL}\n\nWe aim to respond to all privacy-related inquiries within 5 business days.`}
          </PolicySection>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
});

export default PrivacyPolicyScreen;
