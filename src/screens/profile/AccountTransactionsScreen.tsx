import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
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
import { useTransactions } from '../../hooks/queries/useTransactions';
import { useCurrency } from '../../utils/currency';
import { ExpenseItem } from '../../components';
import { updateAsset, updateDebt } from '../../services/finance.service';
import { ASSETS_KEY, DEBTS_KEY } from '../../hooks/queries/useNetWorth';
import { DASHBOARD_KEY } from '../../hooks/queries/useDashboard';
import type { WealthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<WealthStackParamList, 'AccountTransactions'>;

type Period     = 'week' | 'month' | 'year';
type TypeFilter = 'all' | 'income' | 'expense' | 'transfer';

const _now       = new Date();
const TODAY      = _now.toISOString().split('T')[0];
const _yd        = new Date(_now); _yd.setDate(_yd.getDate() - 1);
const YESTERDAY  = _yd.toISOString().split('T')[0];
const _ws        = new Date(_now); _ws.setDate(_ws.getDate() - 6);
const WEEK_START = _ws.toISOString().split('T')[0];

function isInPeriod(date: string, period: Period): boolean {
  if (period === 'week')  return date >= WEEK_START && date <= TODAY;
  if (period === 'month') return date.startsWith(TODAY.substring(0, 7));
  return date.startsWith(TODAY.substring(0, 4));
}

function formatDateLabel(date: string): string {
  if (date === TODAY)     return 'Today';
  if (date === YESTERDAY) return 'Yesterday';
  const d = new Date(date + 'T12:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ─── PeriodToggle ─────────────────────────────────────────────────────────────

function PeriodToggle({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const { colors, spacing, borderRadius, fontFamily } = useTheme();
  const opts: { key: Period; label: string }[] = [
    { key: 'week',  label: 'Week'  },
    { key: 'month', label: 'Month' },
    { key: 'year',  label: 'Year'  },
  ];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 2, height: 34 }}>
      {opts.map(({ key, label }) => {
        const active = key === value;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={{ borderRadius: borderRadius.full, paddingHorizontal: spacing[3], height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.bg.surfaceRaised : 'transparent' }}
          >
            <Text style={{ fontSize: 11, fontFamily: active ? fontFamily.semiBold : fontFamily.medium, color: active ? colors.text.primary : colors.text.muted }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, iconColor, iconBg }: {
  label: string; value: string; sub: string;
  icon: string; iconColor: string; iconBg: string;
}) {
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4] }, shadows.sm]}>
      <View style={{ width: 28, height: 28, borderRadius: borderRadius.full, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12, color: iconColor, fontFamily: fontFamily.bold, lineHeight: 16 }}>{icon}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4, marginTop: spacing[2], lineHeight: 24 }}>
        {value}
      </Text>
      <Text numberOfLines={1} style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary, marginTop: 2, lineHeight: 16 }}>
        {label}
      </Text>
      <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2, lineHeight: 14 }}>
        {sub}
      </Text>
    </View>
  );
}

// ─── AccountTransactionsScreen ────────────────────────────────────────────────

export function AccountTransactionsScreen({ navigation, route }: Props) {
  const { accountId, isDebt, accountIcon, accountCategory } = route.params;
  // Use params via state so edits reflect immediately without re-navigating
  const [accountName,    setAccountName]    = useState(route.params.accountName);
  const [accountBalance, setAccountBalance] = useState(route.params.accountBalance);

  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact, symbol } = useCurrency();
  const queryClient = useQueryClient();

  const { data: rawTxns, isLoading } = useTransactions();

  const [period,        setPeriod]        = useState<Period>('month');
  const [typeFilter,    setTypeFilter]    = useState<TypeFilter>('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterVisible, setFilterVisible] = useState(false);

  // ── Edit modal state ───────────────────────────────────────────────────────
  const [editVisible,  setEditVisible]  = useState(false);
  const [editName,     setEditName]     = useState('');
  const [editBalance,  setEditBalance]  = useState('');
  const [saving,       setSaving]       = useState(false);

  function openEdit() {
    setEditName(accountName);
    setEditBalance(String(accountBalance));
    setEditVisible(true);
  }

  async function handleEditSave() {
    const bal = parseFloat(editBalance.replace(/[^0-9.]/g, '')) || 0;
    if (!editName.trim() || bal <= 0 || saving) return;
    setSaving(true);
    try {
      if (isDebt) {
        await updateDebt(accountId, { name: editName.trim(), balance: bal });
      } else {
        await updateAsset(accountId, { name: editName.trim(), category: accountCategory, balance: bal });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
        queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ]);
      // Update local state so header reflects change immediately
      setAccountName(editName.trim());
      setAccountBalance(bal);
      setEditVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 34 : 16);

  // ── All txns for this account ──────────────────────────────────────────────
  const accountTxns = useMemo(() =>
    (rawTxns ?? []).filter(t => t.accountId === accountId),
    [rawTxns, accountId],
  );

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = accountTxns.filter(t => isInPeriod(t.date, period));
    if (typeFilter !== 'all') result = result.filter(t => t.type === typeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(t =>
        t.merchant.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q) ||
        (t.note ?? '').toLowerCase().includes(q),
      );
    }
    return result;
  }, [accountTxns, period, typeFilter, searchQuery]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const income  = filtered.filter(t => t.type === 'income').reduce((s, t)  => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filtered.length };
  }, [filtered]);

  // ── Grouped by date ────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      return dc !== 0 ? dc : b.time.localeCompare(a.time);
    });
    const map = new Map<string, typeof sorted>();
    for (const tx of sorted) {
      const lbl = formatDateLabel(tx.date);
      if (!map.has(lbl)) map.set(lbl, []);
      map.get(lbl)!.push(tx);
    }
    return Array.from(map.entries()).map(([label, items]) => {
      const dayNet = items.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
      return { label, items, dayNet };
    });
  }, [filtered]);

  // ── Entrance animations ────────────────────────────────────────────────────
  const headerAnim = useSharedValue(0);
  const bodyAnim   = useSharedValue(0);

  useEffect(() => {
    const e = Easing.out(Easing.cubic);
    headerAnim.value = withDelay(0,   withTiming(1, { duration: 380, easing: e }));
    bodyAnim.value   = withDelay(100, withTiming(1, { duration: 420, easing: e }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity:   headerAnim.value,
    transform: [{ translateY: interpolate(headerAnim.value, [0, 1], [10, 0]) }],
  }));
  const bodyStyle = useAnimatedStyle(() => ({
    opacity:   bodyAnim.value,
    transform: [{ translateY: interpolate(bodyAnim.value, [0, 1], [16, 0]) }],
  }));

  const balanceColor = isDebt ? colors.expense : colors.income;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[headerStyle, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle }]}>
        {/* Back + Edit row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>←</Text>
            <Text style={{ fontSize: fontSize.bodySm, color: colors.accent.primary, fontFamily: fontFamily.medium }}>Assets</Text>
          </Pressable>

          <Pressable
            onPress={openEdit}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Edit account"
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>Edit</Text>
          </Pressable>
        </View>

        {/* Account identity row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[3], gap: spacing[3] }}>
          <View style={{ width: 48, height: 48, borderRadius: borderRadius.sm, backgroundColor: colors.accent.muted, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, lineHeight: 30 }}>{accountIcon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.3 }}>
              {accountName}
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: balanceColor, marginTop: 2 }}>
              {isDebt ? 'Balance owed: ' : 'Balance: '}<Text style={{ fontFamily: fontFamily.semiBold }}>{fmt(accountBalance)}</Text>
            </Text>
          </View>
        </View>

        {/* Period toggle + filter button */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[3] }}>
          <PeriodToggle value={period} onChange={setPeriod} />
          <Pressable
            onPress={() => setFilterVisible(true)}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: typeFilter !== 'all' ? colors.accent.muted : colors.bg.surfaceMuted,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 16, color: typeFilter !== 'all' ? colors.accent.primary : colors.text.secondary }}>≡</Text>
            {typeFilter !== 'all' && (
              <View style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent.primary }} />
            )}
          </Pressable>
        </View>
      </Animated.View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: btmPad + 32 }}
        >
          <Animated.View style={bodyStyle}>
            {/* ── Stat cards ──────────────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], marginTop: spacing[4] }}>
              <StatCard
                label="Total Spent"
                value={fmtCompact(stats.expense)}
                sub={`${stats.count} transaction${stats.count !== 1 ? 's' : ''}`}
                icon="↓"
                iconColor={colors.expense}
                iconBg={colors.expenseBg}
              />
              <StatCard
                label="Total Income"
                value={fmtCompact(stats.income)}
                sub={`this ${period}`}
                icon="↑"
                iconColor={colors.income}
                iconBg={colors.incomeBg}
              />
              <StatCard
                label="Net"
                value={fmtCompact(Math.abs(stats.net))}
                sub={stats.net >= 0 ? 'surplus' : 'deficit'}
                icon={stats.net >= 0 ? '=' : '!'}
                iconColor={stats.net >= 0 ? colors.income : colors.expense}
                iconBg={stats.net >= 0 ? colors.incomeBg : colors.expenseBg}
              />
            </View>

            {/* ── Search bar ──────────────────────────────────────────────── */}
            <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[4] }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing[4], height: 44, borderWidth: 1, borderColor: colors.border.subtle }}>
                <Text style={{ fontSize: 16, color: colors.text.muted, marginRight: spacing[2] }}>🔍</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search transactions…"
                  placeholderTextColor={colors.text.muted}
                  returnKeyType="search"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: 0 }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                    <Text style={{ fontSize: 11, color: colors.text.muted, fontFamily: fontFamily.bold }}>✕</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* ── Result count ─────────────────────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginTop: spacing[3] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </Text>
              {typeFilter !== 'all' && (
                <Pressable onPress={() => setTypeFilter('all')} hitSlop={8}>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
                    {typeFilter === 'expense' ? '↓ Expenses' : typeFilter === 'income' ? '↑ Income' : '↔ Transfers'} ✕
                  </Text>
                </Pressable>
              )}
            </View>

            {/* ── Transaction groups ──────────────────────────────────────── */}
            {grouped.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
                <Text style={{ fontSize: 36, lineHeight: 44 }}>💸</Text>
                <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, textAlign: 'center', marginTop: spacing[4] }}>
                  No transactions yet
                </Text>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2], lineHeight: 22 }}>
                  Transactions tagged to{'\n'}<Text style={{ fontFamily: fontFamily.semiBold }}>{accountName}</Text> will appear here.
                </Text>
              </View>
            ) : (
              grouped.map(({ label, items, dayNet }) => (
                <View key={label} style={{ marginTop: spacing[4] }}>
                  {/* Date header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginBottom: spacing[2] }}>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted }}>
                      {label}
                    </Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.full, backgroundColor: dayNet < 0 ? colors.expenseBg : colors.incomeBg }}>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: dayNet < 0 ? colors.expense : colors.income }}>
                        {dayNet < 0 ? '-' : '+'}{fmtCompact(Math.abs(dayNet))}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction rows */}
                  <View style={[{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }, shadows.sm]}>
                    {items.map((tx, i) => (
                      <ExpenseItem
                        key={tx.id}
                        id={tx.id}
                        merchant={tx.merchant}
                        categoryKey={tx.category}
                        categoryLabel={tx.categoryLabel}
                        categoryIcon={<Text style={{ fontSize: 18, lineHeight: 22 }}>{tx.categoryIcon}</Text>}
                        amount={fmt(tx.amount)}
                        type={tx.type}
                        date={tx.note ?? ''}
                        time={tx.time}
                        showDivider={i < items.length - 1}
                        onPress={() => navigation.push('TransactionDetail', { id: tx.id, type: tx.type })}
                      />
                    ))}
                  </View>
                </View>
              ))
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* ── Filter Sheet ────────────────────────────────────────────────────── */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setFilterVisible(false)} />
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.bg.surface,
          borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg,
          padding: spacing[5],
          paddingBottom: Math.max(insets.bottom, spacing[5]),
        }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.subtle, alignSelf: 'center', marginBottom: spacing[4] }} />
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Filter Transactions
          </Text>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            TRANSACTION TYPE
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[2], marginBottom: spacing[5] }}>
            {([
              { key: 'all'      as TypeFilter, label: 'All',       icon: '≡',   iconColor: colors.accent.primary, iconBg: colors.accent.muted },
              { key: 'expense'  as TypeFilter, label: 'Expenses',  icon: '↓',   iconColor: colors.expense,        iconBg: colors.expenseBg    },
              { key: 'income'   as TypeFilter, label: 'Income',    icon: '↑',   iconColor: colors.income,         iconBg: colors.incomeBg     },
              { key: 'transfer' as TypeFilter, label: 'Transfers', icon: '↔',   iconColor: colors.accent.primary, iconBg: colors.accent.muted },
            ]).map(({ key, label, icon, iconColor, iconBg }) => {
              const active = typeFilter === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { Haptics.selectionAsync(); setTypeFilter(key); }}
                  style={{
                    flex: 1, paddingVertical: spacing[3], borderRadius: borderRadius.card,
                    borderWidth: 1.5,
                    borderColor: active ? iconColor : colors.border.subtle,
                    backgroundColor: active ? iconColor + '15' : colors.bg.base,
                    alignItems: 'center', gap: spacing[2],
                  }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: active ? iconColor + '30' : iconBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: iconColor, fontFamily: fontFamily.bold, lineHeight: 18 }}>{icon}</Text>
                  </View>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? iconColor : colors.text.secondary }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            onPress={() => setFilterVisible(false)}
            style={({ pressed }) => ({
              height: 48, borderRadius: borderRadius.button,
              backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary,
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Apply</Text>
          </Pressable>
        </View>
      </Modal>

      {/* ── Edit Account Modal ───────────────────────────────────────────────── */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setEditVisible(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <View style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg, padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
              Edit Account
            </Text>

            {/* Name */}
            <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>NAME</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: editName ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }}>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Account name"
                placeholderTextColor={colors.text.muted}
                returnKeyType="next"
                autoFocus
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
              />
            </View>

            {/* Balance */}
            <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>
              {isDebt ? 'CURRENT BALANCE OWED' : 'CURRENT BALANCE'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parseFloat(editBalance) > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[5] }}>
              <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
              <TextInput
                value={editBalance}
                onChangeText={v => {
                  const c = v.replace(/[^0-9.]/g, '');
                  if (c.split('.').length <= 2) setEditBalance(c);
                }}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.text.muted}
                style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: isDebt ? colors.expense : colors.text.primary, padding: 0 }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <Pressable
                onPress={() => setEditVisible(false)}
                style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleEditSave}
                disabled={!editName.trim() || parseFloat(editBalance) <= 0 || saving}
                style={({ pressed }) => {
                  const ok = editName.trim().length > 0 && parseFloat(editBalance) > 0 && !saving;
                  return [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: ok ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }];
                }}
              >
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: editName.trim() && parseFloat(editBalance) > 0 && !saving ? '#FFFFFF' : colors.text.muted }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});

export default AccountTransactionsScreen;
