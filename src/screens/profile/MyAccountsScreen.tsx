import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useAssets, useDebts, ASSETS_KEY, DEBTS_KEY } from '../../hooks/queries/useNetWorth';
import { useTransactions } from '../../hooks/queries/useTransactions';
import { TRANSACTIONS_KEY } from '../../hooks/queries/useTransactions';
import { DASHBOARD_KEY } from '../../hooks/queries/useDashboard';
import { useCurrency } from '../../utils/currency';
import {
  createAsset,
  updateAsset,
  deleteAsset,
  createDebt,
  updateDebt,
  deleteDebt,
  hasTransactionsForAccount,
} from '../../services/finance.service';
import type { HomeStackParamList } from '../../navigation/types';
import type { AssetItem, DebtItem, AssetCategory, DebtCategory } from '../../types/models';

type Props = StackScreenProps<HomeStackParamList, 'MyAccounts'>;

const CURRENT_MONTH = new Date().toISOString().substring(0, 7);

// ─── Account type definitions ─────────────────────────────────────────────────

type AccountKind =
  | { kind: 'asset'; category: AssetCategory }
  | { kind: 'debt';  category: DebtCategory  };

const ACCOUNT_TYPES: { kind: 'asset' | 'debt'; category: string; label: string; icon: string }[] = [
  { kind: 'asset', category: 'cash',          label: 'Bank Account',   icon: '🏦' },
  { kind: 'asset', category: 'real_estate',   label: 'Real Estate',    icon: '🏠' },
  { kind: 'asset', category: 'vehicle',       label: 'Vehicle',        icon: '🚗' },
  { kind: 'asset', category: 'other',         label: 'Other Asset',    icon: '💰' },
  { kind: 'debt',  category: 'credit_card',   label: 'Credit Card',    icon: '💳' },
  { kind: 'debt',  category: 'personal_loan', label: 'Personal Loan',  icon: '📋' },
  { kind: 'debt',  category: 'mortgage',      label: 'Mortgage',       icon: '🏠' },
  { kind: 'debt',  category: 'auto_loan',     label: 'Auto Loan',      icon: '🚗' },
  { kind: 'debt',  category: 'student_loan',  label: 'Student Loan',   icon: '📚' },
];

const ASSET_ICON: Record<string, string> = {
  cash: '🏦', investment: '📈', real_estate: '🏠', vehicle: '🚗', other: '💰',
};
const DEBT_ICON: Record<string, string> = {
  credit_card: '💳', personal_loan: '📋', mortgage: '🏠', auto_loan: '🚗', student_loan: '📚',
};
const DEBT_LABEL: Record<string, string> = {
  credit_card: 'Credit Card', personal_loan: 'Personal Loan',
  mortgage: 'Mortgage', auto_loan: 'Auto Loan', student_loan: 'Student Loan',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ title, theme }: { title: string; theme: ReturnType<typeof useTheme> }) {
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <Text style={{
      fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted,
      letterSpacing: 1.1, textTransform: 'uppercase',
      marginTop: spacing[5], marginBottom: spacing[2], paddingHorizontal: spacing[5],
    }}>
      {title}
    </Text>
  );
}

// ─── AccountFormModal ─────────────────────────────────────────────────────────

interface FormState {
  id?:      string;
  name:     string;
  kind:     'asset' | 'debt';
  category: string;
  balance:  string;
}

function AccountFormModal({
  visible,
  initial,
  onSave,
  onClose,
}: {
  visible:  boolean;
  initial:  FormState | null;
  onSave:   (state: FormState) => Promise<void>;
  onClose:  () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();

  const isEdit = !!initial?.id;

  const [name,     setName]     = useState('');
  const [kind,     setKind]     = useState<'asset' | 'debt'>('asset');
  const [category, setCategory] = useState('cash');
  const [balance,  setBalance]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  React.useEffect(() => {
    if (visible && initial) {
      setName(initial.name);
      setKind(initial.kind);
      setCategory(initial.category);
      setBalance(initial.balance);
      setError(null);
      setSaving(false);
    } else if (!visible) {
      setName(''); setKind('asset'); setCategory('cash'); setBalance('');
      setError(null); setSaving(false);
    }
  }, [visible, initial]);

  const parsed  = parseFloat(balance.replace(/[^0-9.]/g, '')) || 0;
  const canSave = name.trim().length > 0 && parsed > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({ id: initial?.id, name: name.trim(), kind, category, balance });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  const accentColor = kind === 'debt' ? colors.expense : colors.accent.primary;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={ms.container}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg }}
          contentContainerStyle={{ padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }}
        >
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            {isEdit ? 'Edit Account' : 'Add Account'}
          </Text>

          {/* Name */}
          <Text style={[ms.label, { color: colors.text.muted }]}>NAME</Text>
          <View style={[ms.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? accentColor : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. BDO Savings Account"
              placeholderTextColor={colors.text.muted}
              returnKeyType="next"
              autoFocus={!isEdit}
              style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {/* Account type — only on add */}
          {!isEdit && (
            <>
              <Text style={[ms.label, { color: colors.text.muted }]}>ACCOUNT TYPE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
                {ACCOUNT_TYPES.map(t => {
                  const active = kind === t.kind && category === t.category;
                  return (
                    <Pressable
                      key={`${t.kind}-${t.category}`}
                      onPress={() => { Haptics.selectionAsync(); setKind(t.kind); setCategory(t.category); }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 1, borderColor: active ? accentColor : colors.border.subtle, backgroundColor: active ? accentColor + '15' : colors.bg.base }}
                    >
                      <Text style={{ fontSize: 13, marginRight: 4 }}>{t.icon}</Text>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? accentColor : colors.text.secondary }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Balance */}
          <Text style={[ms.label, { color: colors.text.muted }]}>
            {kind === 'debt' ? 'CURRENT BALANCE OWED' : 'CURRENT BALANCE'}
          </Text>
          <View style={[ms.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parsed > 0 ? accentColor : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={balance}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setBalance(c);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: kind === 'debt' ? colors.expense : colors.text.primary, padding: 0 }}
            />
          </View>

          {error && (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>
              {error}
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
              disabled={!canSave || saving}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: canSave && !saving ? (pressed ? accentColor + 'cc' : accentColor) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: canSave && !saving ? '#FFFFFF' : colors.text.muted }}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Account'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  label:     { fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: '600' },
  inputRow:  { flexDirection: 'row', alignItems: 'center' },
});

// ─── MyAccountsScreen ─────────────────────────────────────────────────────────

export function MyAccountsScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();

  const { data: assets,  isLoading: assetsLoading } = useAssets();
  const { data: debts,   isLoading: debtsLoading   } = useDebts();
  const { data: rawTxns, isLoading: txLoading      } = useTransactions();

  const [formVisible, setFormVisible] = useState(false);
  const [formInitial, setFormInitial] = useState<FormState | null>(null);
  const [mutating,    setMutating]    = useState(false);

  const topPad    = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const isLoading = assetsLoading || debtsLoading || txLoading;

  const bankAccounts  = (assets ?? []).filter((a: AssetItem) => a.category === 'cash');
  const creditCards   = (debts  ?? []).filter((d: DebtItem)  => d.category === 'credit_card');
  const otherAccounts = (assets ?? []).filter((a: AssetItem) => a.category !== 'cash');
  const otherDebts    = (debts  ?? []).filter((d: DebtItem)  => d.category !== 'credit_card');

  const monthlyByAccount = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of rawTxns ?? []) {
      if (!tx.accountId || !tx.date.startsWith(CURRENT_MONTH)) continue;
      const prev = map.get(tx.accountId) ?? 0;
      map.set(tx.accountId, prev + (tx.type === 'expense' ? tx.amount : -tx.amount));
    }
    return map;
  }, [rawTxns]);

  function openAdd() {
    setFormInitial(null);
    setFormVisible(true);
  }

  async function handleSave(state: FormState) {
    const bal = parseFloat(state.balance.replace(/[^0-9.]/g, '')) || 0;
    if (state.id) {
      // Edit
      if (state.kind === 'asset') {
        await updateAsset(state.id, { name: state.name, category: state.category, balance: bal });
      } else {
        await updateDebt(state.id, { name: state.name, balance: bal });
      }
    } else {
      // Add
      if (state.kind === 'asset') {
        await createAsset({ name: state.name, category: state.category, balance: bal });
      } else {
        await createDebt({
          name: state.name, debtType: state.category as DebtCategory,
          balance: bal, originalAmount: bal, interestRate: 0, monthlyPayment: 0,
        });
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
      queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleDelete(item: AssetItem | DebtItem, kind: 'asset' | 'debt') {
    // For assets, guard against deletion if transactions exist
    if (kind === 'asset') {
      setMutating(true);
      let count = 0;
      try {
        count = await hasTransactionsForAccount(item.id);
      } finally {
        setMutating(false);
      }
      if (count > 0) {
        Alert.alert(
          'Cannot Delete',
          `"${item.name}" has ${count} transaction${count !== 1 ? 's' : ''} linked to it. Remove or re-assign those transactions before deleting this account.`,
          [{ text: 'OK' }],
        );
        return;
      }
    }

    Alert.alert(
      'Remove Account',
      `Remove "${item.name}" from your accounts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setMutating(true);
            try {
              if (kind === 'asset') await deleteAsset(item.id);
              else                  await deleteDebt(item.id);
              await Promise.all([
                queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
                queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
                queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
                queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY }),
              ]);
            } catch {
              Alert.alert('Error', 'Failed to remove account. Please try again.');
            } finally {
              setMutating(false);
            }
          },
        },
      ],
    );
  }

  function handleRowLongPress(item: AssetItem | DebtItem, kind: 'asset' | 'debt') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(item.name, undefined, [
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item, kind) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function navigateToTransactions(
    accountId: string, accountName: string,
    accountBalance: number, isDebt: boolean, accountIcon: string, accountCategory: string,
  ) {
    navigation.push('AccountTransactions', { accountId, accountName, accountBalance, isDebt, accountIcon, accountCategory });
  }

  // ── AccountRow ───────────────────────────────────────────────────────────────

  function AccountRow({
    id, icon, name, sub, balance, balanceColor, isDebt: rowIsDebt, item, kind,
  }: {
    id: string; icon: string; name: string; sub: string;
    balance: number; balanceColor: string; isDebt: boolean;
    item: AssetItem | DebtItem; kind: 'asset' | 'debt';
  }) {
    const monthFlow   = monthlyByAccount.get(id);
    const hasActivity = monthFlow !== undefined;

    return (
      <Pressable
        onPress={() => navigateToTransactions(id, name, balance, rowIsDebt, icon, item.category)}
        onLongPress={() => handleRowLongPress(item, kind)}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.surface,
            paddingHorizontal: spacing[4],
            paddingVertical:   spacing[3],
          },
        ]}
      >
        <View style={{ width: 40, height: 40, borderRadius: borderRadius.sm, backgroundColor: colors.accent.muted, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
          <Text style={{ fontSize: 20, lineHeight: 26 }}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>
            {name}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 1 }}>
            {hasActivity
              ? `${fmt(Math.abs(monthFlow!))} ${monthFlow! >= 0 ? 'spent' : 'received'} this month`
              : sub}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: balanceColor }}>
            {fmt(balance)}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.muted }}>›</Text>
        </View>
      </Pressable>
    );
  }

  // ── Empty section box ────────────────────────────────────────────────────────

  function EmptyBox({ message }: { message: string }) {
    return (
      <View style={{ backgroundColor: colors.bg.surface, marginHorizontal: spacing[4], borderRadius: borderRadius.card, padding: 24, alignItems: 'center', minHeight: 72, justifyContent: 'center' }}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          My Accounts
        </Text>
        <Pressable onPress={openAdd} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>+ Add</Text>
        </Pressable>
      </View>

      {isLoading || mutating ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accent.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>

          {/* Bank Accounts */}
          <SectionLabel title={`Bank Accounts (${bankAccounts.length})`} theme={theme} />
          {bankAccounts.length === 0 ? (
            <EmptyBox message={'No bank accounts yet.\nTap "+ Add" to add one.'} />
          ) : (
            <View style={{ marginHorizontal: spacing[4], borderRadius: borderRadius.card, overflow: 'hidden', gap: 1, backgroundColor: colors.border.subtle }}>
              {bankAccounts.map((a: AssetItem) => (
                <AccountRow
                  key={a.id} id={a.id}
                  icon={ASSET_ICON[a.category] ?? '🏦'}
                  name={a.name} sub="Bank Account"
                  balance={a.balance} balanceColor={colors.income}
                  isDebt={false} item={a} kind="asset"
                />
              ))}
            </View>
          )}

          {/* Credit Cards */}
          <SectionLabel title={`Credit Cards (${creditCards.length})`} theme={theme} />
          {creditCards.length === 0 ? (
            <EmptyBox message={'No credit cards yet.\nTap "+ Add" to add one.'} />
          ) : (
            <View style={{ marginHorizontal: spacing[4], borderRadius: borderRadius.card, overflow: 'hidden', gap: 1, backgroundColor: colors.border.subtle }}>
              {creditCards.map((d: DebtItem) => (
                <AccountRow
                  key={d.id} id={d.id}
                  icon={DEBT_ICON[d.category] ?? '💳'}
                  name={d.name} sub={DEBT_LABEL[d.category] ?? 'Credit Card'}
                  balance={d.balance} balanceColor={colors.expense}
                  isDebt={true} item={d} kind="debt"
                />
              ))}
            </View>
          )}

          {/* Other Assets */}
          {otherAccounts.length > 0 && (
            <>
              <SectionLabel title={`Other Assets (${otherAccounts.length})`} theme={theme} />
              <View style={{ marginHorizontal: spacing[4], borderRadius: borderRadius.card, overflow: 'hidden', gap: 1, backgroundColor: colors.border.subtle }}>
                {otherAccounts.map((a: AssetItem) => (
                  <AccountRow
                    key={a.id} id={a.id}
                    icon={ASSET_ICON[a.category] ?? '💰'}
                    name={a.name} sub={a.category.replace('_', ' ')}
                    balance={a.balance} balanceColor={colors.income}
                    isDebt={false} item={a} kind="asset"
                  />
                ))}
              </View>
            </>
          )}

          {/* Other Debts */}
          {otherDebts.length > 0 && (
            <>
              <SectionLabel title={`Loans & Other Debts (${otherDebts.length})`} theme={theme} />
              <View style={{ marginHorizontal: spacing[4], borderRadius: borderRadius.card, overflow: 'hidden', gap: 1, backgroundColor: colors.border.subtle }}>
                {otherDebts.map((d: DebtItem) => (
                  <AccountRow
                    key={d.id} id={d.id}
                    icon={DEBT_ICON[d.category] ?? '📋'}
                    name={d.name} sub={DEBT_LABEL[d.category] ?? 'Loan'}
                    balance={d.balance} balanceColor={colors.expense}
                    isDebt={true} item={d} kind="debt"
                  />
                ))}
              </View>
            </>
          )}

          {/* Hint */}
          <View style={{ marginHorizontal: spacing[4], marginTop: spacing[5], borderRadius: borderRadius.card, backgroundColor: colors.bg.surface, padding: spacing[4] }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', lineHeight: 20 }}>
              Tap any account to view its transactions.{'\n'}Long-press to delete an account.
            </Text>
          </View>

        </ScrollView>
      )}

      <AccountFormModal
        visible={formVisible}
        initial={formInitial}
        onSave={handleSave}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row:     { flexDirection: 'row', alignItems: 'center', minHeight: 64 },
});

export default MyAccountsScreen;
