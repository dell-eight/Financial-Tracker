import React, { useState } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { HOLDINGS_KEY } from '../../../hooks/queries/useInvestments';
import { addHolding } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import { useCurrency } from '../../../utils/currency';
import type { AssetType } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'AddHolding'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const ASSET_TYPES: { key: AssetType; label: string; icon: string }[] = [
  { key: 'stock',  label: 'Stock',       icon: '📈' },
  { key: 'etf',    label: 'ETF',         icon: '🏦' },
  { key: 'fund',   label: 'Mutual Fund', icon: '📊' },
  { key: 'bond',   label: 'Bond',        icon: '📋' },
  { key: 'crypto', label: 'Crypto',      icon: '🪙' },
];

const HOLDING_COLORS = ['#755DEF', '#22C55E', '#F97316', '#3B82F6', '#EC4899', '#14B8A6'];

// ─── AddHoldingScreen ─────────────────────────────────────────────────────────

export function AddHoldingScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient = useQueryClient();
  const { symbol: currencySymbol } = useCurrency();

  const [symbol,    setSymbol]    = useState('');
  const [name,      setName]      = useState('');
  const [sharesStr, setSharesStr] = useState('');
  const [costStr,   setCostStr]   = useState('');
  const [priceStr,  setPriceStr]  = useState('');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [color,     setColor]     = useState(HOLDING_COLORS[0]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const H_PAD  = spacing[5];

  const shares   = parseFloat(sharesStr) || 0;
  const cost     = parseFloat(costStr)   || 0;
  const price    = parseFloat(priceStr)  || cost; // default current price = cost
  const canSave  = symbol.trim().length > 0 && name.trim().length > 0 && shares > 0 && cost > 0;

  const marketValue  = shares * price;
  const totalCost    = shares * cost;
  const pnl          = marketValue - totalCost;
  const pnlPct       = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

  function handleAmountChange(setter: (v: string) => void) {
    return (v: string) => {
      const c = v.replace(/[^0-9.]/g, '');
      if (c.split('.').length <= 2) setter(c);
    };
  }

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      const newHolding = await addHolding({
        symbol:          symbol.trim().toUpperCase(),
        name:            name.trim(),
        assetType,
        shares,
        avgCostPerShare: cost,
        currentPrice:    price || cost,
      });
      await queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.replace('HoldingDetail', { holdingId: newHolding.id });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add holding. Please try again.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.screen, { backgroundColor: colors.bg.base }]}
    >
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: H_PAD, paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Add Holding</Text>
        <Pressable onPress={handleSave} disabled={!canSave || saving} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? colors.accent.primary : colors.text.muted }}>{saving ? '…' : 'Save'}</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: H_PAD, paddingBottom: btmPad + spacing[6] }}
      >

        {/* ── Preview badge ── */}
        <View style={{ alignItems: 'center', marginVertical: spacing[5] }}>
          <View style={[styles.previewBadge, { backgroundColor: color + '20', borderRadius: borderRadius.lg, paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderWidth: 2, borderColor: color }]}>
            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color, letterSpacing: 1 }}>
              {symbol.trim().toUpperCase() || 'TICKER'}
            </Text>
          </View>
          {name.trim().length > 0 && (
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }} numberOfLines={1}>
              {name.trim()}
            </Text>
          )}
          {canSave && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: pnl >= 0 ? colors.income : colors.expense, marginTop: 4 }}>
              {pnl >= 0 ? '+' : ''}{pnl.toFixed(0)} ({pnl >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%) unrealised
            </Text>
          )}
        </View>

        {/* ── Symbol ── */}
        <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>TICKER SYMBOL</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: symbol ? color : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
          <TextInput
            value={symbol}
            onChangeText={v => setSymbol(v.replace(/[^A-Za-z.]/g, '').slice(0, 8))}
            placeholder="e.g. VTI"
            placeholderTextColor={colors.text.muted}
            autoCapitalize="characters"
            returnKeyType="next"
            style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color, padding: 0, letterSpacing: 1 }}
          />
        </View>

        {/* ── Name ── */}
        <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>FULL NAME</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: name ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[4] }]}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Vanguard Total Stock ETF"
            placeholderTextColor={colors.text.muted}
            returnKeyType="next"
            style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary, padding: 0 }}
          />
        </View>

        {/* ── Shares + Avg cost ── */}
        <View style={[styles.twoCol, { gap: spacing[3], marginBottom: spacing[4] }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>SHARES</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: shares > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[3], height: 50 }]}>
              <TextInput
                value={sharesStr}
                onChangeText={handleAmountChange(setSharesStr)}
                placeholder="0"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, padding: 0 }}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>AVG COST / SHARE</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: cost > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[3], height: 50 }]}>
              <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted, marginRight: 2 }}>{currencySymbol}</Text>
              <TextInput
                value={costStr}
                onChangeText={handleAmountChange(setCostStr)}
                placeholder="0"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
                style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, padding: 0 }}
              />
            </View>
          </View>
        </View>

        {/* ── Current price ── */}
        <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>CURRENT PRICE (optional)</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: price > 0 && price !== cost ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50, marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.bodyMd, color: colors.text.muted, marginRight: 2 }}>{currencySymbol}</Text>
          <TextInput
            value={priceStr}
            onChangeText={handleAmountChange(setPriceStr)}
            placeholder={costStr || '0'}
            placeholderTextColor={colors.text.muted}
            keyboardType="decimal-pad"
            style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary, padding: 0 }}
          />
        </View>

        {/* ── Asset type ── */}
        <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[3] }]}>ASSET TYPE</Text>
        <View style={[styles.typeRow, { gap: spacing[2], marginBottom: spacing[5] }]}>
          {ASSET_TYPES.map(t => {
            const active = assetType === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => { Haptics.selectionAsync(); setAssetType(t.key); }}
                style={[styles.typeChip, { backgroundColor: active ? color + '20' : colors.bg.surface, borderRadius: borderRadius.full, borderWidth: 1, borderColor: active ? color : colors.border.subtle, paddingHorizontal: spacing[3], paddingVertical: spacing[2] }]}
              >
                <Text style={{ fontSize: 12, marginRight: 4 }}>{t.icon}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: active ? fontFamily.semiBold : fontFamily.regular, color: active ? color : colors.text.secondary }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Color ── */}
        <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[3] }]}>COLOR</Text>
        <View style={[styles.colorRow, { marginBottom: spacing[6] }]}>
          {HOLDING_COLORS.map(c => (
            <Pressable
              key={c}
              onPress={() => { Haptics.selectionAsync(); setColor(c); }}
              style={[styles.colorDot, { backgroundColor: c, borderRadius: borderRadius.full, width: 32, height: 32, borderWidth: color === c ? 3 : 0, borderColor: '#FFFFFF', transform: [{ scale: color === c ? 1.15 : 1 }] }]}
            />
          ))}
        </View>

        {/* ── Error ── */}
        {error && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginBottom: spacing[3] }}>
            {error}
          </Text>
        )}

        {/* ── Save ── */}
        <Pressable
          onPress={handleSave}
          disabled={!canSave || saving}
          style={({ pressed }) => [
            styles.saveBtn,
            {
              backgroundColor: (!canSave || saving) ? colors.bg.surfaceMuted : pressed ? colors.accent.pressed : colors.accent.primary,
              borderRadius: borderRadius.button,
              height: 52,
            },
          ]}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {saving ? 'Saving…' : 'Add to Portfolio'}
          </Text>
        </Pressable>
      </ScrollView>
      <LoadingOverlay visible={saving} message="Adding holding…" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:       { fontSize: 11, fontFamily: 'System', fontWeight: '600', letterSpacing: 1 },
  inputRow:    { flexDirection: 'row', alignItems: 'center' },
  twoCol:      { flexDirection: 'row' },
  typeRow:     { flexDirection: 'row', flexWrap: 'wrap' },
  typeChip:    { flexDirection: 'row', alignItems: 'center' },
  colorRow:    { flexDirection: 'row', gap: 12 },
  colorDot:    {},
  previewBadge:{ alignItems: 'center' },
  saveBtn:     { alignItems: 'center', justifyContent: 'center' },
});

export default AddHoldingScreen;
