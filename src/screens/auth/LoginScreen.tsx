import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
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
import { useLogin } from '../../hooks/queries/useAuth';
import { signInWithGoogle as googleSignIn } from '../../services/auth.service';
import { useAppStore } from '../../store/app.store';
import type { AuthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

// ── EyeIcon text glyph ─────────────────────────────────────────────────────────

function EyeIcon({ visible, color }: { visible: boolean; color: string }) {
  return (
    <Text style={{ fontSize: 16, color, lineHeight: 20 }}>
      {visible ? '👁' : '🙈'}
    </Text>
  );
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── LoginScreen ────────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const login  = useLogin();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const loginLockoutsByEmail = useAppStore((s) => s.loginLockoutsByEmail);
  const recordLoginFailure   = useAppStore((s) => s.recordLoginFailure);
  const clearLoginAttempts   = useAppStore((s) => s.clearLoginAttempts);
  const sweepExpiredLockouts = useAppStore((s) => s.sweepExpiredLockouts);

  // Prune stale lockout entries on mount
  useEffect(() => { sweepExpiredLockouts(); }, []);

  // Countdown clock — ticks every second while the current email is locked out
  const [now, setNow] = useState(Date.now());

  // Form state
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Derive lockout from the current email field — reactive as the user types
  const emailKey     = email.toLowerCase().trim();
  const emailLockout = loginLockoutsByEmail[emailKey] ?? null;
  const isLockedOut  = emailLockout !== null && now < emailLockout;
  const remainingMs  = isLockedOut ? emailLockout - now : 0;

  useEffect(() => {
    if (!emailLockout) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [emailLockout]);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Entrance animation
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

  // ── Validation ──────────────────────────────────────────────────────────────

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(): boolean {
    const next: typeof errors = {};

    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (password.length < 1) {
      next.password = 'Password is required.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (isLockedOut) return;
    if (!validate()) return;

    login.mutate({ email, password }, {
      onError: () => {
        recordLoginFailure(email);
        setErrors({ email: 'Invalid email or password.' });
      },
      onSuccess: ({ error }) => {
        if (error) {
          recordLoginFailure(email);
          setErrors({ email: 'Invalid email or password.' });
        } else {
          clearLoginAttempts(email);
          // On success, RootNavigator's onAuthStateChange switches to Main.
        }
      },
    });
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const { error } = await googleSignIn();
      if (error) {
        Alert.alert('Sign in failed', error);
        setGoogleLoading(false);
      } else {
        // No error — either success (SIGNED_IN fires and covers the rest)
        // or user dismissed the browser without completing OAuth.
        // Wait briefly for onAuthStateChange to fire; if it doesn't, reset.
        setTimeout(() => setGoogleLoading(false), 500);
      }
    } catch {
      setGoogleLoading(false);
    }
  }

  // ── Layout constants ────────────────────────────────────────────────────────
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 20);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 24);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg.base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={theme.statusBarStyle} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + spacing[2], paddingBottom: btmPad + spacing[4] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back button — only when there is a screen to return to ── */}
        {navigation.canGoBack() && (
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
        )}

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
            Welcome Back
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
            Sign in to continue managing your finances
          </Text>
        </Animated.View>

        {/* ── Form ── */}
        <Animated.View
          style={[styles.form, formStyle, { paddingHorizontal: spacing[5] }]}
        >
          {/* Lockout banner */}
          {isLockedOut && (
            <View
              style={[
                styles.lockoutBanner,
                {
                  backgroundColor: colors.border.error + '22',
                  borderColor:     colors.border.error,
                  borderRadius:    theme.borderRadius.md,
                  padding:         spacing[3],
                  marginBottom:    spacing[4],
                },
              ]}
              accessibilityRole="alert"
              accessibilityLabel={`Account temporarily locked. Try again in ${formatCountdown(remainingMs)}`}
            >
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.semiBold,
                  color:      colors.border.error,
                  marginBottom: 2,
                }}
              >
                Too many failed attempts
              </Text>
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.regular,
                  color:      colors.text.secondary,
                }}
              >
                Try again in {formatCountdown(remainingMs)}
              </Text>
            </View>
          )}

          {/* Email */}
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
            editable={!isLockedOut}
          />

          {/* Password row with Forgot Password link */}
          <View>
            <AppInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
              error={errors.password}
              secureTextEntry={!showPass}
              autoCapitalize="none"
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              rightIcon={<EyeIcon visible={showPass} color={colors.text.muted} />}
              onRightIconPress={() => setShowPass(v => !v)}
              editable={!isLockedOut}
            />

            {/* Forgot Password — right-aligned below the input */}
            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignSelf: 'flex-end', marginTop: spacing[2], marginBottom: spacing[5] }}
              accessibilityRole="button"
              accessibilityLabel="Forgot your password"
              hitSlop={8}
            >
              <Text
                style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: fontFamily.medium,
                  color:      colors.accent.primary,
                }}
              >
                Forgot Password?
              </Text>
            </Pressable>
          </View>

          {/* Submit */}
          <AppButton
            label={isLockedOut ? `Locked (${formatCountdown(remainingMs)})` : 'Sign In'}
            onPress={handleLogin}
            variant="primary"
            size="lg"
            fullWidth
            loading={login.isPending}
            disabled={isLockedOut}
          />

          {/* Social auth */}
          <SocialAuthRow
            onGooglePress={handleGoogleSignIn}
            googleLoading={googleLoading}
            style={{ marginTop: spacing[5] }}
          />

          {/* Sign Up link */}
          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            style={{ marginTop: spacing[5], alignItems: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Go to create account"
            hitSlop={8}
          >
            <Text
              style={{
                fontSize:   fontSize.bodyMd,
                fontFamily: fontFamily.regular,
                color:      colors.text.secondary,
              }}
            >
              {"Don't"} have an account?{' '}
              <Text
                style={{
                  color:      colors.accent.primary,
                  fontFamily: fontFamily.semiBold,
                }}
              >
                Sign Up
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
  lockoutBanner: {
    borderWidth: 1,
  },
});

export default LoginScreen;
