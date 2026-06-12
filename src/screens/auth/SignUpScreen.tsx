import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import type { StackScreenProps } from '@react-navigation/stack';
import { AppButton, AppInput } from '../../components';
import { SocialAuthRow } from '../../components/auth/SocialAuthRow';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAuthStore } from '../../store/auth.store';
import { mockRegister } from '../../api/mock/auth.mock';
import type { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'SignUp'>;

// ── EyeIcon text glyph ─────────────────────────────────────────────────────────

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  return (
    <Text style={{ fontSize: 16, color, lineHeight: 20 }}>
      {visible ? '👁' : '🙈'}
    </Text>
  );
}

// ── SignUpScreen ───────────────────────────────────────────────────────────────

export function SignUpScreen({ navigation }: Props) {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const setUser = useAuthStore(s => s.setUser);
  const { colors, spacing, fontSize, fontFamily } = theme;

  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPass?: string;
  }>({});

  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(60, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity:   enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [20, 0]) }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity:   enter.value,
    transform: [{ translateY: interpolate(enter.value, [0, 1], [32, 0]) }],
  }));

  function validate(): boolean {
    const next: typeof errors = {};

    if (!fullName.trim()) {
      next.fullName = 'Full name is required.';
    }
    if (!email.trim() || !email.includes('@')) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }
    if (confirmPass !== password) {
      next.confirmPass = 'Passwords do not match.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { user, token } = await mockRegister({ name: fullName, email, password });
      setUser(user, token);
      // RootNavigator detects isAuthenticated and switches to Main automatically
    } catch {
      setErrors({ email: 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 20);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg.base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + spacing[2], paddingBottom: btmPad + spacing[4] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back button ── */}
        <View style={[styles.backRow, { paddingHorizontal: spacing[5] }]}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={[
              styles.backBtn,
              {
                backgroundColor: colors.bg.surfaceMuted,
                borderRadius:    theme.borderRadius.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
          >
            <Text style={{ fontSize: 18, color: colors.text.primary, lineHeight: 24 }}>
              {'‹'}
            </Text>
          </Pressable>
        </View>

        {/* ── Header ── */}
        <Animated.View
          style={[styles.header, headerStyle, { paddingHorizontal: spacing[5] }]}
        >
          <Text
            style={{
              fontSize:      fontSize.displayLg,
              fontFamily:    fontFamily.bold,
              color:         colors.text.primary,
              letterSpacing: -0.6,
              lineHeight:    38,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize:   fontSize.bodyMd,
              fontFamily: fontFamily.regular,
              color:      colors.text.secondary,
              marginTop:  spacing[1],
              lineHeight: 22,
            }}
          >
            Start your financial journey today
          </Text>
        </Animated.View>

        {/* ── Form ── */}
        <Animated.View
          style={[styles.form, formStyle, { paddingHorizontal: spacing[5] }]}
        >
          <AppInput
            label="Full Name"
            placeholder="Wendell"
            value={fullName}
            onChangeText={t => { setFullName(t); setErrors(e => ({ ...e, fullName: undefined })); }}
            error={errors.fullName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            containerStyle={{ marginBottom: spacing[4] }}
          />

          <AppInput
            label="Email"
            placeholder="john@example.com"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            containerStyle={{ marginBottom: spacing[4] }}
          />

          <AppInput
            label="Password"
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            error={errors.password}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            returnKeyType="next"
            rightIcon={<EyeIcon visible={showPass} color={colors.text.muted} />}
            onRightIconPress={() => setShowPass(v => !v)}
            containerStyle={{ marginBottom: spacing[4] }}
          />

          <AppInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPass}
            onChangeText={t => { setConfirmPass(t); setErrors(e => ({ ...e, confirmPass: undefined })); }}
            error={errors.confirmPass}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            rightIcon={<EyeIcon visible={showConfirm} color={colors.text.muted} />}
            onRightIconPress={() => setShowConfirm(v => !v)}
            containerStyle={{ marginBottom: spacing[5] }}
          />

          <AppButton
            label="Create Account"
            onPress={handleSignUp}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          />

          <SocialAuthRow
            onGooglePress={() => {/* TODO */}}
            onApplePress={() => {/* TODO */}}
            style={{ marginTop: spacing[5] }}
          />

          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: spacing[5], alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Go to sign in"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  backRow: {
    marginBottom: 8,
  },
  backBtn: {
    width:          36,
    height:         36,
    alignItems:     'center',
    justifyContent: 'center',
  },
  header: {
    marginTop:    16,
    marginBottom: 28,
  },
  form: {
    width: '100%',
  },
});

export default SignUpScreen;
