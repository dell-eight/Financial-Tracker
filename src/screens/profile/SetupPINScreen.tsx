import React, { useState } from 'react';
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
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { storePIN } from '../../utils/pin';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'SetupPIN'>;

export function SetupPINScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const setPinEnabled = useAppStore(s => s.setPinEnabled);

  const [step,     setStep]     = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [digits,   setDigits]   = useState('');
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const shakeX   = useSharedValue(0);
  const dotAnim  = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

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

  async function handleDigit(key: string) {
    if (saving) return;
    if (key === '⌫') {
      setDigits(d => d.slice(0, -1));
      setError(null);
      return;
    }
    if (key === '') return;
    const next = digits + key;
    setDigits(next);
    if (next.length < 6) return;

    if (step === 'enter') {
      setFirstPin(next);
      setDigits('');
      setError(null);
      setStep('confirm');
    } else {
      if (next === firstPin) {
        setSaving(true);
        await storePIN(next);
        setPinEnabled(true);
        navigation.goBack();
      } else {
        shake();
        setError("PINs don't match. Try again.");
        setDigits('');
        setStep('enter');
        setFirstPin('');
      }
    }
  }

  const title = step === 'enter' ? 'Set your PIN' : 'Confirm your PIN';
  const sub   = step === 'enter' ? 'Choose a 6-digit PIN to lock the app' : 'Enter the same PIN again to confirm';

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base, paddingTop: topPad, paddingBottom: btmPad }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View style={[s.header, { paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Set PIN</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>🔢</Text>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, textAlign: 'center' }}>
          {title}
        </Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }}>
          {sub}
        </Text>

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

        <View style={{ width: 280 }}>
          {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[3] }}>
              {row.map((key, ki) => (
                <Pressable
                  key={ki}
                  onPress={() => handleDigit(key)}
                  disabled={key === '' || saving}
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
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
});

export default SetupPINScreen;
