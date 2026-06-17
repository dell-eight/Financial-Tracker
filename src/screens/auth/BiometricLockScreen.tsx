import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';
import { isBiometricAvailable, authenticateWithBiometrics } from '../../utils/biometrics';

export function BiometricLockScreen() {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const user              = useAuthStore(s => s.user);
  const clearAuth         = useAuthStore(s => s.clearAuth);
  const setBiometricUnlocked = useAppStore(s => s.setBiometricUnlocked);
  const setBiometricEnabled  = useAppStore(s => s.setBiometricEnabled);

  const [error,    setError]    = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  async function prompt() {
    setError(null);
    setChecking(true);
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        // Hardware not available or not enrolled — disable and unlock
        setBiometricEnabled(false);
        setBiometricUnlocked(true);
        return;
      }
      const success = await authenticateWithBiometrics('Unlock Financial Tracker');
      if (success) {
        setBiometricUnlocked(true);
      } else {
        setError('Authentication failed. Try again.');
      }
    } finally {
      setChecking(false);
    }
  }

  // Auto-prompt on first render
  useEffect(() => { prompt(); }, []);

  const displayEmail = user?.email ?? 'your account';

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base, paddingTop: topPad, paddingBottom: btmPad }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View style={s.center}>
        <Text style={{ fontSize: 72, marginBottom: spacing[4] }}>🔒</Text>

        <Text style={{ fontSize: fontSize.displayLg, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center', letterSpacing: -0.5 }}>
          App Locked
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }}>
          Verify your identity to access{'\n'}
          <Text style={{ fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{displayEmail}</Text>
        </Text>

        {error && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginTop: spacing[4] }}>
            {error}
          </Text>
        )}

        <Pressable
          onPress={prompt}
          disabled={checking}
          style={({ pressed }) => [{
            marginTop:       spacing[8],
            height:          56,
            paddingHorizontal: spacing[8],
            borderRadius:    borderRadius.button,
            backgroundColor: checking
              ? colors.bg.surfaceMuted
              : pressed
              ? colors.accent.pressed
              : colors.accent.primary,
            alignItems:      'center',
            justifyContent:  'center',
            minWidth:        220,
          }]}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: checking ? colors.text.muted : '#FFFFFF' }}>
            {checking ? 'Verifying…' : '👆  Unlock'}
          </Text>
        </Pressable>
      </View>

      {/* Sign out fallback */}
      <Pressable
        onPress={clearAuth}
        hitSlop={12}
        style={{ position: 'absolute', bottom: btmPad + spacing[4], alignSelf: 'center' }}
      >
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
          Sign out instead
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1, alignItems: 'center' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});

export default BiometricLockScreen;
