import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Image,
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
import { useTheme } from '../../hooks/ui/useTheme';
import { useAuthStore } from '../../store/auth.store';
import { useAppStore } from '../../store/app.store';
import { signOut } from '../../services/auth.service';
import { useCurrency } from '../../utils/currency';
import type { ThemePreference } from '../../store/app.store';
import { useAssets, useDebts } from '../../hooks/queries/useNetWorth';
import { useTransactions } from '../../hooks/queries/useTransactions';
import type { HomeStackParamList } from '../../navigation/types';

type Props = StackScreenProps<HomeStackParamList, 'Profile'>;

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ initials, avatarUrl, size, theme }: { initials: string; avatarUrl?: string; size: number; theme: ReturnType<typeof useTheme> }) {
  const { colors, fontFamily } = theme;
  return (
    <View
      style={{
        width:           size,
        height:          size,
        borderRadius:    size / 2,
        backgroundColor: colors.accent.muted,
        borderWidth:     2,
        borderColor:     colors.accent.primary,
        alignItems:      'center',
        justifyContent:  'center',
        overflow:        'hidden',
      }}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size }} />
      ) : (
        <Text
          style={{
            fontSize:   size * 0.36,
            fontFamily: fontFamily.bold,
            color:      colors.accent.primary,
            lineHeight: size * 0.44,
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function StatCard({
  label,
  value,
  sub,
  valueColor,
  subColor,
  theme,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  subColor?: string;
  theme: ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  return (
    <View
      style={{
        flex:            1,
        backgroundColor: colors.bg.surface,
        borderRadius:    borderRadius.lg,
        padding:         spacing[3],
        alignItems:      'center',
        gap:              2,
        ...shadows.card,
      }}
    >
      <Text
        style={{
          fontSize:   fontSize.headingMd,
          fontFamily: fontFamily.bold,
          color:      valueColor ?? colors.text.primary,
          lineHeight: 26,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.medium, color: colors.text.muted, textAlign: 'center' }}>
        {label}
      </Text>
      {sub ? (
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: subColor ?? colors.income }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function SectionHeader({ title, theme }: { title: string; theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text
      style={{
        fontSize:      fontSize.micro,
        fontFamily:    fontFamily.semiBold,
        color:         colors.text.muted,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
        marginTop:     spacing[5],
        marginBottom:  spacing[2],
        paddingHorizontal: spacing[5],
      }}
    >
      {title}
    </Text>
  );
}

function MenuItem({
  icon,
  label,
  value,
  chevron,
  danger,
  onPress,
  right,
  theme,
}: {
  icon:    string;
  label:   string;
  value?:  string;
  chevron?: boolean;
  danger?: boolean;
  onPress?: () => void;
  right?:  React.ReactNode;
  theme:   ReturnType<typeof useTheme>;
}) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor:  colors.bg.surface,
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[3],
          opacity:          pressed && onPress ? 0.75 : 1,
        },
      ]}
      accessibilityRole="button"
    >
      <View
        style={{
          width:           36,
          height:          36,
          borderRadius:    borderRadius.sm,
          backgroundColor: danger ? colors.expenseBg : colors.accent.muted,
          alignItems:      'center',
          justifyContent:  'center',
          marginRight:     spacing[3],
        }}
      >
        <Text style={{ fontSize: 18, lineHeight: 24 }}>{icon}</Text>
      </View>

      <Text
        style={{
          flex:       1,
          fontSize:   fontSize.bodyLg,
          fontFamily: fontFamily.medium,
          color:      danger ? colors.expenseText : colors.text.primary,
        }}
      >
        {label}
      </Text>

      {value ? (
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginRight: spacing[2] }}>
          {value}
        </Text>
      ) : null}

      {right ?? null}

      {chevron ? (
        <Text style={{ fontSize: 18, color: colors.text.muted, lineHeight: 24 }}>›</Text>
      ) : null}
    </Pressable>
  );
}

function MenuGroup({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  const { colors, borderRadius, spacing } = theme;
  return (
    <View
      style={{
        marginHorizontal: spacing[4],
        borderRadius:     borderRadius.lg,
        overflow:         'hidden',
        gap:              1,
        backgroundColor:  colors.border.subtle,
      }}
    >
      {children}
    </View>
  );
}

function ThemeToggle({ theme }: { theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const themePreference    = useAppStore(s => s.themePreference);
  const setThemePreference = useAppStore(s => s.setThemePreference);

  const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
    { value: 'light',  label: 'Light',  icon: '☀️' },
    { value: 'system', label: 'System', icon: '📱' },
    { value: 'dark',   label: 'Dark',   icon: '🌙' },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: spacing[1], flex: 3 }}>
      {OPTIONS.map(opt => {
        const active = themePreference === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setThemePreference(opt.value)}
            style={{
              flex:            1,
              height:          32,
              width:           80,
              borderRadius:    borderRadius.card,
              backgroundColor: active ? colors.accent.primary : colors.bg.surfaceMuted,
              alignItems:      'center',
              justifyContent:  'center',
              flexDirection:   'row',
              gap:             4,
            }}
          >
            <Text style={{ fontSize: 12, lineHeight: 16 }}>{opt.icon}</Text>
            <Text
              style={{
                fontSize:   fontSize.micro,
                fontFamily: fontFamily.medium,
                color:      active ? colors.white : colors.text.secondary,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── ProfileScreen ─────────────────────────────────────────────────────────────

export function ProfileScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const { fmtCompact } = useCurrency();
  const user         = useAuthStore(s => s.user);
  const clearAuth    = useAuthStore(s => s.clearAuth);
  const notifEnabled = useAppStore(s => s.notificationsEnabled);
  const setNotif     = useAppStore(s => s.setNotificationsEnabled);
  const biometric    = useAppStore(s => s.biometricEnabled);
  const setBiometric = useAppStore(s => s.setBiometricEnabled);

  const { data: assets } = useAssets();
  const { data: debts  } = useDebts();
  const { data: txns   } = useTransactions();

  const totalAssets = React.useMemo(() => (assets ?? []).reduce((s, a) => s + a.balance, 0), [assets]);
  const totalDebts  = React.useMemo(() => (debts  ?? []).reduce((s, d) => s + d.balance,  0), [debts]);
  const netWorth    = totalAssets - totalDebts;

  const CURRENT_MONTH = new Date().toISOString().substring(0, 7);
  const monthTxCount  = React.useMemo(() => (txns ?? []).filter(t => t.date.startsWith(CURRENT_MONTH)).length, [txns]);
  const expenseCount  = React.useMemo(() => (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(CURRENT_MONTH)).length, [txns]);
  const monthIncome   = React.useMemo(() => (txns ?? []).filter(t => t.type === 'income' && t.date.startsWith(CURRENT_MONTH)).reduce((s, t) => s + t.amount, 0), [txns]);
  const monthExpense  = React.useMemo(() => (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(CURRENT_MONTH)).reduce((s, t) => s + t.amount, 0), [txns]);
  const savingsRate   = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 1000) / 10 : 0;

  const displayName = (user?.user_metadata?.display_name as string | undefined)
    ?? (user?.user_metadata?.full_name as string | undefined)
    ?? (user?.user_metadata?.name as string | undefined)
    ?? user?.email ?? 'User';
  const initials    = displayName.slice(0, 2).toUpperCase();
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined;
  const memberYear  = user?.created_at ? new Date(user.created_at).getFullYear() : 2024;

  // ── Entrance animations ──────────────────────────────────────────────────
  const a0 = useSharedValue(0);
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 480, easing: Easing.out(Easing.cubic) };
    a0.value = withTiming(1, cfg);
    a1.value = withDelay(100, withTiming(1, cfg));
    a2.value = withDelay(200, withTiming(1, cfg));
  }, []);

  const s0 = useAnimatedStyle(() => ({ opacity: a0.value, transform: [{ translateY: interpolate(a0.value, [0, 1], [16, 0]) }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: a1.value, transform: [{ translateY: interpolate(a1.value, [0, 1], [16, 0]) }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: a2.value, transform: [{ translateY: interpolate(a2.value, [0, 1], [16, 0]) }] }));

  // ── Actions ──────────────────────────────────────────────────────────────
  function handleLogout() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Sign Out',
          style:   'destructive',
          onPress: async () => {
            await signOut();
            clearAuth();
          },
        },
      ],
    );
  }

  const topPad = insets.top > 0 ? insets.top : 44;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* ── Header ── */}
        <Animated.View style={s0}>
          <View
            style={[
              styles.header,
              {
                paddingTop:        topPad + spacing[4],
                paddingBottom:     spacing[8],
                paddingHorizontal: spacing[5],
                backgroundColor:   colors.bg.surface,
              },
            ]}
          >
            <Avatar initials={initials} avatarUrl={avatarUrl} size={80} theme={theme} />

            <Text
              style={{
                fontSize:      fontSize.headingLg,
                fontFamily:    fontFamily.bold,
                color:         colors.text.primary,
                marginTop:     spacing[3],
                letterSpacing: -0.3,
              }}
            >
              {displayName}
            </Text>

            <Text
              style={{
                fontSize:   fontSize.bodyMd,
                fontFamily: fontFamily.regular,
                color:      colors.text.secondary,
                marginTop:  spacing[1],
              }}
            >
              {user?.email ?? ''}
            </Text>

            <View
              style={{
                marginTop:       spacing[3],
                paddingHorizontal: spacing[3],
                paddingVertical:   spacing[1],
                backgroundColor: colors.bg.surfaceMuted,
                borderRadius:    borderRadius.full,
              }}
            >
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
                Member since {memberYear}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats row ── */}
        <Animated.View
          style={[
            s1,
            {
              flexDirection: 'row',
              gap:           spacing[2],
              paddingHorizontal: spacing[4],
              marginTop:     spacing[4],
            },
          ]}
        >
          <StatCard label="Net Worth"   value={fmtCompact(netWorth)} sub="+1.3%" theme={theme} />
          <StatCard label="Spent"       value={fmtCompact(monthExpense)} sub={`${expenseCount} expenses`} subColor={colors.expense} theme={theme} />
          <StatCard label="Savings"     value={`${savingsRate}%`} sub="↑ great"      theme={theme} />
        </Animated.View>

        {/* ── Settings sections ── */}
        <Animated.View style={s2}>

          {/* Account */}
          <SectionHeader title="Account" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="✏️" label="Edit Profile" chevron
              onPress={() => navigation.push('EditProfile')}
              theme={theme}
            />
            <MenuItem
              icon="💱" label="Currency" value={useAppStore(s => s.currency)} chevron
              onPress={() => navigation.push('CurrencyPicker')}
              theme={theme}
            />
            <MenuItem
              icon="📤" label="Export Data" chevron
              onPress={() => navigation.push('DataExport')}
              theme={theme}
            />
          </MenuGroup>

          {/* Security */}
          <SectionHeader title="Security" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="🔐" label="Security Settings" chevron
              onPress={() => navigation.push('SecuritySettings')}
              theme={theme}
            />
            <MenuItem
              icon="🔒"
              label="Biometric Auth"
              right={
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                  thumbColor={biometric ? colors.accent.primary : colors.text.muted}
                />
              }
              theme={theme}
            />
          </MenuGroup>

          {/* Preferences */}
          <SectionHeader title="Preferences" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="🎨"
              label="Theme"
              right={<ThemeToggle theme={theme} />}
              theme={theme}
            />
            <MenuItem
              icon="🔔"
              label="Notifications"
              right={
                <Switch
                  value={notifEnabled}
                  onValueChange={setNotif}
                  trackColor={{ false: colors.bg.surfaceMuted, true: colors.accent.muted }}
                  thumbColor={notifEnabled ? colors.accent.primary : colors.text.muted}
                />
              }
              theme={theme}
            />
          </MenuGroup>

          {/* Support */}
          <SectionHeader title="Support" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="❓" label="Help & Support" chevron
              onPress={() => Alert.alert('Help', 'Coming soon')}
              theme={theme}
            />
            <MenuItem
              icon="📄" label="Privacy Policy" chevron
              onPress={() => Alert.alert('Privacy Policy', 'Coming soon')}
              theme={theme}
            />
            <MenuItem
              icon="📜" label="Terms of Service" chevron
              onPress={() => Alert.alert('Terms', 'Coming soon')}
              theme={theme}
            />
          </MenuGroup>

          {/* Sign Out */}
          <SectionHeader title="Session" theme={theme} />
          <MenuGroup theme={theme}>
            <MenuItem
              icon="🚪" label="Sign Out" danger
              onPress={handleLogout}
              theme={theme}
            />
          </MenuGroup>

          {/* Version */}
          <Text
            style={{
              textAlign:  'center',
              fontSize:   fontSize.bodySm,
              fontFamily: fontFamily.regular,
              color:      colors.text.muted,
              marginTop:  spacing[8],
            }}
          >
            Financial Tracker v1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems:    'center',
    minHeight:     56,
  },
});

export default ProfileScreen;
