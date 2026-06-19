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

type Props = StackScreenProps<HomeStackParamList, 'TermsOfService'>;

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
          fontSize:     fontSize.headingSm,
          fontFamily:   fontFamily.semiBold,
          color:        colors.text.primary,
          marginTop:    spacing[5],
          marginBottom: spacing[2],
          lineHeight:   22,
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

// ── TermsOfServiceScreen ──────────────────────────────────────────────────────

export function TermsOfServiceScreen({ navigation }: Props) {
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
          Terms of Service
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
              fontSize:     fontSize.bodySm,
              fontFamily:   fontFamily.regular,
              color:        colors.text.muted,
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

          <PolicySection title="1. Acceptance of Terms" theme={theme}>
            {`By downloading, installing, or using FinTrack, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application. Your continued use of the app constitutes ongoing acceptance of these terms.`}
          </PolicySection>

          <PolicySection title="2. User Responsibilities" theme={theme}>
            {`You are responsible for:\n\n• Maintaining the confidentiality of your account credentials and not sharing them with others\n• All activity that occurs under your account\n• The accuracy and completeness of financial information you enter into the app\n• Keeping your device secure, including enabling biometric lock where appropriate\n• Notifying us immediately if you suspect unauthorized access to your account`}
          </PolicySection>

          <PolicySection title="3. Account Usage" theme={theme}>
            {`FinTrack accounts are for personal use only. You may not:\n\n• Use the app for any illegal or unauthorized purpose\n• Attempt to reverse-engineer, decompile, or compromise the security of the application\n• Create multiple accounts to circumvent usage restrictions\n• Use automated tools to access the app or its data\n• Interfere with or disrupt the integrity of the service`}
          </PolicySection>

          <PolicySection title="4. Financial Information Disclaimer" theme={theme}>
            {`FinTrack is a personal finance tracking and planning tool designed to help you organize and visualize your financial data.\n\nIMPORTANT: FinTrack does not provide professional financial, investment, tax, or legal advice. The summaries, calculations, health scores, and insights shown in the app are for informational and organizational purposes only. They do not constitute financial advice.\n\nAlways consult a qualified financial professional, investment advisor, or tax expert before making significant financial decisions. Past performance and app projections are not guarantees of future results.`}
          </PolicySection>

          <PolicySection title="5. Data Accuracy" theme={theme}>
            {`You are solely responsible for the accuracy and completeness of all financial data you enter into FinTrack. The app calculates summaries including net worth, savings rates, and budget progress based entirely on the data you provide.\n\nFinTrack is not responsible for errors in calculations resulting from incorrect, incomplete, or outdated information entered by the user. Please review your data regularly to ensure accuracy.`}
          </PolicySection>

          <PolicySection title="6. Limitation of Liability" theme={theme}>
            {`To the maximum extent permitted by applicable law, FinTrack and its developers, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:\n\n• Financial losses resulting from decisions made based on app data\n• Loss of data due to device failure or app errors\n• Interruption of service or loss of access\n• Any other damages arising from your use of or inability to use the app\n\nOur total liability to you for any claim shall not exceed the amount you paid for the app in the twelve months preceding the claim.`}
          </PolicySection>

          <PolicySection title="7. Service Availability" theme={theme}>
            {`We strive to keep FinTrack available at all times, but we cannot guarantee uninterrupted or error-free service. The app may be temporarily unavailable due to scheduled maintenance, updates, or circumstances beyond our control.\n\nWe reserve the right to modify, suspend, or discontinue any feature or aspect of the service at any time, with reasonable notice to users where practicable. We are not liable to you or any third party for any modification, suspension, or discontinuation of the service.`}
          </PolicySection>

          <PolicySection title="8. Account Termination" theme={theme}>
            {`You may delete your account at any time by contacting our support team. Upon your request, all your personal data will be permanently deleted from our servers within 30 days.\n\nWe reserve the right to suspend or terminate accounts that: violate these Terms of Service; engage in fraudulent or illegal activity; or pose a security risk to the service or other users. We will provide notice of termination where reasonably possible.`}
          </PolicySection>

          <PolicySection title="9. Changes to Terms" theme={theme}>
            {`We may update these Terms of Service from time to time to reflect changes in the law, our practices, or the features of the app. When we make material changes, we will update the "Last Updated" date at the top of this document.\n\nYour continued use of FinTrack after changes are posted constitutes your acceptance of the revised terms. If you do not agree to the updated terms, please discontinue use of the app.`}
          </PolicySection>

          <PolicySection title="10. Contact Us" theme={theme}>
            {`If you have questions, concerns, or feedback about these Terms of Service, please contact us:\n\n${SUPPORT_EMAIL}\n\nWe aim to respond to all inquiries within 5 business days.`}
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

export default TermsOfServiceScreen;
