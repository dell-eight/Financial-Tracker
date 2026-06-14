import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useNetworkStatus } from '../../hooks/ui/useNetworkStatus';
import { useCurrency } from '../../utils/currency';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { ASSETS_KEY } from '../../hooks/queries/useNetWorth';
import { DASHBOARD_KEY } from '../../hooks/queries/useDashboard';
import { addTransfer } from '../../services/finance.service';
import { useQueryClient } from '@tanstack/react-query';
import type { TransactionsStackParamList } from '../../navigation/types';
import type { Account } from '../../types/models';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';

type Props = StackScreenProps<TransactionsStackParamList, 'AddTransfer'>;

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function AccountPicker({
  label,
  selected,
  accounts,
  onSelect,
}: {
  label:    string;
  selected: Account | null;
  accounts: Account[];
  onSelect: (acc: Account) => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();
  const [open, setOpen] = useState(false);

  return (
    <View style={{ marginBottom: spacing[3] }}>
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[2] }}>
        {label}
      </Text>
      <Pressable
        onPress={() => setOpen(!open)}
        style={[
          pickerStyles.trigger,
          shadows.sm,
          {
            backgroundColor: colors.bg.surface,
            borderRadius:    borderRadius.card,
            borderWidth:     1,
            borderColor:     open ? colors.accent.primary : colors.border.subtle,
            padding:         spacing[4],
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Select ${label}`}
      >
        <View style={{ flex: 1 }}>
          {selected ? (
            <>
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                {selected.institutionName}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                {selected.maskedNumber} · {selected.type}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.regular, color: colors.text.muted }}>
              Select account
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 18, color: open ? colors.accent.primary : colors.text.muted }}>
          {open ? '▲' : '▼'}
        </Text>
      </Pressable>

      {open && (
        <View style={[
          pickerStyles.dropdown,
          shadows.card,
          {
            backgroundColor: colors.bg.surfaceRaised,
            borderRadius:    borderRadius.card,
            marginTop:       spacing[1],
            borderWidth:     1,
            borderColor:     colors.border.subtle,
            overflow:        'hidden',
          },
        ]}>
          {accounts.map((acc, i) => (
            <Pressable
              key={acc.id}
              onPress={() => {
                onSelect(acc);
                setOpen(false);
                Haptics.selectionAsync();
              }}
              style={({ pressed }) => [
                pickerStyles.option,
                {
                  padding:          spacing[4],
                  backgroundColor:  pressed ? colors.bg.surfaceMuted : 'transparent',
                  borderBottomWidth: i < accounts.length - 1 ? StyleSheet.hairlineWidth : 0,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={acc.institutionName}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: selected?.id === acc.id ? fontFamily.semiBold : fontFamily.medium, color: selected?.id === acc.id ? colors.accent.primary : colors.text.primary }}>
                  {acc.institutionName}
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                  {acc.maskedNumber}
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                {fmt(acc.balance)}
              </Text>
              {selected?.id === acc.id && (
                <Text style={{ fontSize: 14, color: colors.accent.primary, marginLeft: spacing[2] }}>✓</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  trigger:  { flexDirection: 'row', alignItems: 'center' },
  dropdown: {},
  option:   { flexDirection: 'row', alignItems: 'center' },
});

export function AddTransferScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { symbol, fmt } = useCurrency();

  const { data: accounts = [] } = useAccounts();

  const [amountStr,   setAmountStr]   = useState('');
  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount,   setToAccount]   = useState<Account | null>(null);
  const [note,        setNote]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  const today       = useMemo(() => new Date(), []);
  const displayDate = useMemo(() => formatDateDisplay(today), [today]);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const parsedAmount = parseFloat(amountStr);
  const canSave =
    amountStr.length > 0 &&
    !isNaN(parsedAmount) &&
    parsedAmount > 0 &&
    fromAccount !== null &&
    toAccount !== null &&
    fromAccount.id !== toAccount.id;

  function handleAmountChange(text: string) {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts   = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] !== undefined && parts[1].length > 2) return;
    setAmountStr(cleaned);
  }

  async function handleSave() {
    if (!canSave || !fromAccount || !toAccount || saving) return;
    if (!isOnline) { setSaveError('No internet connection. Please try again when online.'); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await addTransfer({
        fromAccountId:      fromAccount.id,
        toAccountId:        toAccount.id,
        fromCurrentBalance: fromAccount.balance,
        toCurrentBalance:   toAccount.balance,
        amount:             parsedAmount,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('TransactionList', undefined);
    } catch (e: any) {
      setSaveError(e?.message ?? 'Failed to save transfer. Please try again.');
      setSaving(false);
    }
  }

  const H_PAD = spacing[5];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style="light" />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.navigate('TransactionList', undefined)} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            Cancel
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Add Transfer
        </Text>
        <Pressable onPress={handleSave} disabled={!canSave || saving} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? colors.accent.primary : colors.text.muted }}>
            {saving ? '…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: spacing[4] }}
      >
        {/* ── Amount ──────────────────────────────────────────────────────────── */}
        <View style={[styles.amountSection, { paddingVertical: spacing[5], paddingHorizontal: H_PAD }]}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            AMOUNT
          </Text>
          <View style={styles.amountRow}>
            <Text style={{ fontSize: 44, fontFamily: fontFamily.bold, color: amountStr ? colors.accent.primary : colors.text.muted, lineHeight: 52, marginRight: 4 }}>
              {symbol}
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{ fontSize: 44, fontFamily: fontFamily.bold, color: colors.text.primary, minWidth: 100, padding: 0 }}
            />
          </View>
          <View style={{ width: 160, height: 2, backgroundColor: amountStr ? colors.accent.primary : colors.border.subtle, borderRadius: 1, marginTop: spacing[2] }} />
        </View>

        {/* ── Account pickers ──────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[2] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            ACCOUNTS
          </Text>

          <AccountPicker
            label="From"
            selected={fromAccount}
            accounts={accounts.filter(a => a.id !== toAccount?.id)}
            onSelect={setFromAccount}
          />

          {/* Arrow */}
          <View style={[styles.arrowRow, { marginBottom: spacing[2] }]}>
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }} />
            <View style={[styles.arrowCircle, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border.subtle }]}>
              <Text style={{ fontSize: 18, color: colors.accent.primary }}>↓</Text>
            </View>
            <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border.subtle }} />
          </View>

          <AccountPicker
            label="To"
            selected={toAccount}
            accounts={accounts.filter(a => a.id !== fromAccount?.id)}
            onSelect={setToAccount}
          />
        </View>

        {/* Validation hint */}
        {fromAccount && toAccount && fromAccount.id === toAccount.id && (
          <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[3] }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.expense }}>
              From and To accounts must be different
            </Text>
          </View>
        )}

        {/* ── Details ─────────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[3] }}>
            DETAILS
          </Text>
          <View style={[styles.detailCard, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card }]}>
            {/* Date */}
            <View style={[styles.detailRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle, paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>📅</Text>
              <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, paddingVertical: spacing[3] }}>
                {displayDate}
              </Text>
            </View>
            {/* Note */}
            <View style={[styles.detailRow, { paddingHorizontal: spacing[4] }]}>
              <Text style={{ fontSize: 16, marginRight: spacing[3] }}>📝</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                placeholderTextColor={colors.text.muted}
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, paddingVertical: spacing[3] }}
                returnKeyType="done"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Save button ─────────────────────────────────────────────────────── */}
      <View style={[styles.saveWrap, { paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[3], paddingTop: spacing[3], borderTopColor: colors.border.subtle }]}>
        {saveError && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginBottom: spacing[2] }}>
            {saveError}
          </Text>
        )}
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: (!canSave || saving)
                ? colors.bg.surfaceMuted
                : pressed
                  ? colors.accent.pressed
                  : colors.accent.primary,
              borderRadius: borderRadius.button,
              height:       52,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Save transfer"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {saving ? 'Saving…' : 'Save Transfer'}
          </Text>
        </Pressable>
      </View>
      <LoadingOverlay visible={saving} message="Saving…" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amountSection:{ alignItems: 'center' },
  amountRow:    { flexDirection: 'row', alignItems: 'center' },
  arrowRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  arrowCircle:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  detailCard:   { overflow: 'hidden' },
  detailRow:    { flexDirection: 'row', alignItems: 'center' },
  saveWrap:     { borderTopWidth: StyleSheet.hairlineWidth },
  saveBtn:      { alignItems: 'center', justifyContent: 'center' },
});

export default AddTransferScreen;
