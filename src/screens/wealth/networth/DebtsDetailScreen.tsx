import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
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
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useDebts, DEBTS_KEY } from '../../../hooks/queries/useNetWorth';
import type { WealthStackParamList } from '../../../navigation/types';
import type { DebtCategory, DebtItem } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'DebtsDetail'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DebtCategory, string> = {
  credit_card:   'Credit Cards',
  personal_loan: 'Personal Loans',
  mortgage:      'Mortgage',
  auto_loan:     'Auto Loans',
  student_loan:  'Student Loans',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}k`;
  return `₱${Math.round(n)}`;
}

// Estimated months to pay off at current monthly payment
function monthsToPayoff(balance: number, monthly: number, rate: number): number | null {
  if (monthly <= 0) return null;
  const r = rate / 100 / 12;
  if (r === 0) return Math.ceil(balance / monthly);
  // n = -ln(1 - r*B/P) / ln(1+r)
  const inside = 1 - (r * balance) / monthly;
  if (inside <= 0) return null;
  return Math.ceil(-Math.log(inside) / Math.log(1 + r));
}

// ─── EditDebtModal ────────────────────────────────────────────────────────────

function EditDebtModal({
  visible, debt, onSave, onClose,
}: {
  visible: boolean;
  debt:    DebtItem | null;
  onSave:  (id: string, newBalance: number) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const [valueStr, setValueStr] = useState('');
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible && debt) setValueStr(String(debt.balance));
  }, [visible, debt]);

  const parsed  = parseFloat(valueStr.replace(/[^0-9.]/g, '')) || 0;
  const canSave = parsed >= 0;

  function handleSave() {
    if (!debt) return;
    onSave(debt.id, parsed);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <View style={[s.modalSheet, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Update Balance
          </Text>
          {debt && (
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[3] }}>
              {debt.icon} {debt.name}
            </Text>
          )}
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: canSave ? colors.expense : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>₱</Text>
            <TextInput
              value={valueStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setValueStr(c);
              }}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, padding: 0 }}
            />
          </View>
          {parsed === 0 && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.income, marginBottom: spacing[3] }}>
              🎉 Setting to ₱0 marks this debt as paid off!
            </Text>
          )}
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: pressed ? colors.expense + 'cc' : colors.expense, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Update</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── DebtCard ─────────────────────────────────────────────────────────────────

function DebtCard({
  debt, rank, onTap, onLongPress,
}: {
  debt: DebtItem; rank?: number; onTap: () => void; onLongPress: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const paidOff = debt.originalAmount > 0 ? 1 - debt.balance / debt.originalAmount : 0;
  const paidPct = Math.max(0, Math.min(paidOff * 100, 100));
  const months  = monthsToPayoff(debt.balance, debt.monthlyPayment, debt.interestRate);

  return (
    <Pressable
      onPress={onTap}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        shadows.card,
        {
          backgroundColor: colors.bg.surface,
          borderRadius:    borderRadius.card,
          padding:         spacing[4],
          opacity:         pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Top row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
        <View style={{ width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: debt.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
          <Text style={{ fontSize: 18 }}>{debt.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{debt.name}</Text>
            {rank !== undefined && (
              <View style={{ backgroundColor: debt.color + '20', borderRadius: borderRadius.full, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 9, fontFamily: fontFamily.semiBold, color: debt.color }}>#{rank} Priority</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {CATEGORY_LABELS[debt.category]} · {debt.interestRate}% APR
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.expense }}>
            {fmtShort(debt.balance)}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>remaining</Text>
        </View>
      </View>

      {/* Progress bar (paid off) */}
      <View style={{ marginBottom: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] }}>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>
            {fmtShort(debt.originalAmount - debt.balance)} paid of {fmtShort(debt.originalAmount)}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.income }}>
            {paidPct.toFixed(0)}% paid off
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
          <View style={{ height: '100%', width: `${paidPct}%`, backgroundColor: colors.income, borderRadius: 99 }} />
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: spacing[4] }}>
        <View>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>Monthly</Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }}>
            {fmtShort(debt.monthlyPayment)}
          </Text>
        </View>
        {months !== null && (
          <View>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>Payoff</Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }}>
              {months >= 12 ? `${Math.floor(months / 12)}y ${months % 12}m` : `${months}mo`}
            </Text>
          </View>
        )}
        <View>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>Interest</Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense, marginTop: 2 }}>
            {debt.interestRate}%
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3], textAlign: 'right' }}>
        Tap to update balance · Long-press to remove
      </Text>
    </Pressable>
  );
}

// ─── DebtsDetailScreen ────────────────────────────────────────────────────────

export function DebtsDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const { data: debts, isLoading } = useDebts();
  const [editTarget, setEditTarget] = useState<DebtItem | null>(null);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const totalDebt = useMemo(
    () => (debts ?? []).reduce((s, d) => s + d.balance, 0),
    [debts],
  );

  const totalMonthly = useMemo(
    () => (debts ?? []).reduce((s, d) => s + d.monthlyPayment, 0),
    [debts],
  );

  // Avalanche order: highest interest rate first
  const sortedAvalanche = useMemo(
    () => [...(debts ?? [])].sort((a, b) => b.interestRate - a.interestRate),
    [debts],
  );

  function handleEditSave(id: string, newBalance: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    queryClient.setQueryData(
      DEBTS_KEY,
      (old: DebtItem[] | undefined) => (old ?? []).map(d => d.id === id ? { ...d, balance: newBalance } : d),
    );
  }

  function handleDelete(item: DebtItem) {
    const itemName = item.name;
    Alert.alert('Remove Debt', `Remove "${itemName}" from your debts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          queryClient.setQueryData(
            DEBTS_KEY,
            (old: DebtItem[] | undefined) => (old ?? []).filter(d => d.id !== item.id),
          );
        },
      },
    ]);
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Debts</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ── */}
        <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Total Debt
          </Text>
          <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.expense, marginTop: spacing[1], letterSpacing: -1 }}>
            {fmtShort(totalDebt)}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 4 }}>
            {fmt(totalMonthly)}/mo total payments across {(debts ?? []).length} {(debts ?? []).length === 1 ? 'debt' : 'debts'}
          </Text>

          {/* Overall paid-off bar */}
          {(debts ?? []).length > 0 && (() => {
            const origTotal = (debts ?? []).reduce((s, d) => s + d.originalAmount, 0);
            const paidTotal = origTotal - totalDebt;
            const paidPct   = origTotal > 0 ? (paidTotal / origTotal) * 100 : 0;
            return (
              <View style={{ marginTop: spacing[4] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing[1] }}>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                    {fmtShort(paidTotal)} paid off
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.income }}>
                    {paidPct.toFixed(1)}% complete
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                  <View style={{ height: '100%', width: `${paidPct}%`, backgroundColor: colors.income, borderRadius: 99 }} />
                </View>
              </View>
            );
          })()}
        </View>

        {/* ── Avalanche strategy tip ── */}
        {(debts ?? []).length > 1 && (
          <View style={{ marginHorizontal: spacing[5], marginBottom: spacing[5] }}>
            <View style={[shadows.sm, { backgroundColor: colors.accent.primary + '15', borderRadius: borderRadius.card, padding: spacing[4], borderWidth: 1, borderColor: colors.accent.primary + '30' }]}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary, marginBottom: spacing[2] }}>
                💡 Debt Avalanche Strategy
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 20 }}>
                Pay minimums on all debts, then put extra money on the highest-rate debt first. This saves the most in interest over time.
              </Text>
            </View>
          </View>
        )}

        {/* ── Debt cards ── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
            Your Debts
          </Text>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>Loading debts…</Text>
          </View>
        ) : (debts ?? []).length === 0 ? (
          <View style={{ marginHorizontal: spacing[5], backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle }}>
            <Text style={{ fontSize: 36 }}>🎉</Text>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
              Debt Free!
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
              You have no outstanding debts. Keep up the great work!
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing[5], gap: spacing[3] }}>
            {sortedAvalanche.map((debt, i) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                rank={i + 1}
                onTap={() => { Haptics.selectionAsync(); setEditTarget(debt); }}
                onLongPress={() => handleDelete(debt)}
              />
            ))}
          </View>
        )}

        {/* ── Monthly summary ── */}
        {(debts ?? []).length > 0 && (
          <View style={{ marginHorizontal: spacing[5], marginTop: spacing[5] }}>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing[3] }}>
                Monthly Commitment
              </Text>
              {sortedAvalanche.map((d, i) => (
                <View
                  key={d.id}
                  style={{
                    flexDirection:     'row',
                    alignItems:        'center',
                    paddingVertical:   spacing[2],
                    borderBottomWidth: i < sortedAvalanche.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                  }}
                >
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginRight: 6 }}>{d.icon}</Text>
                  <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>{d.name}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense }}>
                    {fmtShort(d.monthlyPayment)}/mo
                  </Text>
                </View>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[3], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.border.subtle }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>Total</Text>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: colors.expense }}>{fmt(totalMonthly)}/mo</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <EditDebtModal
        visible={editTarget !== null}
        debt={editTarget}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputRow:       { flexDirection: 'row', alignItems: 'center' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet:     {},
});

export default DebtsDetailScreen;
