import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { AppInput } from '../../components/inputs/AppInput/AppInput';
import { signIn, deleteAccount, signOut } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'DeleteAccountConfirm'>;

const DELETE_KEYWORD = 'DELETE';

export function DeleteAccountConfirmScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const user       = useAuthStore(s => s.user);
  const clearAuth  = useAuthStore(s => s.clearAuth);

  // Phase 1: credential fields
  const [email,     setEmail]     = useState(user?.email ?? '');
  const [password,  setPassword]  = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [phase1Err, setPhase1Err] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Phase 2: shown after credentials verified
  const [phase,      setPhase]      = useState<1 | 2>(1);
  const [deleteText, setDeleteText] = useState('');
  const [phase2Err,  setPhase2Err]  = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  // Slide-in animation for Phase 2
  const phase2Opacity = useSharedValue(0);
  const phase2Style   = useAnimatedStyle(() => ({ opacity: phase2Opacity.value }));

  function showPhase2() {
    setPhase(2);
    phase2Opacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  }

  async function handleVerify() {
    if (verifying) return;
    const trimEmail = email.trim();
    if (!trimEmail) { setPhase1Err('Email is required.'); return; }
    if (!password)  { setPhase1Err('Password is required.'); return; }

    setVerifying(true);
    setPhase1Err(null);
    try {
      const { error } = await signIn({ email: trimEmail, password });
      if (error) {
        setPhase1Err('Incorrect email or password.');
        return;
      }
      showPhase2();
    } finally {
      setVerifying(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    if (deleteText !== DELETE_KEYWORD) return;

    setDeleting(true);
    setPhase2Err(null);
    try {
      const { error } = await deleteAccount();
      if (error) {
        setPhase2Err(`Could not delete account: ${error}`);
        return;
      }
      await signOut();
      clearAuth();
    } finally {
      setDeleting(false);
    }
  }

  const canVerify  = email.trim().length > 0 && password.length > 0;
  const canDelete  = deleteText === DELETE_KEYWORD;

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Text style={{ fontSize: 16, color: colors.text.muted }}>{visible ? '👁' : '🙈'}</Text>
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense }}>
          Delete Account
        </Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: insets.bottom + 40 }}
      >
        {/* Warning banner */}
        <View style={[s.warningBox, { backgroundColor: colors.expenseBg, borderRadius: borderRadius.md, marginBottom: spacing[6] }]}>
          <Text style={{ fontSize: 22, marginBottom: spacing[2] }}>⚠️</Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.expense, marginBottom: spacing[1] }}>
            This cannot be undone
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, opacity: 0.85, textAlign: 'center' }}>
            All your accounts, transactions, budgets, and financial data will be permanently deleted.
          </Text>
        </View>

        {/* ── Phase 1: Verify identity ─────────────────────────────── */}
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing[3] }}>
          Verify Your Identity
        </Text>

        <AppInput
          label="Email"
          placeholder="your@email.com"
          value={email}
          onChangeText={v => { setEmail(v); setPhase1Err(null); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={phase === 1}
          containerStyle={{ marginBottom: spacing[4], opacity: phase === 2 ? 0.5 : 1 }}
        />

        <AppInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={v => { setPassword(v); setPhase1Err(null); }}
          secureTextEntry={!showPass}
          autoCapitalize="none"
          autoCorrect={false}
          editable={phase === 1}
          rightIcon={<EyeIcon visible={showPass} />}
          onRightIconPress={() => setShowPass(p => !p)}
          error={phase1Err ?? undefined}
          containerStyle={{ marginBottom: spacing[4], opacity: phase === 2 ? 0.5 : 1 }}
        />

        {phase === 1 && (
          <Pressable
            onPress={handleVerify}
            disabled={!canVerify || verifying}
            style={({ pressed }) => ({
              backgroundColor: canVerify && !verifying
                ? pressed ? colors.accent.secondary : colors.accent.primary
                : colors.border.subtle,
              borderRadius:    borderRadius.button,
              paddingVertical: spacing[4],
              alignItems:      'center',
              marginBottom:    spacing[6],
              opacity:         verifying ? 0.7 : 1,
            })}
          >
            {verifying
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canVerify ? '#fff' : colors.text.muted }}>
                  Verify Identity
                </Text>
            }
          </Pressable>
        )}

        {phase === 1 && (
          <Pressable onPress={() => navigation.goBack()} style={{ alignItems: 'center', paddingVertical: spacing[3] }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Cancel</Text>
          </Pressable>
        )}

        {/* ── Phase 2: Final confirmation ──────────────────────────── */}
        {phase === 2 && (
          <Animated.View style={phase2Style}>
            {/* Divider */}
            <View style={[s.divider, { backgroundColor: colors.border.subtle, marginBottom: spacing[5] }]} />

            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing[3] }}>
              Final Confirmation
            </Text>

            <View style={[s.confirmBox, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.md, borderColor: colors.expense, marginBottom: spacing[4] }]}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
                Identity confirmed. To permanently delete your account, type{' '}
                <Text style={{ fontFamily: fontFamily.bold, color: colors.expense, letterSpacing: 1 }}>DELETE</Text>
                {' '}in the field below.
              </Text>
            </View>

            {/* DELETE text input */}
            <View style={{ marginBottom: spacing[2] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary, marginBottom: spacing[2] }}>
                Type DELETE to confirm
              </Text>
              <TextInput
                value={deleteText}
                onChangeText={v => { setDeleteText(v); setPhase2Err(null); }}
                placeholder="DELETE"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[
                  s.deleteInput,
                  {
                    backgroundColor: colors.bg.surface,
                    borderColor:     deleteText === DELETE_KEYWORD ? colors.expense : colors.border.subtle,
                    borderRadius:    borderRadius.input ?? borderRadius.md,
                    color:           colors.text.primary,
                    fontFamily:      fontFamily.semiBold,
                    fontSize:        fontSize.bodyMd,
                    paddingHorizontal: spacing[4],
                    paddingVertical:   spacing[3],
                    marginBottom:      spacing[1],
                    letterSpacing:     2,
                  },
                ]}
              />
            </View>

            {phase2Err && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, marginBottom: spacing[3] }}>
                {phase2Err}
              </Text>
            )}

            {/* Delete forever button */}
            <Pressable
              onPress={handleDelete}
              disabled={!canDelete || deleting}
              style={({ pressed }) => ({
                backgroundColor: canDelete && !deleting
                  ? pressed ? '#c0392b' : colors.expense
                  : colors.border.subtle,
                borderRadius:    borderRadius.button,
                paddingVertical: spacing[4],
                alignItems:      'center',
                marginBottom:    spacing[3],
                marginTop:       spacing[2],
                opacity:         deleting ? 0.7 : 1,
              })}
            >
              {deleting
                ? <ActivityIndicator color="#fff" />
                : <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: canDelete ? '#fff' : colors.text.muted }}>
                    Delete My Account Forever
                  </Text>
              }
            </Pressable>

            <Pressable onPress={() => navigation.goBack()} style={{ alignItems: 'center', paddingVertical: spacing[3] }}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Cancel</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  warningBox: { padding: 20, alignItems: 'center' },
  divider:    { height: StyleSheet.hairlineWidth, marginBottom: 0 },
  confirmBox: { padding: 16, borderWidth: 1 },
  deleteInput:{
    height:      52,
    borderWidth: 1.5,
  },
});

export default DeleteAccountConfirmScreen;
