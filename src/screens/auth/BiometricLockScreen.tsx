import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Vibration,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';
import { isBiometricAvailable, authenticateWithBiometrics } from '../../utils/biometrics';
import { verifyPIN } from '../../utils/pin';

const PAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function BiometricLockScreen() {
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const user                 = useAuthStore(s => s.user);
  const clearAuth            = useAuthStore(s => s.clearAuth);
  const setBiometricUnlocked = useAppStore(s => s.setBiometricUnlocked);
  const setBiometricEnabled  = useAppStore(s => s.setBiometricEnabled);
  const biometricEnabled     = useAppStore(s => s.biometricEnabled);
  const pinEnabled           = useAppStore(s => s.pinEnabled);

  const [error,        setError]        = useState<string | null>(null);
  const [checking,     setChecking]     = useState(false);
  const [showPin,      setShowPin]      = useState(!biometricEnabled);
  const [digits,       setDigits]       = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);

  const shakeX = useSharedValue(0);
  const dotAnim = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  function shake() {
    Vibration.vibrate(200);
    shakeX.value = withSequence(
      withTiming(-8, { duration: 60 }),
      withTiming(8,  { duration: 60 }),
      withTiming(-6, { duration: 60 }),
      withTiming(6,  { duration: 60 }),
      withTiming(0,  { duration: 60 }),
    );
  }

  async function prompt() {
    setError(null);
    setChecking(true);
    try {
      const available = await isBiometricAvailable();
      if (!available) {
        setBiometricEnabled(false);
        setBiometricUnlocked(true);
        return;
      }
      const success = await authenticateWithBiometrics('Unlock Networthy');
      if (success) {
        setBiometricUnlocked(true);
      } else {
        setError('Authentication failed. Try again.');
      }
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!showPin) prompt();
  }, []);

  async function handleDigit(key: string) {
    if (pinVerifying) return;
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      setError(null);
      return;
    }
    if (key === '') return;
    const next = digits + key;
    setDigits(next);
    if (next.length === 6) {
      setPinVerifying(true);
      const ok = await verifyPIN(next, user?.id ?? '');
      setPinVerifying(false);
      if (ok) {
        setBiometricUnlocked(true);
      } else {
        shake();
        setError('Incorrect PIN. Try again.');
        setDigits('');
      }
    }
  }

  const displayEmail = user?.email ?? 'your account';

  // ── PIN entry mode ─────────────────────────────────────────────────────────
  if (showPin) {
    return (
      <View style={[s.screen, { backgroundColor: colors.bg.base, paddingTop: topPad, paddingBottom: btmPad }]}>
        <StatusBar style={theme.statusBarStyle} />

        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: spacing[4] }}>🔢</Text>
          <Text style={{ fontSize: fontSize.displayLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.5 }}>
            Enter PIN
          </Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, marginTop: spacing[2] }}>
            {displayEmail}
          </Text>

          {/* Dot indicators */}
          <Animated.View style={[{ flexDirection: 'row', gap: 16, marginTop: spacing[6], marginBottom: spacing[2] }, dotAnim]}>
            {[0,1,2,3,4,5].map(i => (
              <View
                key={i}
                style={{
                  width:           14,
                  height:          14,
                  borderRadius:    7,
                  backgroundColor: i < digits.length ? colors.accent.primary : colors.border.subtle,
                  borderWidth:     i < digits.length ? 0 : 1.5,
                  borderColor:     colors.text.muted,
                }}
              />
            ))}
          </Animated.View>

          {error ? (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, fontFamily: fontFamily.regular, marginBottom: spacing[2] }}>
              {error}
            </Text>
          ) : (
            <View style={{ height: 20 + spacing[2] }} />
          )}

          {/* Numpad */}
          <View style={{ width: 280 }}>
            {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
              <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] }}>
                {row.map((key, ki) => (
                  <Pressable
                    key={ki}
                    onPress={() => handleDigit(key)}
                    disabled={key === '' || pinVerifying}
                    style={({ pressed }) => ({
                      width:           80,
                      height:          80,
                      borderRadius:    40,
                      backgroundColor: key === '' ? 'transparent' : pressed ? colors.bg.surfaceRaised : colors.bg.surface,
                      alignItems:      'center',
                      justifyContent:  'center',
                    })}
                  >
                    <Text style={{
                      fontSize:   key === '⌫' ? 22 : fontSize.headingLg,
                      fontFamily: fontFamily.medium,
                      color:      key === '' ? 'transparent' : colors.text.primary,
                    }}>
                      {key}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>

          {biometricEnabled && (
            <Pressable onPress={() => { setShowPin(false); setDigits(''); setError(null); prompt(); }} hitSlop={12} style={{ marginTop: spacing[2] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
                Use Biometrics instead
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={clearAuth} hitSlop={12} style={{ position: 'absolute', bottom: btmPad + spacing[4], alignSelf: 'center' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
            Sign out instead
          </Text>
        </Pressable>
      </View>
    );
  }

  // ── Biometric mode ─────────────────────────────────────────────────────────
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
            marginTop:         spacing[8],
            height:            56,
            paddingHorizontal: spacing[8],
            borderRadius:      borderRadius.button,
            backgroundColor:   checking
              ? colors.bg.surfaceMuted
              : pressed
              ? colors.accent.pressed
              : colors.accent.primary,
            alignItems:        'center',
            justifyContent:    'center',
            minWidth:          220,
          }]}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: checking ? colors.text.muted : '#FFFFFF' }}>
            {checking ? 'Verifying…' : '👆  Unlock'}
          </Text>
        </Pressable>

        {pinEnabled && (
          <Pressable onPress={() => { setShowPin(true); setError(null); }} hitSlop={12} style={{ marginTop: spacing[4] }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.accent.primary }}>
              Use PIN instead
            </Text>
          </Pressable>
        )}
      </View>

      <Pressable onPress={clearAuth} hitSlop={12} style={{ position: 'absolute', bottom: btmPad + spacing[4], alignSelf: 'center' }}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
          Sign out instead
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});

export default BiometricLockScreen;
