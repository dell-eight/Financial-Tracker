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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useDebts, DEBTS_KEY, ASSETS_KEY } from '../../../hooks/queries/useNetWorth';
import { DASHBOARD_KEY } from '../../../hooks/queries/useDashboard';
import { useAccounts, ACCOUNTS_KEY } from '../../../hooks/queries/useAccounts';
import { TRANSACTIONS_KEY } from '../../../hooks/queries/useTransactions';
import { createDebt, updateDebtBalance, addDebtCharge, deleteDebt, makeDebtPayment } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import type { DebtCategory, DebtItem } from '../../../types/models';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';

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

// ─── AddDebtModal ─────────────────────────────────────────────────────────────

const DEBT_TYPES: { key: DebtCategory; label: string; icon: string }[] = [
  { key: 'credit_card',   label: 'Credit Card',    icon: '💳' },
  { key: 'personal_loan', label: 'Personal Loan',  icon: '📋' },
  { key: 'mortgage',      label: 'Mortgage',        icon: '🏠' },
  { key: 'auto_loan',     label: 'Auto Loan',       icon: '🚗' },
  { key: 'student_loan',  label: 'Student Loan',    icon: '📚' },
];

function AddDebtModal({
  visible, onSave, onClose,
}: {
  visible: boolean;
  onSave:  (params: { name: string; debtType: DebtCategory; balance: number; originalAmount: number; interestRate: number; monthlyPayment: number }) => Promise<void>;
  onClose: () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();

  const [name,           setName]           = useState('');
  const [debtType,       setDebtType]       = useState<DebtCategory>('credit_card');
  const [balanceStr,     setBalanceStr]     = useState('');
  const [originalStr,    setOriginalStr]    = useState('');
  const [rateStr,        setRateStr]        = useState('');
  const [monthlyStr,     setMonthlyStr]     = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) {
      setName(''); setDebtType('credit_card'); setBalanceStr(''); setOriginalStr('');
      setRateStr(''); setMonthlyStr(''); setError(null); setSaving(false);
    }
  }, [visible]);

  const balance  = parseFloat(balanceStr)  || 0;
  const canSave  = name.trim().length > 0 && balance > 0;

  function numField(v: string, setter: (s: string) => void) {
    const c = v.replace(/[^0-9.]/g, '');
    if (c.split('.').length <= 2) setter(c);
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const original = parseFloat(originalStr) || balance;
      await onSave({
        name:           name.trim(),
        debtType,
        balance,
        originalAmount: original,
        interestRate:   parseFloat(rateStr)    || 0,
        monthlyPayment: parseFloat(monthlyStr) || 0,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add debt. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg }}
          contentContainerStyle={{ padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }}
        >
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Add Debt
          </Text>

          {/* Name */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>NAME</Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? colors.expense : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. BPI Credit Card"
              placeholderTextColor={colors.text.muted}
              autoFocus
              returnKeyType="next"
              style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* Type */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>TYPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
            {DEBT_TYPES.map(t => {
              const active = debtType === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setDebtType(t.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 1, borderColor: active ? colors.expense : colors.border.subtle, backgroundColor: active ? colors.expense + '15' : colors.bg.base }}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{t.icon}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? colors.expense : colors.text.secondary }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Current Balance */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>CURRENT BALANCE</Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: balance > 0 ? colors.expense : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput value={balanceStr} onChangeText={v => numField(v, setBalanceStr)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.text.muted} style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, padding: 0 }} />
          </View>

          {/* Original Amount */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>ORIGINAL AMOUNT <Text style={{ fontFamily: fontFamily.regular, color: colors.text.muted }}>(optional)</Text></Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: originalStr ? colors.border.subtle : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput value={originalStr} onChangeText={v => numField(v, setOriginalStr)} keyboardType="decimal-pad" placeholder={balanceStr || '0'} placeholderTextColor={colors.text.muted} style={{ flex: 1, fontSize: fontSize.bodyLg, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }} />
          </View>

          {/* Interest Rate & Monthly Payment side by side */}
          <View style={{ flexDirection: 'row', gap: spacing[3], marginBottom: spacing[4] }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>INTEREST RATE %</Text>
              <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[3], height: 50 }]}>
                <TextInput value={rateStr} onChangeText={v => numField(v, setRateStr)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.text.muted} style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }} />
                <Text style={{ fontSize: fontSize.bodySm, color: colors.text.muted }}>%</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>MONTHLY PAYMENT</Text>
              <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[3], height: 50 }]}>
                <Text style={{ fontSize: fontSize.bodySm, color: colors.text.muted, marginRight: 2 }}>{symbol}</Text>
                <TextInput value={monthlyStr} onChangeText={v => numField(v, setMonthlyStr)} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.text.muted} style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }} />
              </View>
            </View>
          </View>

          {error && <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>{error}</Text>}

          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Pressable onPress={onClose} style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} disabled={!canSave || saving} style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: (canSave && !saving) ? (pressed ? colors.expense + 'cc' : colors.expense) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>{saving ? 'Saving…' : 'Add Debt'}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AddChargeModal ───────────────────────────────────────────────────────────

function AddChargeModal({
  visible, debt, onSave, onClose,
}: {
  visible: boolean;
  debt:    DebtItem | null;
  onSave:  (id: string, chargeAmount: number) => Promise<void>;
  onClose: () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol, fmt } = useCurrency();
  const [amountStr, setAmountStr] = useState('');
  const [saving,    setSaving]    = useState(false);

  React.useEffect(() => {
    if (visible) { setAmountStr(''); setSaving(false); }
  }, [visible]);

  const amount     = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const newBalance = (debt?.balance ?? 0) + amount;
  const canSave    = amount > 0;

  async function handleSave() {
    if (!debt || !canSave || saving) return;
    setSaving(true);
    try {
      await onSave(debt.id, amount);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <View style={[s.modalSheet, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[1] }}>
            Add to Debt
          </Text>
          {debt && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[4] }}>
              {debt.icon} {debt.name} · Current balance {fmt(debt.balance)}
            </Text>
          )}

          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>
            AMOUNT TO ADD
          </Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: amount > 0 ? colors.expense : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={amountStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setAmountStr(c);
              }}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, padding: 0 }}
            />
          </View>

          {amount > 0 && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[4] }}>
              New balance: <Text style={{ fontFamily: fontFamily.semiBold, color: colors.expense }}>{fmt(newBalance)}</Text>
            </Text>
          )}
          {amount === 0 && <View style={{ marginBottom: spacing[4] }} />}

          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave || saving}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: (!canSave || saving) ? colors.bg.surfaceMuted : pressed ? colors.expense + 'cc' : colors.expense, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: (!canSave || saving) ? colors.text.muted : '#FFFFFF' }}>
                {saving ? 'Saving…' : 'Add Charge'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── PayDebtModal ─────────────────────────────────────────────────────────────

function PayDebtModal({
  visible, debt, onPay, onClose,
}: {
  visible: boolean;
  debt:    DebtItem | null;
  onPay:   (debtId: string, debtName: string, currentBalance: number, amount: number, fromAccountId?: string, fromCurrentBalance?: number) => Promise<void>;
  onClose: () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol, fmt } = useCurrency();
  const { data: accounts = [] } = useAccounts();

  const [amountStr,      setAmountStr]      = useState('');
  const [selectedAccId,  setSelectedAccId]  = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  React.useEffect(() => {
    if (visible && debt) {
      setAmountStr(debt.balance > 0 ? String(debt.balance) : '');
      setSelectedAccId(null);
      setSaving(false);
      setError(null);
    }
  }, [visible, debt]);

  const amount         = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  const selectedAcc    = accounts.find(a => a.id === selectedAccId) ?? null;
  const insufficient   = selectedAcc !== null && amount > 0 && amount > selectedAcc.balance;
  const willPayOff     = debt !== null && amount >= debt.balance && debt.balance > 0;
  const newBalance     = debt ? Math.max(0, debt.balance - amount) : 0;
  const canSave        = amount > 0 && !insufficient;

  function numField(v: string) {
    const c = v.replace(/[^0-9.]/g, '');
    if (c.split('.').length <= 2) setAmountStr(c);
  }

  async function handlePay() {
    if (!debt || !canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onPay(
        debt.id,
        debt.name,
        debt.balance,
        amount,
        selectedAcc?.id,
        selectedAcc?.balance,
      );
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Payment failed. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg }}
          contentContainerStyle={{ padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }}
        >
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[1] }}>
            Make a Payment
          </Text>
          {debt && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[4] }}>
              {debt.icon} {debt.name} · Balance {fmt(debt.balance)}
            </Text>
          )}

          {/* Amount */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>PAYMENT AMOUNT</Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: amount > 0 ? colors.income : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={amountStr}
              onChangeText={numField}
              keyboardType="decimal-pad"
              autoFocus
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.income, padding: 0 }}
            />
          </View>

          {/* New balance preview */}
          {amount > 0 && debt && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[3] }}>
              New balance: <Text style={{ fontFamily: fontFamily.semiBold, color: willPayOff ? colors.income : colors.expense }}>{fmt(newBalance)}</Text>
              {willPayOff && '  🎉 Paid off!'}
            </Text>
          )}

          {/* Bank account picker */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>
            PAY FROM (OPTIONAL)
          </Text>
          <View style={{ gap: spacing[2], marginBottom: spacing[4] }}>
            <Pressable
              onPress={() => setSelectedAccId(null)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.input, borderWidth: 1, borderColor: selectedAccId === null ? colors.income : colors.border.subtle, backgroundColor: selectedAccId === null ? colors.income + '15' : colors.bg.base }}
            >
              <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: selectedAccId === null ? fontFamily.semiBold : fontFamily.regular, color: selectedAccId === null ? colors.income : colors.text.secondary }}>
                No account (track only)
              </Text>
            </Pressable>
            {accounts.map(acc => {
              const active   = selectedAccId === acc.id;
              const noFunds  = acc.balance <= 0;
              const willOver = amount > 0 && amount > acc.balance;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => !noFunds && setSelectedAccId(acc.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.input, borderWidth: 1, borderColor: active ? colors.income : willOver && active ? colors.expense : colors.border.subtle, backgroundColor: active ? colors.income + '15' : colors.bg.base, opacity: noFunds ? 0.4 : 1 }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? colors.income : colors.text.secondary }}>
                      {acc.institutionName}
                    </Text>
                    <Text style={{ fontSize: 10, color: noFunds ? colors.expense : colors.text.muted }}>
                      {noFunds ? 'No funds' : `Balance: ${fmt(acc.balance)}`}
                    </Text>
                  </View>
                  {active && <Text style={{ fontSize: 14 }}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          {insufficient && (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, marginBottom: spacing[3] }}>
              Insufficient funds — {selectedAcc?.institutionName} only has {fmt(selectedAcc?.balance ?? 0)}
            </Text>
          )}
          {error && (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>{error}</Text>
          )}

          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Pressable onPress={onClose} style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handlePay}
              disabled={!canSave || saving}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: (canSave && !saving) ? (pressed ? colors.income + 'cc' : colors.income) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
                {saving ? 'Processing…' : 'Pay Now'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── DebtCard ─────────────────────────────────────────────────────────────────

function DebtCard({
  debt, rank, onTap, onLongPress, onPay,
}: {
  debt: DebtItem; rank?: number; onTap: () => void; onLongPress: () => void; onPay: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();

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
            {fmt(debt.balance)}
          </Text>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>remaining</Text>
        </View>
      </View>

      {/* Progress bar (paid off) */}
      <View style={{ marginBottom: spacing[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] }}>
          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted }}>
            {fmt(debt.originalAmount - debt.balance)} paid of {fmt(debt.originalAmount)}
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
            {fmt(debt.monthlyPayment)}
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

      {/* Make Payment button — hidden once fully paid off */}
      {debt.balance > 0 && (
        <Pressable
          onPress={e => { e.stopPropagation(); onPay(); }}
          style={({ pressed }) => [{
            marginTop:       spacing[3],
            height:          40,
            borderRadius:    borderRadius.button,
            backgroundColor: pressed ? colors.income + 'cc' : colors.income + '20',
            borderWidth:     1,
            borderColor:     colors.income,
            alignItems:      'center',
            justifyContent:  'center',
          }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>
            💳  Make Payment
          </Text>
        </Pressable>
      )}

      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'right' }}>
        Tap to add charges · Long-press to remove
      </Text>
    </Pressable>
  );
}

// ─── DebtsDetailScreen ────────────────────────────────────────────────────────

export function DebtsDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();

  const { data: debts, isLoading } = useDebts();
  const [editTarget,      setEditTarget]      = useState<DebtItem | null>(null);
  const [payTarget,       setPayTarget]       = useState<DebtItem | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [mutating,        setMutating]        = useState(false);
  const [mutatingMsg,     setMutatingMsg]     = useState('Saving…');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const totalDebt = useMemo(
    () => (debts ?? []).reduce((s, d) => s + d.balance, 0),
    [debts],
  );

  const totalMonthly = useMemo(
    () => (debts ?? [])
      .filter(d => d.balance > 0)
      .reduce((s, d) => s + Math.min(d.balance, d.monthlyPayment), 0),
    [debts],
  );

  // Avalanche order: highest interest rate first
  const sortedAvalanche = useMemo(
    () => [...(debts ?? [])].sort((a, b) => b.interestRate - a.interestRate),
    [debts],
  );

  async function handleAddSave(params: { name: string; debtType: DebtCategory; balance: number; originalAmount: number; interestRate: number; monthlyPayment: number }) {
    setMutatingMsg('Saving…');
    setMutating(true);
    try {
      await createDebt(params);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setMutating(false);
    }
  }

  async function handlePay(debtId: string, debtName: string, currentBalance: number, amount: number, fromAccountId?: string, fromCurrentBalance?: number) {
    setMutatingMsg('Processing payment…');
    setMutating(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await makeDebtPayment({ debtId, debtName, currentBalance, paymentAmount: amount, date: today, fromAccountId, fromCurrentBalance });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
        queryClient.invalidateQueries({ queryKey: [...ACCOUNTS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [...TRANSACTIONS_KEY] }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setMutating(false);
    }
  }

  async function handleEditSave(id: string, chargeAmount: number) {
    const debt = (debts ?? []).find(d => d.id === id);
    if (!debt) return;
    await addDebtCharge(id, debt.balance, debt.originalAmount, chargeAmount);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleDelete(item: DebtItem) {
    Alert.alert('Remove Debt', `Remove "${item.name}" from your debts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setMutatingMsg('Removing…');
          setMutating(true);
          try {
            await deleteDebt(item.id);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
              queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
            ]);
          } catch {
            Alert.alert('Error', 'Failed to remove debt. Please try again.');
          } finally {
            setMutating(false);
          }
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
        <Pressable onPress={() => setAddModalVisible(true)} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.expense }}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ── */}
        <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Total Debt
          </Text>
          <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.expense, marginTop: spacing[1], letterSpacing: -1 }}>
            {fmt(totalDebt)}
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
                    {fmt(paidTotal)} paid off
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
            <ActivityIndicator size="large" color={colors.expense} />
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
                onPay={() => { Haptics.selectionAsync(); setPayTarget(debt); }}
              />
            ))}
          </View>
        )}

        {/* ── Monthly summary ── */}
        {(() => {
          const activeDebts = sortedAvalanche.filter(d => d.balance > 0);
          return activeDebts.length > 0 ? (
            <View style={{ marginHorizontal: spacing[5], marginTop: spacing[5] }}>
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing[3] }}>
                  Monthly Commitment
                </Text>
                {activeDebts.map((d, i) => {
                  const commitment    = Math.min(d.balance, d.monthlyPayment);
                  const isFinalPayment = d.balance < d.monthlyPayment;
                  return (
                    <View
                      key={d.id}
                      style={{
                        flexDirection:     'row',
                        alignItems:        'center',
                        paddingVertical:   spacing[2],
                        borderBottomWidth: i < activeDebts.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border.subtle,
                      }}
                    >
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginRight: 6 }}>{d.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>{d.name}</Text>
                        {isFinalPayment && (
                          <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.income }}>Final payment</Text>
                        )}
                      </View>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense }}>
                        {fmt(commitment)}/mo
                      </Text>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[3], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.border.subtle }}>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>Total</Text>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: colors.expense }}>{fmt(totalMonthly)}/mo</Text>
                </View>
              </View>
            </View>
          ) : null;
        })()}
      </ScrollView>

      <AddDebtModal
        visible={addModalVisible}
        onSave={handleAddSave}
        onClose={() => setAddModalVisible(false)}
      />

      <AddChargeModal
        visible={editTarget !== null}
        debt={editTarget}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />

      <PayDebtModal
        visible={payTarget !== null}
        debt={payTarget}
        onPay={handlePay}
        onClose={() => setPayTarget(null)}
      />

      <LoadingOverlay visible={mutating} message={mutatingMsg} />
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
