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
import { useAuthStore } from '../../store/auth.store';
import { verifyPIN, storePIN } from '../../utils/pin';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'ChangePIN'>;

type Step = 'current' | 'new' | 'confirm';

export function ChangePINScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily } = theme;

  const userId = useAuthStore(s => s.user?.id ?? '');

  const [step,   setStep]   = useState<Step>('current');
  const [newPin, setNewPin] = useState('');
  const [digits, setDigits] = useState('');
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const shakeX  = useSharedValue(0);
  const dotAnim = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

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

    if (step === 'current') {
      const ok = await verifyPIN(next, userId);
      if (ok) {
        setDigits('');
        setError(null);
        setStep('new');
      } else {
        shake();
        setError('Incorrect PIN. Try again.');
        setDigits('');
      }
    } else if (step === 'new') {
      setNewPin(next);
      setDigits('');
      setError(null);
      setStep('confirm');
    } else {
      if (next === newPin) {
        setSaving(true);
        await storePIN(next, userId);
        navigation.goBack();
      } else {
        shake();
        setError("PINs don't match. Try again.");
        setDigits('');
        setStep('new');
        setNewPin('');
      }
    }
  }

  const LABELS: Record<Step, { title: string; sub: string }> = {
    current: { title: 'Enter current PIN', sub: 'Verify your identity to continue'           },
    new:     { title: 'Enter new PIN',     sub: 'Choose a new 6-digit PIN'                   },
    confirm: { title: 'Confirm new PIN',   sub: 'Enter the same PIN again to confirm'        },
  };
  const { title, sub } = LABELS[step];

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base, paddingTop: topPad, paddingBottom: btmPad }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View style={[s.header, { paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Change PIN</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <View style={s.center}>
        <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>🔑</Text>
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

export default ChangePINScreen;
