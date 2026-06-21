import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { AppInput } from '../../components/inputs/AppInput/AppInput';
import { updatePassword } from '../../services/auth.service';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'ChangePassword'>;

const FRIENDLY_ERRORS: Record<string, string> = {
  'Auth session missing!':            'Session expired — please sign in again.',
  'New password should be different': 'New password must differ from your current one.',
};

function getStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0;
  if (password.length >= 8)   score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password))    score++;
  return score <= 1 ? 'weak' : score <= 3 ? 'medium' : 'strong';
}

export function ChangePasswordScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  const strength = getStrength(password);
  const showStrength = password.length >= 4;
  const strengthColor =
    strength === 'strong' ? colors.income :
    strength === 'medium' ? colors.warning :
    colors.expense;
  const strengthLabel =
    strength === 'strong' ? 'Strong' :
    strength === 'medium' ? 'Medium' :
    'Weak';
  const strengthWidth =
    strength === 'strong' ? '100%' :
    strength === 'medium' ? '66%' :
    '33%';

  const isValid = password.length >= 8 && password === confirm;

  async function handleSubmit() {
    if (loading) return;
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const { success, error: apiError } = await updatePassword(password);
      if (!success && apiError) {
        setError(FRIENDLY_ERRORS[apiError] ?? apiError);
        return;
      }
      Alert.alert('Password updated', 'Your password has been changed successfully.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Text style={{ fontSize: 16, color: colors.text.muted }}>{visible ? '👁' : '🙈'}</Text>
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Change Password
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: insets.bottom + 40 }}
      >
        {/* New Password */}
        <AppInput
          label="New Password"
          placeholder="Enter new password"
          value={password}
          onChangeText={v => { setPassword(v); setError(null); }}
          secureTextEntry={!showPass}
          autoCapitalize="none"
          autoCorrect={false}
          rightIcon={<EyeIcon visible={showPass} />}
          onRightIconPress={() => setShowPass(p => !p)}
          containerStyle={{ marginBottom: spacing[2] }}
        />

        {/* Strength bar */}
        {showStrength && (
          <View style={{ marginBottom: spacing[4] }}>
            <View style={[s.strengthTrack, { backgroundColor: colors.border.subtle }]}>
              <View style={[s.strengthFill, { width: strengthWidth as any, backgroundColor: strengthColor }]} />
            </View>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: strengthColor, marginTop: spacing[1] }}>
              {strengthLabel}
            </Text>
          </View>
        )}

        {/* Confirm Password */}
        <AppInput
          label="Confirm Password"
          placeholder="Re-enter new password"
          value={confirm}
          onChangeText={v => { setConfirm(v); setError(null); }}
          secureTextEntry={!showConf}
          autoCapitalize="none"
          autoCorrect={false}
          rightIcon={<EyeIcon visible={showConf} />}
          onRightIconPress={() => setShowConf(p => !p)}
          error={error ?? undefined}
          containerStyle={{ marginBottom: spacing[6] }}
        />

        {/* Submit */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || loading}
          style={({ pressed }) => ({
            backgroundColor: isValid && !loading
              ? pressed ? colors.accent.secondary : colors.accent.primary
              : colors.border.subtle,
            borderRadius:    borderRadius.button,
            paddingVertical: spacing[4],
            alignItems:      'center',
            opacity:         loading ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: isValid && !loading ? '#fff' : colors.text.muted }}>
            {loading ? 'Updating…' : 'Update Password'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  strengthTrack:  { height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill:   { height: 4, borderRadius: 2 },
});

export default ChangePasswordScreen;
