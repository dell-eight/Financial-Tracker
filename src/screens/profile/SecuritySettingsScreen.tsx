import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing, interpolate,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';
import { isBiometricAvailable, authenticateWithBiometrics } from '../../utils/biometrics';
import { clearPIN } from '../../utils/pin';
import type { HomeStackParamList } from '../../navigation/types';
import type { AutoLockDuration } from '../../store/app.store';

type Props = StackScreenProps<HomeStackParamList, 'SecuritySettings'>;

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title, theme }: { title: string; theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text style={{
      fontSize:          fontSize.micro,
      fontFamily:        fontFamily.semiBold,
      color:             colors.text.muted,
      letterSpacing:     1.1,
      textTransform:     'uppercase',
      marginTop:         spacing[5],
      marginBottom:      spacing[2],
      paddingHorizontal: spacing[5],
    }}>
      {title}
    </Text>
  );
}

function MenuGroup({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  const { colors, borderRadius, spacing } = theme;
  return (
    <View style={{
      marginHorizontal: spacing[4],
      borderRadius:     borderRadius.lg,
      overflow:         'hidden',
      gap:              1,
      backgroundColor:  colors.border.subtle,
    }}>
      {children}
    </View>
  );
}

function RowItem({
  icon, label, desc, right, danger, onPress, theme,
}: {
  icon:     string;
  label:    string;
  desc?:    string;
  right:    React.ReactNode;
  danger?:  boolean;
  onPress?: () => void;
  theme:    ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], paddingHorizontal: spacing[4], backgroundColor: colors.bg.surface, minHeight: 56 }}>
      <View style={{
        width:           36,
        height:          36,
        borderRadius:    borderRadius.sm,
        backgroundColor: danger ? colors.expenseBg : colors.accent.muted,
        alignItems:      'center',
        justifyContent:  'center',
        marginRight:     spacing[3],
      }}>
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, marginRight: spacing[2] }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: danger ? colors.expense : colors.text.primary }}>{label}</Text>
        {desc ? <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>{desc}</Text> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      {inner}
    </Pressable>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatLastSync(isoDate: string | undefined): string {
  if (!isoDate) return 'Unknown';
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)   return 'Just now';
  if (hours < 1)   return `${mins} min ago`;
  if (hours < 24)  return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days  === 1) return 'Yesterday';
  return `${days} days ago`;
}

// ── SecuritySettingsScreen ─────────────────────────────────────────────────────

export function SecuritySettingsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const biometricEnabled         = useAppStore(s => s.biometricEnabled);
  const setBiometricEnabled      = useAppStore(s => s.setBiometricEnabled);
  const pinEnabled               = useAppStore(s => s.pinEnabled);
  const setPinEnabled            = useAppStore(s => s.setPinEnabled);
  const autoLockDuration         = useAppStore(s => s.autoLockDuration);
  const setAutoLockDuration      = useAppStore(s => s.setAutoLockDuration);
  const screenshotPrivacyEnabled = useAppStore(s => s.screenshotPrivacyEnabled);
  const setScreenshotPrivacy     = useAppStore(s => s.setScreenshotPrivacyEnabled);
  const clearAuth                = useAuthStore(s => s.clearAuth);
  const user                     = useAuthStore(s => s.user);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  // ── Entrance animations ──────────────────────────────────────────────────
  const a0 = useSharedValue(0);
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 400, easing: Easing.out(Easing.cubic) };
    a0.value = withTiming(1, cfg);
    a1.value = withDelay(80,  withTiming(1, cfg));
    a2.value = withDelay(160, withTiming(1, cfg));
    a3.value = withDelay(240, withTiming(1, cfg));
  }, []);

  const s0 = useAnimatedStyle(() => ({ opacity: a0.value, transform: [{ translateY: interpolate(a0.value, [0,1], [12,0]) }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: a1.value, transform: [{ translateY: interpolate(a1.value, [0,1], [12,0]) }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: a2.value, transform: [{ translateY: interpolate(a2.value, [0,1], [12,0]) }] }));
  const s3 = useAnimatedStyle(() => ({ opacity: a3.value, transform: [{ translateY: interpolate(a3.value, [0,1], [12,0]) }] }));

  // ── Handlers ────────────────────────────────────────────────────────────
  async function handleBiometricToggle(value: boolean) {
    if (!value) { setBiometricEnabled(false); return; }
    const available = await isBiometricAvailable();
    if (!available) {
      Alert.alert('Not Available', 'Biometrics are not set up on this device. Please enroll Face ID or fingerprint in device Settings first.');
      return;
    }
    const ok = await authenticateWithBiometrics('Confirm to enable biometric unlock');
    if (ok) setBiometricEnabled(true);
    else Alert.alert('Authentication Failed', 'Could not verify your identity. Biometric lock was not enabled.');
  }

  function handlePinToggle(value: boolean) {
    if (value) {
      navigation.push('SetupPIN');
    } else {
      Alert.alert(
        'Remove PIN',
        'Are you sure you want to remove your PIN?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => { await clearPIN(); setPinEnabled(false); },
          },
        ],
      );
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: clearAuth },
      ],
    );
  }

  // ── Security score ───────────────────────────────────────────────────────
  const score =
    (biometricEnabled            ? 1 : 0) +
    (pinEnabled                  ? 1 : 0) +
    (autoLockDuration !== 'never' ? 1 : 0) +
    (screenshotPrivacyEnabled    ? 1 : 0);

  const scoreLabel = score >= 3 ? 'Strong 🟢' : score >= 2 ? 'Moderate 🟡' : 'Weak 🔴';
  const scoreColor = score >= 3 ? colors.income  : score >= 2 ? '#F5A623' : colors.expense;

  const AUTO_LOCK_OPTS: { value: AutoLockDuration; label: string }[] = [
    { value: '1min',  label: '1 min'  },
    { value: '5min',  label: '5 min'  },
    { value: '15min', label: '15 min' },
    { value: 'never', label: 'Never'  },
  ];

  const switchTrack = { false: colors.bg.surfaceMuted, true: colors.accent.muted };

  return (
    <View style={[sc.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View style={[sc.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Security</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Zone 0: Authentication ── */}
        <Animated.View style={s0}>
          <SectionHeader title="Authentication" theme={theme} />
          <MenuGroup theme={theme}>
            <RowItem
              icon="🔒"
              label="Biometric Auth"
              desc={biometricEnabled ? 'Face ID / fingerprint active' : 'Use biometrics to unlock'}
              right={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={switchTrack}
                  thumbColor={biometricEnabled ? colors.accent.primary : colors.text.muted}
                />
              }
              theme={theme}
            />
            <RowItem
              icon="🔢"
              label="PIN Code"
              desc={pinEnabled ? '6-digit PIN enabled' : 'No PIN set'}
              right={
                <Switch
                  value={pinEnabled}
                  onValueChange={handlePinToggle}
                  trackColor={switchTrack}
                  thumbColor={pinEnabled ? colors.accent.primary : colors.text.muted}
                />
              }
              theme={theme}
            />
            {pinEnabled && (
              <RowItem
                icon="🔑"
                label="Change PIN"
                right={<Text style={{ fontSize: 18, color: colors.text.muted, lineHeight: 24 }}>›</Text>}
                onPress={() => navigation.push('ChangePIN')}
                theme={theme}
              />
            )}
          </MenuGroup>
        </Animated.View>

        {/* ── Zone 1: App Lock ── */}
        <Animated.View style={s1}>
          <SectionHeader title="App Lock" theme={theme} />
          <View style={{
            marginHorizontal: spacing[4],
            backgroundColor:  colors.bg.surface,
            borderRadius:     borderRadius.lg,
            padding:          spacing[4],
          }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary, marginBottom: spacing[3] }}>
              Auto-lock after inactivity
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {AUTO_LOCK_OPTS.map(opt => {
                const active = autoLockDuration === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAutoLockDuration(opt.value)}
                    style={{
                      flex:            1,
                      height:          36,
                      borderRadius:    borderRadius.full,
                      backgroundColor: active ? colors.accent.primary : colors.bg.surfaceMuted,
                      alignItems:      'center',
                      justifyContent:  'center',
                    }}
                  >
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? '#FFFFFF' : colors.text.secondary }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle, marginVertical: spacing[3] }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: spacing[3] }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>Screenshot Privacy</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>
                  Block screenshots &amp; task switcher preview
                </Text>
              </View>
              <Switch
                value={screenshotPrivacyEnabled}
                onValueChange={setScreenshotPrivacy}
                trackColor={switchTrack}
                thumbColor={screenshotPrivacyEnabled ? colors.accent.primary : colors.text.muted}
              />
            </View>
          </View>
        </Animated.View>

        {/* ── Zone 2: Data & Privacy ── */}
        <Animated.View style={s2}>
          <SectionHeader title="Data & Privacy" theme={theme} />
          <MenuGroup theme={theme}>
            <RowItem
              icon="📤"
              label="Export Data"
              desc="Download your financial records"
              right={<Text style={{ fontSize: 18, color: colors.text.muted, lineHeight: 24 }}>›</Text>}
              onPress={() => navigation.push('DataExport')}
              theme={theme}
            />
            <RowItem
              icon="🗑️"
              label="Delete Account"
              desc="Permanently removes all data"
              right={<Text style={{ fontSize: 18, color: colors.expense, lineHeight: 24 }}>›</Text>}
              onPress={handleDeleteAccount}
              danger
              theme={theme}
            />
          </MenuGroup>
        </Animated.View>

        {/* ── Zone 3: Security Status ── */}
        <Animated.View style={s3}>
          <SectionHeader title="Security Status" theme={theme} />
          <View style={{
            marginHorizontal: spacing[4],
            backgroundColor:  colors.bg.surface,
            borderRadius:     borderRadius.lg,
            padding:          spacing[4],
          }}>
            {/* Score */}
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: scoreColor, marginBottom: spacing[3] }}>
              {scoreLabel}
            </Text>

            {/* Checklist */}
            {[
              { label: 'Biometric authentication', on: biometricEnabled },
              { label: 'PIN protection',           on: pinEnabled },
              { label: 'Auto-lock enabled',        on: autoLockDuration !== 'never' },
              { label: 'Screenshot protection',    on: screenshotPrivacyEnabled },
            ].map(({ label, on }) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
                <Text style={{ fontSize: 16, marginRight: spacing[2] }}>{on ? '✅' : '⬜'}</Text>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: on ? colors.text.primary : colors.text.muted }}>
                  {label}
                </Text>
              </View>
            ))}

            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle, marginVertical: spacing[3] }} />

            {/* Encryption bullets */}
            {[
              'Data encrypted in transit (TLS)',
              'Supabase auth with RLS enforced',
              'Tokens stored in platform secure storage',
              'Your data is never sold to advertisers',
            ].map(line => (
              <Text key={line} style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 22, marginBottom: spacing[1] }}>
                {'• '}{line}
              </Text>
            ))}

          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default SecuritySettingsScreen;
