import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useInvestments } from '../../../hooks/queries/useInvestments';
import { useOtherAssets, useAddOtherAsset, useUpdateOtherAsset, useDeleteOtherAsset } from '../../../hooks/queries/useOtherAssets';
import { QueryError } from '../../../components/common/QueryError';
import type { OtherAsset } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import { LOCALE } from '../../../utils/dateFormat';

type Navigation = StackScreenProps<WealthStackParamList, 'WealthMain'>['navigation'];

// ── Other Assets ──────────────────────────────────────────────────────────────

const OTHER_ASSET_CATEGORIES = [
  { key: 'real_estate',   label: 'Real Estate',  icon: '🏠' },
  { key: 'vehicle',       label: 'Vehicle',       icon: '🚗' },
  { key: 'fixed_deposit', label: 'Fixed Deposit', icon: '🏦' },
  { key: 'business',      label: 'Business',      icon: '💼' },
  { key: 'p2p',           label: 'P2P / Lending', icon: '🤝' },
  { key: 'collectibles',  label: 'Collectibles',  icon: '💎' },
  { key: 'other',         label: 'Other',         icon: '📦' },
] as const;

type OtherAssetCategory = typeof OTHER_ASSET_CATEGORIES[number]['key'];

function iconForCategory(cat: string): string {
  return OTHER_ASSET_CATEGORIES.find(c => c.key === cat)?.icon ?? '📦';
}

type OtherAssetFormState = {
  name: string;
  category: OtherAssetCategory;
  value: string;
  purchaseValue: string;
  purchaseDate: string;
  notes: string;
};

const BLANK_FORM: OtherAssetFormState = {
  name: '', category: 'other', value: '', purchaseValue: '', purchaseDate: '', notes: '',
};

function OtherAssetsSection() {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact } = useCurrency();

  const { data: assets, isLoading } = useOtherAssets();
  const addMutation    = useAddOtherAsset();
  const updateMutation = useUpdateOtherAsset();
  const deleteMutation = useDeleteOtherAsset();

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<OtherAsset | null>(null);
  const [form, setForm] = useState<OtherAssetFormState>(BLANK_FORM);

  const total = useMemo(() => (assets ?? []).reduce((s, a) => s + a.value, 0), [assets]);
  const count = (assets ?? []).length;

  const openAdd = useCallback(() => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setModalVisible(true);
  }, []);

  const openEdit = useCallback((asset: OtherAsset) => {
    setEditTarget(asset);
    setForm({
      name:          asset.name,
      category:      asset.category as OtherAssetCategory,
      value:         String(asset.value),
      purchaseValue: asset.purchaseValue != null ? String(asset.purchaseValue) : '',
      purchaseDate:  asset.purchaseDate ?? '',
      notes:         asset.notes ?? '',
    });
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    const name  = form.name.trim();
    const value = parseFloat(form.value);
    if (!name || isNaN(value) || value < 0) return;

    const params = {
      name,
      category:      form.category,
      value,
      purchaseValue: form.purchaseValue ? parseFloat(form.purchaseValue) : undefined,
      purchaseDate:  form.purchaseDate.trim() || undefined,
      notes:         form.notes.trim() || undefined,
    };

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...params });
    } else {
      addMutation.mutate(params);
    }
    setModalVisible(false);
  }, [form, editTarget, addMutation, updateMutation]);

  const handleMenuPress = useCallback((asset: OtherAsset) => {
    Alert.alert(asset.name, undefined, [
      { text: 'Edit',   onPress: () => openEdit(asset) },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => Alert.alert('Delete Asset', `Remove "${asset.name}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(asset.id) },
        ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [openEdit, deleteMutation]);

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Other Assets</Text>
          {!isLoading && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
              {count > 0 ? `${count} • ${fmtCompact(total)}` : '0 assets'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={openAdd}
          style={[otherStyles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={{ gap: spacing[2] }}>
          <View style={{ height: 64, borderRadius: borderRadius.card, backgroundColor: colors.bg.surface }} />
          <View style={{ height: 64, borderRadius: borderRadius.card, backgroundColor: colors.bg.surface }} />
        </View>
      ) : (assets ?? []).length === 0 ? (
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle }}>
          <Text style={{ fontSize: 36 }}>📦</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            No other assets yet
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
            Add real estate, vehicles, fixed deposits, and more.
          </Text>
        </View>
      ) : (
        (assets ?? []).map(asset => (
          <View
            key={asset.id}
            style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flexDirection: 'row', alignItems: 'center' }]}
          >
            <View style={{ width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
              <Text style={{ fontSize: 20 }}>{iconForCategory(asset.category)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>{asset.name}</Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2, textTransform: 'capitalize' }}>
                {OTHER_ASSET_CATEGORIES.find(c => c.key === asset.category)?.label ?? asset.category}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginRight: spacing[3] }}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                {fmt(asset.value)}
              </Text>
            </View>
            <Pressable onPress={() => handleMenuPress(asset)} hitSlop={8} style={{ padding: spacing[1] }}>
              <Text style={{ fontSize: 18, color: colors.text.muted }}>⋮</Text>
            </Pressable>
          </View>
        ))
      )}

      <Modal visible={modalVisible} animationType="slide" transparent presentationStyle="overFullScreen">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setModalVisible(false)} />
          <View style={{ backgroundColor: colors.bg.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing[5], gap: spacing[4] }}>
            <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
              {editTarget ? 'Edit Asset' : 'Add Other Asset'}
            </Text>
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[1] }}>Name</Text>
              <TextInput
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Condo Unit"
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.md, padding: spacing[3], fontSize: fontSize.bodyMd, color: colors.text.primary, fontFamily: fontFamily.regular }}
              />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[2] }}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2] }}>
                {OTHER_ASSET_CATEGORIES.map(cat => {
                  const active = form.category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => setForm(f => ({ ...f, category: cat.key }))}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: spacing[3], paddingVertical: spacing[2],
                        borderRadius: borderRadius.full,
                        backgroundColor: active ? colors.accent.primary : colors.bg.surfaceMuted,
                        borderWidth: 1,
                        borderColor: active ? colors.accent.primary : colors.border.subtle,
                      }}
                    >
                      <Text>{cat.icon}</Text>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: active ? '#FFFFFF' : colors.text.secondary }}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[1] }}>Current Value</Text>
              <TextInput
                value={form.value}
                onChangeText={v => setForm(f => ({ ...f, value: v }))}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.text.muted}
                style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.md, padding: spacing[3], fontSize: fontSize.bodyMd, color: colors.text.primary, fontFamily: fontFamily.regular }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[1] }}>Purchase Value (optional)</Text>
                <TextInput
                  value={form.purchaseValue}
                  onChangeText={v => setForm(f => ({ ...f, purchaseValue: v }))}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.text.muted}
                  style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.md, padding: spacing[3], fontSize: fontSize.bodyMd, color: colors.text.primary, fontFamily: fontFamily.regular }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[1] }}>Purchase Date (optional)</Text>
                <TextInput
                  value={form.purchaseDate}
                  onChangeText={v => setForm(f => ({ ...f, purchaseDate: v }))}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.muted}
                  style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.md, padding: spacing[3], fontSize: fontSize.bodyMd, color: colors.text.primary, fontFamily: fontFamily.regular }}
                />
              </View>
            </View>
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.muted, marginBottom: spacing[1] }}>Notes (optional)</Text>
              <TextInput
                value={form.notes}
                onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                placeholder="Any additional details"
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={2}
                style={{ backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.md, padding: spacing[3], fontSize: fontSize.bodyMd, color: colors.text.primary, fontFamily: fontFamily.regular, minHeight: 60, textAlignVertical: 'top' }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[3] }}>
              <Pressable
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, paddingVertical: spacing[3], borderRadius: borderRadius.button, backgroundColor: colors.bg.surfaceMuted, alignItems: 'center' }}
              >
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={{ flex: 1, paddingVertical: spacing[3], borderRadius: borderRadius.button, backgroundColor: colors.accent.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing[2], opacity: isSaving ? 0.7 : 1 }}
                accessibilityRole="button"
                accessibilityLabel={editTarget ? 'Save changes' : 'Add asset'}
                accessibilityState={{ disabled: isSaving }}
              >
                {isSaving && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>
                  {isSaving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Asset'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── InvestmentsTab ─────────────────────────────────────────────────────────────

export function InvestmentsTab({ navigation }: { navigation: Navigation }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: holdings, isLoading, isError: holdingsErr, refetch: refetchHoldings } = useInvestments();

  const sortedHoldings = useMemo(
    () => [...(holdings ?? [])].sort((a, b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice)),
    [holdings],
  );
  const totalValue  = useMemo(() => (holdings ?? []).reduce((s, h) => s + h.shares * h.currentPrice,    0), [holdings]);
  const totalCost   = useMemo(() => (holdings ?? []).reduce((s, h) => s + h.shares * h.avgCostPerShare, 0), [holdings]);
  const totalPnl    = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPositive  = totalPnl >= 0;

  const { fmt, fmtCompact: fmtShort } = useCurrency();

  if (holdingsErr) {
    return <QueryError onRetry={refetchHoldings} />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Portfolio hero ── */}
      <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Portfolio Value
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          {fmtShort(totalValue)}
        </Text>
        {totalCost > 0 && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: isPositive ? colors.income : colors.expense, marginTop: spacing[1] }}>
            {isPositive ? '+' : ''}{fmt(totalPnl)} ({isPositive ? '+' : ''}{totalPnlPct.toFixed(1)}%) total return
          </Text>
        )}
        <Pressable
          onPress={() => navigation.push('Allocation')}
          style={({ pressed }) => ({ marginTop: spacing[3], alignSelf: 'flex-start', backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: 5, opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.accent.primary, letterSpacing: 0.5 }}>VIEW ALLOCATION →</Text>
        </Pressable>
      </View>

      {/* ── Holdings header ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Holdings</Text>
          {!isLoading && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
              {(holdings ?? []).length} {(holdings ?? []).length === 1 ? 'position' : 'positions'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => navigation.push('AddHolding', { accountId: 'inv1' })}
          style={[otherStyles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add</Text>
        </Pressable>
      </View>

      {/* ── Holdings list ── */}
      {isLoading ? (
        <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (holdings ?? []).length === 0 ? (
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle }}>
          <Text style={{ fontSize: 36 }}>📈</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            No holdings yet
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
            Add your first holding to start tracking your investment portfolio.
          </Text>
          <Pressable
            onPress={() => navigation.push('AddHolding', { accountId: 'inv1' })}
            style={{ backgroundColor: colors.accent.primary, borderRadius: borderRadius.button, paddingHorizontal: spacing[5], paddingVertical: spacing[3], marginTop: spacing[4] }}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Add Holding</Text>
          </Pressable>
        </View>
      ) : (
        sortedHoldings.map(h => {
          const value    = h.shares * h.currentPrice;
          const cost     = h.shares * h.avgCostPerShare;
          const pnl      = value - cost;
          const pnlPct   = cost > 0 ? (pnl / cost) * 100 : 0;
          const positive = pnl >= 0;
          return (
            <Pressable
              key={h.id}
              onPress={() => navigation.push('HoldingDetail', { holdingId: h.id })}
              style={({ pressed }) => [
                shadows.card,
                { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <View style={{ backgroundColor: h.color + '20', borderRadius: borderRadius.md, paddingHorizontal: spacing[2], paddingVertical: 5, minWidth: 56, alignItems: 'center', marginRight: spacing[3] }}>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.bold, color: h.color, letterSpacing: 0.5 }}>{h.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>{h.name}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                  {h.shares.toLocaleString(LOCALE)} shares
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                  {fmtShort(value)}
                </Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: positive ? colors.income : colors.expense, marginTop: 2 }}>
                  {positive ? '+' : ''}{pnlPct.toFixed(1)}%
                </Text>
              </View>
            </Pressable>
          );
        })
      )}

      {/* ── Other Assets ── */}
      <OtherAssetsSection />
    </ScrollView>
  );
}

const otherStyles = StyleSheet.create({
  addBtn: { paddingHorizontal: 14, paddingVertical: 8 },
});
