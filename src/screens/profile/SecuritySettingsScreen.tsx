import React, { useState, useEffect } from 'react';
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
  useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAppStore } from '../../store/app.store';
import { useAuthStore } from '../../store/auth.store';
import { isBiometricAvailable, authenticateWithBiometrics } from '../../utils/biometrics';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'SecuritySettings'>;

// ─── Mock login activity ──────────────────────────────────────────────────────

const SESSIONS = [
  { device: 'iPhone 15 Pro',        location: 'Manila, PH',    time: 'Just now',   current: true  },
  { device: 'MacBook Pro',          location: 'Manila, PH',    time: '2 hours ago', current: false },
  { device: 'Chrome on Windows 11', location: 'Quezon City, PH', time: 'Yesterday',  current: false },
];

// ─── SecuritySettingsScreen ───────────────────────────────────────────────────

export function SecuritySettingsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const biometric    = useAppStore(s => s.biometricEnabled);
  const setBiometric = useAppStore(s => s.setBiometricEnabled);
  const clearAuth    = useAuthStore(s => s.clearAuth);

  async function handleBiometricToggle(value: boolean) {
    if (!value) {
      setBiometric(false);
      return;
    }
    const available = await isBiometricAvailable();
    if (!available) {
      Alert.alert('Not Available', 'Biometrics are not set up on this device. Please enroll Face ID or fingerprint in your device settings first.');
      return;
    }
    const success = await authenticateWithBiometrics('Confirm to enable biometric unlock');
    if (success) {
      setBiometric(true);
    } else {
      Alert.alert('Authentication Failed', 'Could not verify your identity. Biometric lock was not enabled.');
    }
  }

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const [pinEnabled, setPinEnabled]       = useState(true);
  const [twoFAEnabled, setTwoFAEnabled]   = useState(false);
  const [autoLock, setAutoLock]           = useState<'1min' | '5min' | '15min' | 'never'>('5min');
  const [screenshotBlur, setScreenshotBlur] = useState(true);

  const a = [0, 1, 2, 3, 4].map(() => useSharedValue(0));
  useEffect(() => {
    a.forEach((sv, i) => {
      sv.value = 0;
      sv.value = withDelay(i * 70, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    });
  }, []);
  const as = a.map(sv => useAnimatedStyle(() => ({ opacity: sv.value, transform: [{ translateY: (1 - sv.value) * 12 }] })));

  function handleChangePIN() {
    Alert.alert('Change PIN', 'Enter your current 6-digit PIN to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => Alert.alert('PIN Changed', 'Your PIN has been updated successfully.') },
    ]);
  }

  function handleEnable2FA() {
    if (!twoFAEnabled) {
      Alert.alert(
        'Enable 2-Factor Auth',
        'This will link your account to an authenticator app. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Set Up', onPress: () => { setTwoFAEnabled(true); Alert.alert('2FA Enabled', 'Scan the QR code in your authenticator app.'); } },
        ],
      );
    } else {
      Alert.alert('Disable 2FA', 'This will reduce your account security.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disable', style: 'destructive', onPress: () => setTwoFAEnabled(false) },
      ]);
    }
  }

  function handleRevokeSession(device: string) {
    Alert.alert('Sign Out Device', `Sign out "${device}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => Alert.alert('Done', `${device} has been signed out.`) },
    ]);
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

  const AUTO_LOCK_OPTS: { value: typeof autoLock; label: string }[] = [
    { value: '1min',  label: '1 min'  },
    { value: '5min',  label: '5 min'  },
    { value: '15min', label: '15 min' },
    { value: 'never', label: 'Never'  },
  ];

  function RowItem({ icon, label, desc, right, danger }: { icon: string; label: string; desc?: string; right: React.ReactNode; danger?: boolean }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[3], paddingHorizontal: spacing[4] }}>
        <View style={{ width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: danger ? colors.expenseBg : colors.accent.muted, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
          <Text style={{ fontSize: 18, lineHeight: 24 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1, marginRight: spacing[2] }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: danger ? colors.expense : colors.text.primary }}>{label}</Text>
          {desc ? <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>{desc}</Text> : null}
        </View>
        {right}
      </View>
    );
  }

  function CardGroup({ children }: { children: React.ReactNode }) {
    return (
      <View style={[shadows.sm, { marginHorizontal: spacing[5], marginBottom: spacing[4], borderRadius: borderRadius.card, overflow: 'hidden', gap: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Security</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* Authentication */}
        <Animated.View style={as[0]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: spacing[5], marginBottom: spacing[2] }}>
            Authentication
          </Text>
          <CardGroup>
            <View style={{ backgroundColor: colors.bg.surface }}>
              <RowItem
                icon="👆"
                label="Biometric Auth"
                desc={biometric ? 'Face ID / fingerprint active' : 'Use biometrics to unlock'}
                right={
                  <Switch
                    value={biometric}
                    onValueChange={handleBiometricToggle}
                    trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                    thumbColor={biometric ? colors.accent.primary : colors.text.muted}
                  />
                }
              />
            </View>
            <View style={{ backgroundColor: colors.bg.surface }}>
              <RowItem
                icon="🔢"
                label="PIN Code"
                desc={pinEnabled ? '6-digit PIN enabled' : 'No PIN set'}
                right={
                  <Switch
                    value={pinEnabled}
                    onValueChange={setPinEnabled}
                    trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                    thumbColor={pinEnabled ? colors.accent.primary : colors.text.muted}
                  />
                }
              />
            </View>
            {pinEnabled && (
              <View style={{ backgroundColor: colors.bg.surface }}>
                <Pressable onPress={handleChangePIN} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <RowItem
                    icon="🔑"
                    label="Change PIN"
                    right={<Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>}
                  />
                </Pressable>
              </View>
            )}
            <View style={{ backgroundColor: colors.bg.surface }}>
              <Pressable onPress={handleEnable2FA} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <RowItem
                  icon="🛡️"
                  label="Two-Factor Auth"
                  desc={twoFAEnabled ? 'Authenticator app linked' : 'Strongly recommended'}
                  right={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                      {!twoFAEnabled && <View style={{ backgroundColor: colors.expense + '20', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 10, color: colors.expense, fontFamily: fontFamily.semiBold }}>OFF</Text></View>}
                      {twoFAEnabled  && <View style={{ backgroundColor: colors.income + '20',  borderRadius: 99, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 10, color: colors.income,  fontFamily: fontFamily.semiBold }}>ON</Text></View>}
                      <Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>
                    </View>
                  }
                />
              </Pressable>
            </View>
          </CardGroup>
        </Animated.View>

        {/* App Lock */}
        <Animated.View style={as[1]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: spacing[5], marginBottom: spacing[2] }}>
            App Lock
          </Text>
          <View style={[shadows.sm, { marginHorizontal: spacing[5], marginBottom: spacing[4], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[3] }}>
              Auto-lock after inactivity
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              {AUTO_LOCK_OPTS.map(opt => {
                const active = autoLock === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAutoLock(opt.value)}
                    style={{ flex: 1, height: 36, borderRadius: borderRadius.full, backgroundColor: active ? colors.accent.primary : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? colors.white : colors.text.secondary }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border.subtle }}>
              <View>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>Screenshot Privacy</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>Blur app in task switcher</Text>
              </View>
              <Switch
                value={screenshotBlur}
                onValueChange={setScreenshotBlur}
                trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                thumbColor={screenshotBlur ? colors.accent.primary : colors.text.muted}
              />
            </View>
          </View>
        </Animated.View>

        {/* Active Sessions */}
        <Animated.View style={as[2]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: spacing[5], marginBottom: spacing[2] }}>
            Active Sessions
          </Text>
          <View style={[shadows.sm, { marginHorizontal: spacing[5], marginBottom: spacing[4], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
            {SESSIONS.map((sess, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderBottomWidth: i < SESSIONS.length - 1 ? StyleSheet.hairlineWidth : 0, borderBottomColor: colors.border.subtle }}>
                <View style={{ width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: sess.current ? colors.accent.muted : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                  <Text style={{ fontSize: 18 }}>{sess.device.includes('iPhone') ? '📱' : sess.device.includes('Mac') ? '💻' : '🌐'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{sess.device}</Text>
                    {sess.current && <View style={{ backgroundColor: colors.income + '20', borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 }}><Text style={{ fontSize: 9, color: colors.income, fontFamily: fontFamily.semiBold }}>THIS DEVICE</Text></View>}
                  </View>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>{sess.location} · {sess.time}</Text>
                </View>
                {!sess.current && (
                  <Pressable onPress={() => handleRevokeSession(sess.device)} hitSlop={8}>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.expense }}>Revoke</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Danger zone */}
        <Animated.View style={as[3]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.expense, letterSpacing: 1, textTransform: 'uppercase', marginHorizontal: spacing[5], marginBottom: spacing[2] }}>
            Danger Zone
          </Text>
          <View style={[shadows.sm, { marginHorizontal: spacing[5], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
            <Pressable onPress={handleDeleteAccount} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <RowItem
                icon="🗑️"
                label="Delete Account"
                desc="Permanently removes all data"
                right={<Text style={{ fontSize: 18, color: colors.expense }}>›</Text>}
                danger
              />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View style={[as[4], { marginHorizontal: spacing[5], marginTop: spacing[5] }]}>
          <View style={{ backgroundColor: colors.accent.primary + '10', borderRadius: borderRadius.card, padding: spacing[4], borderWidth: 1, borderColor: colors.accent.primary + '20' }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary, marginBottom: spacing[1] }}>🔒 Your data is encrypted</Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
              All financial data is stored locally and encrypted with AES-256. We never transmit your data to third parties.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

export default SecuritySettingsScreen;
