import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
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
import { useTheme } from '../../../hooks/ui/useTheme';
import { useAssets, ASSETS_KEY, DEBTS_KEY } from '../../../hooks/queries/useNetWorth';
import { useSavingsGoals } from '../../../hooks/queries/useSavingsGoals';
import { DASHBOARD_KEY } from '../../../hooks/queries/useDashboard';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import { createAsset, deleteAsset, hasTransactionsForAccount } from '../../../services/finance.service';
import type { AssetCategory, AssetItem } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'AssetsDetail'>;

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  cash:        'Banks',
  investment:  'Investments',
  real_estate: 'Real Estate',
  vehicle:     'Vehicles',
  other:       'Other Assets',
};

const CATEGORY_ORDER: AssetCategory[] = ['cash', 'investment', 'real_estate', 'vehicle', 'other'];

// ─── AccountFormModal ─────────────────────────────────────────────────────────

function AccountFormModal({
  visible,
  onSave,
  onClose,
}: {
  visible: boolean;
  onSave:  (name: string, balance: number) => Promise<void>;
  onClose: () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();

  const [name,    setName]    = useState('');
  const [balance, setBalance] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) {
      setName(''); setBalance(''); setError(null); setSaving(false);
    }
  }, [visible]);

  const parsed  = parseFloat(balance.replace(/[^0-9.]/g, '')) || 0;
  const canSave = name.trim().length > 0 && parsed > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), parsed);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: borderRadius.cardLg, borderTopRightRadius: borderRadius.cardLg }}
          contentContainerStyle={{ padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }}
        >
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Add Bank Account
          </Text>

          <Text style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: '600', color: colors.text.muted }}>NAME</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. BDO Savings Account"
              placeholderTextColor={colors.text.muted}
              returnKeyType="next"
              autoFocus
              style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
            />
          </View>

          <Text style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8, fontWeight: '600', color: colors.text.muted }}>CURRENT BALANCE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: parsed > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }}>
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
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
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
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: canSave && !saving ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: canSave && !saving ? '#FFFFFF' : colors.text.muted }}>
                {saving ? 'Saving…' : 'Add Account'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── AssetsDetailScreen ───────────────────────────────────────────────────────

export function AssetsDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useAssets();
  const { data: savingsGoals = [] }  = useSavingsGoals();

  const [formVisible, setFormVisible] = useState(false);
  const [mutating,    setMutating]    = useState(false);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const totalAssets = useMemo(
    () => (assets ?? []).reduce((s, a) => s + a.balance, 0),
    [assets],
  );

  const savingsGoalsTotal = useMemo(
    () => savingsGoals.reduce((s, g) => s + g.savedAmount, 0),
    [savingsGoals],
  );

  const grouped = useMemo(() => {
    const map: Partial<Record<AssetCategory, AssetItem[]>> = {};
    for (const a of assets ?? []) {
      if (a.id === 'savings_goals_total') continue;
      if (!map[a.category]) map[a.category] = [];
      map[a.category]!.push(a);
    }
    return CATEGORY_ORDER.filter(c => !!map[c]).map(c => ({ category: c, items: map[c]! }));
  }, [assets]);

  async function handleAdd(name: string, balance: number) {
    await createAsset({ name, category: 'cash', balance });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
      queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleLongPress(item: AssetItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    Alert.alert('Remove Account', `Remove "${item.name}" from your accounts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setMutating(true);
          try {
            await deleteAsset(item.id);
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
              queryClient.invalidateQueries({ queryKey: DEBTS_KEY }),
              queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
            ]);
          } catch {
            Alert.alert('Error', 'Failed to remove account. Please try again.');
          } finally {
            setMutating(false);
          }
        },
      },
    ]);
  }

  function navigateToTransactions(item: AssetItem) {
    const iconMap: Record<string, string> = {
      cash: '🏦', investment: '📈', real_estate: '🏠', vehicle: '🚗', other: '💰',
    };
    navigation.push('AccountTransactions', {
      accountId:       item.id,
      accountName:     item.name,
      accountBalance:  item.balance,
      isDebt:          false,
      accountIcon:     item.icon ?? iconMap[item.category] ?? '💰',
      accountCategory: item.category,
    });
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Assets</Text>
        <Pressable onPress={() => setFormVisible(true)} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>+ Add</Text>
        </Pressable>
      </View>

      {isLoading || mutating ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

          {/* ── Hero ── */}
          <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
              Total Assets
            </Text>
            <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
              {fmt(totalAssets)}
            </Text>
          </View>

          {/* ── Empty state ── */}
          {(assets ?? []).length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: spacing[8], paddingHorizontal: spacing[6] }}>
              <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>🏦</Text>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[2], textAlign: 'center' }}>
                No assets yet
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
                {'Tap "+ Add" to add your first bank account.'}
              </Text>
            </View>
          )}

          {/* ── Category sections ── */}
          {grouped.map(({ category, items }) => {
            const subtotal = items.reduce((s, a) => s + a.balance, 0);
            return (
              <View key={category} style={{ marginBottom: spacing[5] }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginBottom: spacing[2] }}>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {CATEGORY_LABELS[category]}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
                    {fmtShort(subtotal)}
                  </Text>
                </View>

                <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
                  {items.map((item, idx) => (
                    <Pressable
                      key={item.id}
                      onPress={() => navigateToTransactions(item)}
                      onLongPress={() => handleLongPress(item)}
                      delayLongPress={400}
                      style={({ pressed }) => [
                        s.itemRow,
                        {
                          paddingHorizontal: spacing[4],
                          paddingVertical:   spacing[4],
                          borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: colors.border.subtle,
                          backgroundColor:   pressed ? colors.bg.surfaceMuted : colors.bg.surface,
                        },
                      ]}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: item.color + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{item.name}</Text>
                        {item.note && (
                          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>{item.note}</Text>
                        )}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: item.color }}>
                          {fmtShort(item.balance)}
                        </Text>
                        <Text style={{ fontSize: 14, color: colors.text.muted }}>›</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}

          {/* ── Savings Goals section ── */}
          <View style={{ marginBottom: spacing[5] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginBottom: spacing[2] }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Saving Goals
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
                {fmtShort(savingsGoalsTotal)}
              </Text>
            </View>

            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
              {savingsGoals.length === 0 ? (
                <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[4] }}>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                    No savings goals yet
                  </Text>
                </View>
              ) : savingsGoals.map((goal, idx) => (
                <View
                  key={goal.id}
                  style={[
                    s.itemRow,
                    {
                      paddingHorizontal: spacing[4],
                      paddingVertical:   spacing[4],
                      borderBottomWidth: idx < savingsGoals.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border.subtle,
                    },
                  ]}
                >
                  <View style={{ width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: (goal.color ?? '#22C55E') + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                    <Text style={{ fontSize: 18 }}>{goal.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{goal.name}</Text>
                  </View>
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: goal.color ?? '#22C55E' }}>
                    {fmtShort(goal.savedAmount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Asset mix ── */}
          {(assets ?? []).length > 0 && (
            <View style={{ paddingHorizontal: spacing[5] }}>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>Asset Mix</Text>
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingHorizontal: spacing[4] }]}>
                {[
                  ...grouped.map(({ category, items }) => ({
                    key:   category,
                    label: CATEGORY_LABELS[category],
                    sub:   items.reduce((sum, a) => sum + a.balance, 0),
                    color: items[0]?.color ?? colors.accent.primary,
                  })),
                  ...(savingsGoalsTotal > 0 ? [{
                    key:   'savings_goals',
                    label: 'Saving Goals',
                    sub:   savingsGoalsTotal,
                    color: '#22C55E',
                  }] : []),
                ].map(({ key, label, sub, color }, i, arr) => {
                  const pct = totalAssets > 0 ? (sub / totalAssets) * 100 : 0;
                  return (
                    <View
                      key={key}
                      style={{
                        paddingVertical:   spacing[3],
                        borderBottomWidth: i < arr.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border.subtle,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: spacing[2] }} />
                        <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary }}>
                          {label}
                        </Text>
                        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                          {pct.toFixed(1)}%
                        </Text>
                      </View>
                      <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 99 }} />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[5], paddingHorizontal: spacing[5] }}>
            Tap any account to view transactions · Long-press to delete
          </Text>
        </ScrollView>
      )}

      <AccountFormModal
        visible={formVisible}
        onSave={handleAdd}
        onClose={() => setFormVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
});

export default AssetsDetailScreen;
