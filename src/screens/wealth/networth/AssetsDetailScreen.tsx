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
import { useAssets, ASSETS_KEY } from '../../../hooks/queries/useNetWorth';
import { DASHBOARD_KEY } from '../../../hooks/queries/useDashboard';
import { useSavingsGoals } from '../../../hooks/queries/useSavingsGoals';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import {
  createAsset,
  updateAssetBalance,
  deleteAsset,
} from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import type { AssetCategory, AssetItem } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'AssetsDetail'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  cash:        'Cash & Savings',
  investment:  'Investments',
  real_estate: 'Real Estate',
  vehicle:     'Vehicles',
  other:       'Other Assets',
};

const CATEGORY_ORDER: AssetCategory[] = ['cash', 'investment', 'real_estate', 'vehicle', 'other'];

type AddCategory = 'cash' | 'real_estate' | 'vehicle' | 'other';

const ADD_TYPES: { key: AddCategory; label: string; icon: string }[] = [
  { key: 'cash',        label: 'Cash / Bank',  icon: '💵' },
  { key: 'real_estate', label: 'Real Estate',  icon: '🏠' },
  { key: 'vehicle',     label: 'Vehicle',      icon: '🚗' },
  { key: 'other',       label: 'Other',        icon: '📦' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── AddAssetModal ────────────────────────────────────────────────────────────

function AddAssetModal({
  visible, onSave, onClose,
}: {
  visible: boolean;
  onSave:  (name: string, category: AddCategory, balance: number) => Promise<void>;
  onClose: () => void;
}) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();

  const [name,       setName]       = useState('');
  const [category,   setCategory]   = useState<AddCategory>('cash');
  const [balanceStr, setBalanceStr] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) { setName(''); setCategory('cash'); setBalanceStr(''); setError(null); setSaving(false); }
  }, [visible]);

  const balance  = parseFloat(balanceStr.replace(/[^0-9.]/g, '')) || 0;
  const canSave  = name.trim().length > 0 && balance > 0;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), category, balance);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add asset. Please try again.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <View style={[s.modalSheet, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Add Asset
          </Text>

          {/* Name */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>NAME</Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
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

          {/* Category */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>TYPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
            {ADD_TYPES.map(t => {
              const active = category === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => { Haptics.selectionAsync(); setCategory(t.key); }}
                  style={[{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 1, borderColor: active ? colors.accent.primary : colors.border.subtle, backgroundColor: active ? colors.accent.primary + '15' : colors.bg.base }]}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{t.icon}</Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? colors.accent.primary : colors.text.secondary }}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Balance */}
          <Text style={{ fontSize: 11, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, marginBottom: spacing[2] }}>CURRENT BALANCE</Text>
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: balance > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={balanceStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setBalanceStr(c);
              }}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
            />
          </View>

          {error && (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>{error}</Text>
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
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: (canSave && !saving) ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
                {saving ? 'Saving…' : 'Add Asset'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── EditBalanceModal ─────────────────────────────────────────────────────────

function EditBalanceModal({
  visible, asset, onSave, onClose,
}: {
  visible: boolean;
  asset: AssetItem | null;
  onSave: (id: string, newBalance: number) => Promise<void>;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const { symbol } = useCurrency();
  const [valueStr, setValueStr] = useState('');
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible && asset) { setValueStr(String(asset.balance)); setError(null); setSaving(false); }
  }, [visible, asset]);

  const parsed  = parseFloat(valueStr.replace(/[^0-9.]/g, '')) || 0;
  const canSave = parsed > 0;

  async function handleSave() {
    if (!canSave || !asset || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(asset.id, parsed);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to update balance.');
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.modalOverlay} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
        <View style={[s.modalSheet, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5], paddingBottom: Math.max(insets.bottom, spacing[5]) }]}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Edit Balance
          </Text>
          {asset && (
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginBottom: spacing[3] }}>
              {asset.icon} {asset.name}
            </Text>
          )}
          <View style={[s.inputRow, { backgroundColor: colors.bg.base, borderRadius: borderRadius.input, borderWidth: 1, borderColor: canSave ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 56, marginBottom: spacing[4] }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={valueStr}
              onChangeText={v => {
                const c = v.replace(/[^0-9.]/g, '');
                if (c.split('.').length <= 2) setValueStr(c);
              }}
              keyboardType="decimal-pad"
              autoFocus
              selectTextOnFocus
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
            />
          </View>
          {error && (
            <Text style={{ fontSize: fontSize.bodySm, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>{error}</Text>
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
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: (canSave && !saving) ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>
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
  const [editTarget,      setEditTarget]      = useState<AssetItem | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [mutating,        setMutating]        = useState(false);

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

  async function handleAddSave(name: string, category: AddCategory, balance: number) {
    setMutating(true);
    try {
      await createAsset({ name, category, balance });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setMutating(false);
    }
  }

  async function handleEditSave(id: string, newBalance: number) {
    setMutating(true);
    try {
      await updateAssetBalance(id, newBalance);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ASSETS_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setMutating(false);
    }
  }

  function handleDelete(item: AssetItem) {
    if (item.id === 'investment_portfolio') {
      Alert.alert('Cannot Delete', 'Investment Portfolio is derived from your holdings. Remove holdings instead.');
      return;
    }
    Alert.alert('Remove Asset', `Remove "${item.name}" from your assets?`, [
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
              queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY }),
            ]);
          } catch {
            Alert.alert('Error', 'Failed to remove asset. Please try again.');
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
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Assets</Text>
        <Pressable onPress={() => setAddModalVisible(true)} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ── */}
        <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Total Assets
          </Text>
          <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
            {fmt(totalAssets)}
          </Text>
          {totalAssets === 0 && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 4 }}>
              Tap "+ Add" to record your first asset
            </Text>
          )}
        </View>

        {/* ── Empty state ── */}
        {!isLoading && (assets ?? []).length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8], paddingHorizontal: spacing[6] }}>
            <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>🏦</Text>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[2], textAlign: 'center' }}>
              No assets yet
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginBottom: spacing[5] }}>
              Add your bank accounts, property, vehicles, and other assets to track your net worth.
            </Text>
            <Pressable
              onPress={() => setAddModalVisible(true)}
              style={({ pressed }) => [{ backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, borderRadius: borderRadius.button, paddingHorizontal: spacing[6], height: 48, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add Your First Asset</Text>
            </Pressable>
          </View>
        )}

        {/* ── Category sections ── */}
        {isLoading ? (
          <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
          </View>
        ) : grouped.map(({ category, items }) => {
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
                    onPress={() => {
                      if (item.id === 'investment_portfolio') return;
                      Haptics.selectionAsync();
                      setEditTarget(item);
                    }}
                    onLongPress={() => handleDelete(item)}
                    style={({ pressed }) => [
                      s.itemRow,
                      {
                        paddingHorizontal: spacing[4],
                        paddingVertical:   spacing[4],
                        borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border.subtle,
                        opacity:           pressed ? 0.75 : 1,
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
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: item.color }}>
                        {fmtShort(item.balance)}
                      </Text>
                      {item.id !== 'investment_portfolio' && (
                        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                          Tap to edit
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Saving Goals section ── */}
        {!isLoading && (
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
        )}

        {/* ── Asset mix ── */}
        {(assets ?? []).length > 0 && (
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>Asset Mix</Text>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingHorizontal: spacing[4] }]}>
              {[
                ...grouped.map(({ category, items }) => ({
                  key:   category,
                  label: CATEGORY_LABELS[category],
                  sub:   items.reduce((s, a) => s + a.balance, 0),
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

        {/* ── Hint ── */}
        {(assets ?? []).length > 0 && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[5], paddingHorizontal: spacing[5] }}>
            Tap any asset to edit its balance · Long-press to remove · Savings goals are managed from the Goals screen
          </Text>
        )}
      </ScrollView>

      <AddAssetModal
        visible={addModalVisible}
        onSave={handleAddSave}
        onClose={() => setAddModalVisible(false)}
      />

      <EditBalanceModal
        visible={editTarget !== null}
        asset={editTarget}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen:         { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRow:        { flexDirection: 'row', alignItems: 'center' },
  inputRow:       { flexDirection: 'row', alignItems: 'center' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet:     {},
});

export default AssetsDetailScreen;
