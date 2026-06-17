import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppButton, AppInput } from '../../components';
import { useTheme } from '../../hooks/ui/useTheme';
import { resetPassword } from '../../services/auth.service';
import type { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 20);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  async function handleSend() {
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await resetPassword(email.trim().toLowerCase());
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.bg.base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={theme.statusBarStyle} />

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: topPad + spacing[2], paddingBottom: btmPad + spacing[4] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[2] }}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            style={{ width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ fontSize: 18, color: colors.text.primary, lineHeight: 24 }}>‹</Text>
          </Pressable>
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[4], marginBottom: spacing[8] }}>
          <Text style={{ fontSize: 40, marginBottom: spacing[3] }}>🔐</Text>
          <Text style={{ fontSize: fontSize.displayLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.6, lineHeight: 38 }}>
            Forgot Password?
          </Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: spacing[2], lineHeight: 22 }}>
            {"Enter your email and we'll send you a link to reset your password."}
          </Text>
        </View>

        {/* Form */}
        <View style={{ paddingHorizontal: spacing[5] }}>
          {!sent ? (
            <>
              <AppInput
                label="Email"
                placeholder="john@example.com"
                value={email}
                onChangeText={t => { setEmail(t); setError(null); }}
                error={error ?? undefined}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={handleSend}
                containerStyle={{ marginBottom: spacing[5] }}
              />
              <AppButton
                label="Send Reset Link"
                onPress={handleSend}
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              />
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
              <Text style={{ fontSize: 56, marginBottom: spacing[4] }}>📬</Text>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', marginBottom: spacing[3] }}>
                Check your inbox
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing[6] }}>
                We sent a password reset link to{'\n'}
                <Text style={{ fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{email}</Text>
              </Text>
              <AppButton
                label="Back to Login"
                onPress={() => navigation.navigate('Login')}
                variant="secondary"
                size="lg"
                fullWidth
              />
              <Pressable
                onPress={() => { setSent(false); setEmail(''); }}
                style={{ marginTop: spacing[4] }}
                hitSlop={8}
              >
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
                  Try a different email
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { flexGrow: 1 },
});

export default ForgotPasswordScreen;
