import React, { useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useTransactions, TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import { DASHBOARD_KEY } from '../../hooks/queries/useDashboard';
import { BUDGETS_KEY } from '../../hooks/queries/useBudgets';
import { ASSETS_KEY } from '../../hooks/queries/useNetWorth';
import { getCategoryBgColor } from '../../theme';
import { deleteTransaction, updateExpense, updateIncome, getTransferById, deleteTransfer } from '../../services/finance.service';
import type { TransactionsStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';
import { LoadingOverlay } from '../../components/common/LoadingOverlay';
import type { Transaction } from '../../types/models';

type Props = StackScreenProps<TransactionsStackParamList, 'TransactionDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(':');
  const h    = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueColor,
  isLast,
}: {
  label:       string;
  value:       string;
  valueColor?: string;
  isLast?:     boolean;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;

  return (
    <View
      style={[
        drStyles.row,
        {
          paddingHorizontal: spacing[4],
          paddingVertical:   spacing[3],
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, flex: 1 }}>
        {label}
      </Text>
      <Text
        style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: valueColor ?? colors.text.primary, flex: 2, textAlign: 'right' }}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const drStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});

// ─── TransactionDetailScreen ──────────────────────────────────────────────────

export function TransactionDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { symbol, fmt } = useCurrency();
  const { id, type } = route.params;

  const [deleting, setDeleting] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: allTxns } = useTransactions();
  const tx = useMemo<Transaction | undefined>(
    () => allTxns?.find(t => t.id === id),
    [allTxns, id],
  );

  // Edit form state — initialised when entering edit mode
  const [editMerchant,  setEditMerchant]  = useState('');
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editDate,      setEditDate]      = useState('');
  const [editNote,      setEditNote]      = useState('');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const isExpense  = (tx?.type ?? type) === 'expense';
  const isTransfer = (tx?.type ?? type) === 'transfer';
  const amtColor   = isTransfer ? colors.accent.primary : isExpense ? colors.expense : colors.income;
  const catColor   = tx ? (theme.categoryColors[tx.category] ?? colors.accent.primary) : colors.accent.primary;
  const catBg      = tx ? getCategoryBgColor(tx.category) : colors.bg.surfaceMuted;

  function enterEdit() {
    if (!tx) return;
    setEditMerchant(tx.merchant);
    setEditAmountStr(String(tx.amount));
    setEditDate(tx.date);
    setEditNote(tx.note ?? '');
    setIsEditing(true);
    Haptics.selectionAsync();
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function handleSaveEdit() {
    if (!tx || saving) return;
    const amount = parseFloat(editAmountStr.replace(/[^0-9.]/g, ''));
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      if (isExpense) {
        await updateExpense(id, {
          merchant:     editMerchant.trim() || tx.merchant,
          categoryName: tx.categoryLabel,
          categoryIcon: tx.categoryIcon,
          amount,
          date:         editDate,
          note:         editNote.trim() || undefined,
        });
      } else {
        await updateIncome(id, {
          description: editMerchant.trim() || tx.merchant,
          amount,
          date:        editDate,
          note:        editNote.trim() || undefined,
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    const txType = (tx?.type ?? type);
    const label  = txType === 'transfer' ? 'Transfer' : 'Transaction';
    const msg    = txType === 'transfer'
      ? 'This transfer will be permanently removed and both account balances will be reversed.'
      : 'This transaction will be permanently removed.';
    Alert.alert(`Delete ${label}`, msg, [
      { text: 'Cancel', style: 'cancel' },
      {
        text:    'Delete',
        style:   'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setDeleting(true);
          try {
            if (txType === 'transfer') {
              await deleteTransfer(id);
            } else {
              await deleteTransaction(id, txType as 'expense' | 'income');
            }
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
              queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
              queryClient.invalidateQueries({ queryKey: BUDGETS_KEY }),
              queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
            ]);
            navigation.goBack();
          } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            Alert.alert('Delete Failed', msg);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  const [headerStyle, detailStyle, actionStyle] = useScreenAnimation(3);

  // ── Not found ────────────────────────────────────────────────────────────────
  if (!tx) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
        <StatusBar style={theme.statusBarStyle} />
        <View style={{ paddingTop: topPad + spacing[2], paddingHorizontal: spacing[5] }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
              ← Back
            </Text>
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            Transaction not found
          </Text>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
            It may have been deleted
          </Text>
        </View>
      </View>
    );
  }

  const prefix      = isTransfer ? '↔ ' : isExpense ? '-' : '+';
  const displayDate = formatDisplayDate(tx.date);
  const displayTime = formatTime(tx.time);

  // ── Edit mode ─────────────────────────────────────────────────────────────────
  if (isEditing) {
    const editedAmount = parseFloat(editAmountStr.replace(/[^0-9.]/g, '')) || 0;
    return (
      <KeyboardAvoidingView
        style={[styles.screen, { backgroundColor: colors.bg.base }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style={theme.statusBarStyle} />
        <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
          <Pressable onPress={cancelEdit} hitSlop={12} style={{ minWidth: 60 }}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.text.muted, fontFamily: fontFamily.medium }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
            Edit Transaction
          </Text>
          <Pressable onPress={handleSaveEdit} disabled={saving} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: saving ? colors.text.muted : colors.accent.primary }}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing[5], paddingBottom: btmPad + spacing[8] }}>

          {/* Amount */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>AMOUNT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: editedAmount > 0 ? amtColor : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={editAmountStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setEditAmountStr(c);
              }}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: amtColor, padding: 0 }}
            />
          </View>

          {/* Description / Merchant */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>
            {isExpense ? 'MERCHANT / DESCRIPTION' : 'DESCRIPTION'}
          </Text>
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: editMerchant ? colors.border.subtle : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, justifyContent: 'center', marginBottom: spacing[4] }}>
            <TextInput
              value={editMerchant}
              onChangeText={setEditMerchant}
              placeholder={isExpense ? 'e.g. Jollibee' : 'e.g. Salary'}
              placeholderTextColor={colors.text.muted}
              style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* Date */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>DATE (YYYY-MM-DD)</Text>
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[4], height: 50, justifyContent: 'center', marginBottom: spacing[4] }}>
            <TextInput
              value={editDate}
              onChangeText={setEditDate}
              placeholder="2026-06-14"
              placeholderTextColor={colors.text.muted}
              keyboardType="numbers-and-punctuation"
              style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* Note */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>NOTE (OPTIONAL)</Text>
          <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[4], paddingVertical: spacing[3], marginBottom: spacing[6] }}>
            <TextInput
              value={editNote}
              onChangeText={setEditNote}
              placeholder="Add a note…"
              placeholderTextColor={colors.text.muted}
              multiline
              numberOfLines={3}
              style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary, padding: 0, minHeight: 60 }}
            />
          </View>

          {/* Category (read-only) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], gap: spacing[3] }}>
            <View style={{ width: 36, height: 36, borderRadius: borderRadius.full, backgroundColor: catBg, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>{tx.categoryIcon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Category</Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{tx.categoryLabel}</Text>
            </View>
            <Text style={{ fontSize: fontSize.bodySm, color: colors.text.muted }}>cannot edit</Text>
          </View>
        </ScrollView>
        <LoadingOverlay visible={saving} message="Saving…" />
      </KeyboardAvoidingView>
    );
  }

  // ── View mode ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
            ← Back
          </Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Transaction
        </Text>
        {!isTransfer ? (
          <Pressable onPress={enterEdit} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodyMd, color: colors.accent.primary, fontFamily: fontFamily.medium }}>
              Edit
            </Text>
          </Pressable>
        ) : (
          <View style={{ minWidth: 60 }} />
        )}
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <Animated.View style={detailStyle}>
        <View style={[styles.hero, { paddingTop: spacing[6], paddingBottom: spacing[8] }]}>
          <View style={[styles.catCircle, { backgroundColor: catBg, borderRadius: borderRadius.full, width: 72, height: 72 }]}>
            <Text style={{ fontSize: 32, lineHeight: 40 }}>{tx.categoryIcon}</Text>
          </View>

          <View style={[styles.catBadge, { backgroundColor: `${catColor}18`, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: spacing[1], marginTop: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: catColor }}>
              {tx.categoryLabel}
            </Text>
          </View>

          <Text style={{ fontSize: 40, fontFamily: fontFamily.bold, color: amtColor, letterSpacing: -1, marginTop: spacing[4], lineHeight: 48 }}>
            {prefix}{fmt(tx.amount)}
          </Text>

          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[2], textAlign: 'center', paddingHorizontal: spacing[8] }}>
            {tx.merchant}
          </Text>
        </View>

        {/* ── Detail card ─────────────────────────────────────────────────────── */}
        <View style={[styles.detailCard, shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5] }]}>
          <DetailRow label="Date"     value={displayDate} />
          <DetailRow label="Time"     value={displayTime} />
          <DetailRow label="Type"     value={isTransfer ? 'Transfer' : isExpense ? 'Expense' : 'Income'} valueColor={amtColor} />
          {!isTransfer && <DetailRow label="Category" value={tx.categoryLabel} />}
          {isTransfer && (
            <>
              <DetailRow label="From" value={tx.accountName     ?? '—'} />
              <DetailRow label="To"   value={tx.counterpartName ?? '—'} />
            </>
          )}
          {!isTransfer && tx.accountId && (
            <DetailRow
              label={isExpense ? 'Paid from' : 'Deposited to'}
              value={tx.accountName ?? 'Linked account'}
            />
          )}
          <DetailRow
            label="Note"
            value={tx.note ?? '—'}
            valueColor={tx.note ? colors.text.primary : colors.text.muted}
            isLast
          />
        </View>
        </Animated.View>

        {/* ── Delete button ────────────────────────────────────────────────────── */}
        <Animated.View style={actionStyle}>
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              backgroundColor:  pressed ? `${colors.expense}20` : `${colors.expense}0F`,
              borderRadius:     borderRadius.button,
              marginHorizontal: spacing[5],
              marginTop:        spacing[5],
              height:           52,
              borderWidth:      1,
              borderColor:      `${colors.expense}30`,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Delete transaction"
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.expense }}>
            Delete Transaction
          </Text>
        </Pressable>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={deleting} message="Deleting…" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:    { flex: 1 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero:      { alignItems: 'center' },
  catCircle: { alignItems: 'center', justifyContent: 'center' },
  catBadge:  {},
  detailCard:{},
  deleteBtn: { alignItems: 'center', justifyContent: 'center' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default TransactionDetailScreen;
