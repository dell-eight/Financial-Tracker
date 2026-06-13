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
import { useAssets, ASSETS_KEY } from '../../../hooks/queries/useNetWorth';
import type { WealthStackParamList } from '../../../navigation/types';
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

// 6-month mock growth multipliers (oldest → newest)
const MONTHLY_PCTS = [0.91, 0.94, 0.96, 0.97, 0.99, 1.0];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}k`;
  return `₱${Math.round(n)}`;
}

// ─── EditBalanceModal ─────────────────────────────────────────────────────────

function EditBalanceModal({
  visible, asset, onSave, onClose,
}: {
  visible: boolean;
  asset: AssetItem | null;
  onSave: (id: string, newBalance: number) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;
  const [valueStr, setValueStr] = useState('');
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    if (visible && asset) setValueStr(String(asset.balance));
  }, [visible, asset]);

  const parsed = parseFloat(valueStr.replace(/[^0-9.]/g, '')) || 0;
  const canSave = parsed > 0;

  function handleSave() {
    if (!canSave || !asset) return;
    onSave(asset.id, parsed);
    onClose();
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
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={({ pressed }) => [{ flex: 1, height: 48, borderRadius: borderRadius.button, backgroundColor: canSave ? (pressed ? colors.accent.pressed : colors.accent.primary) : colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: canSave ? '#FFFFFF' : colors.text.muted }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── SparkBar ─────────────────────────────────────────────────────────────────

function SparkBar({ pct, isLast, color }: { pct: number; isLast: boolean; color: string }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const idx    = MONTHLY_PCTS.indexOf(pct);
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
        <View style={{ height: `${pct * 85 + 10}%`, backgroundColor: isLast ? color : color + '55', borderRadius: 4 }} />
      </View>
      <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.text.muted }}>{months[idx] ?? ''}</Text>
    </View>
  );
}

// ─── AssetsDetailScreen ───────────────────────────────────────────────────────

export function AssetsDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useAssets();
  const [editTarget, setEditTarget] = useState<AssetItem | null>(null);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const totalAssets = useMemo(
    () => (assets ?? []).reduce((s, a) => s + a.balance, 0),
    [assets],
  );

  // Group by category in defined order
  const grouped = useMemo(() => {
    const map: Partial<Record<AssetCategory, AssetItem[]>> = {};
    for (const a of assets ?? []) {
      if (!map[a.category]) map[a.category] = [];
      map[a.category]!.push(a);
    }
    return CATEGORY_ORDER.filter(c => !!map[c]).map(c => ({ category: c, items: map[c]! }));
  }, [assets]);

  function handleEditSave(id: string, newBalance: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    queryClient.setQueryData(
      ASSETS_KEY,
      (old: AssetItem[] | undefined) => (old ?? []).map(a => a.id === id ? { ...a, balance: newBalance } : a),
    );
  }

  function handleDelete(item: AssetItem) {
    const itemName = item.name;
    Alert.alert('Remove Asset', `Remove "${itemName}" from your assets?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          queryClient.setQueryData(
            ASSETS_KEY,
            (old: AssetItem[] | undefined) => (old ?? []).filter(a => a.id !== item.id),
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
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Assets</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Hero ── */}
        <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Total Assets
          </Text>
          <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
            {fmtShort(totalAssets)}
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.income, marginTop: 4 }}>
            ↑ {fmtShort(totalAssets * 0.009)} (+0.9%) this month
          </Text>

          {/* 6-month sparkline */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 48, marginTop: spacing[4] }}>
            {MONTHLY_PCTS.map((pct, i) => (
              <SparkBar key={i} pct={pct} isLast={i === MONTHLY_PCTS.length - 1} color={colors.accent.primary} />
            ))}
          </View>
        </View>

        {/* ── Category sections ── */}
        {isLoading ? (
          <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>Loading assets…</Text>
          </View>
        ) : grouped.map(({ category, items }) => {
          const subtotal = items.reduce((s, a) => s + a.balance, 0);
          return (
            <View key={category} style={{ marginBottom: spacing[5] }}>
              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], marginBottom: spacing[2] }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {CATEGORY_LABELS[category]}
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
                  {fmtShort(subtotal)}
                </Text>
              </View>

              {/* Items */}
              <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
                {items.map((item, idx) => (
                  <Pressable
                    key={item.id}
                    onPress={() => { Haptics.selectionAsync(); setEditTarget(item); }}
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
                    {/* Icon */}
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
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                        Tap to edit
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Asset mix ── */}
        {(assets ?? []).length > 0 && (
          <View style={{ paddingHorizontal: spacing[5] }}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[3] }}>Asset Mix</Text>
            <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingHorizontal: spacing[4] }]}>
              {grouped.map(({ category, items }, i) => {
                const sub = items.reduce((s, a) => s + a.balance, 0);
                const pct = totalAssets > 0 ? (sub / totalAssets) * 100 : 0;
                // pick color from first item in category
                const color = items[0]?.color ?? colors.accent.primary;
                return (
                  <View
                    key={category}
                    style={{
                      paddingVertical:   spacing[3],
                      borderBottomWidth: i < grouped.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border.subtle,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: spacing[2] }} />
                      <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.primary }}>
                        {CATEGORY_LABELS[category]}
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
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[5], paddingHorizontal: spacing[5] }}>
          Tap any asset to edit its balance · Long-press to remove
        </Text>
      </ScrollView>

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
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRow:      { flexDirection: 'row', alignItems: 'center' },
  inputRow:     { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet:   {},
});

export default AssetsDetailScreen;
