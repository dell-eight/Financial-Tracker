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
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useInvestments, HOLDINGS_KEY } from '../../../hooks/queries/useInvestments';
import { logTrade } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import type { InvestmentHolding } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'LogTransaction'>;

type TxType = 'buy' | 'sell';

// ─── LogTransactionScreen ─────────────────────────────────────────────────────

export function LogTransactionScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const queryClient  = useQueryClient();
  const { symbol, fmt } = useCurrency();
  const { holdingId } = route.params;

  const [txType,    setTxType]    = useState<TxType>('buy');
  const [sharesStr, setSharesStr] = useState('');
  const [priceStr,  setPriceStr]  = useState('');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const { data: holdings } = useInvestments();
  const holding = useMemo<InvestmentHolding | undefined>(
    () => holdings?.find(h => h.id === holdingId),
    [holdings, holdingId],
  );

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;
  const H_PAD  = spacing[5];

  const shares      = parseFloat(sharesStr) || 0;
  const price       = parseFloat(priceStr)  || 0;
  const totalTrade  = shares * price;

  const maxSell = holding?.shares ?? 0;
  const canSave = shares > 0 && price > 0 && (txType === 'buy' || shares <= maxSell);
  const sellWarn = txType === 'sell' && shares > maxSell && maxSell > 0;

  function handleAmountChange(setter: (v: string) => void) {
    return (v: string) => {
      const c = v.replace(/[^0-9.]/g, '');
      if (c.split('.').length <= 2) setter(c);
    };
  }

  async function handleSave() {
    if (!canSave || !holding || saving) return;
    setSaving(true);
    setError(null);
    try {
      await logTrade({
        holdingId:      holdingId,
        accountId:      holding.accountId,
        symbol:         holding.symbol,
        txType,
        shares,
        price,
        currentShares:  holding.shares,
        currentAvgCost: holding.avgCostPerShare,
      });
      await queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to log trade. Please try again.');
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
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Log Trade</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: btmPad + spacing[4] }}
      >
        {/* ── Holding context ── */}
        {holding && (
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: H_PAD, padding: spacing[4], marginBottom: spacing[5] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <View style={{ backgroundColor: holding.color + '20', borderRadius: borderRadius.lg, paddingHorizontal: spacing[3], paddingVertical: spacing[2] }}>
                <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: holding.color, letterSpacing: 1 }}>{holding.symbol}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>{holding.name}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                  {holding.shares.toLocaleString('en-PH')} shares · {fmt(holding.currentPrice)}/share
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Buy / Sell toggle ── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <View style={[styles.toggle, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3 }]}>
            {(['buy', 'sell'] as TxType[]).map(t => {
              const active = txType === t;
              const activeColor = t === 'buy' ? colors.income : colors.expense;
              return (
                <Pressable
                  key={t}
                  onPress={() => { Haptics.selectionAsync(); setTxType(t); }}
                  style={[styles.toggleBtn, { flex: 1, height: 40, borderRadius: borderRadius.full, backgroundColor: active ? activeColor : 'transparent' }]}
                >
                  <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: active ? '#FFFFFF' : colors.text.muted, textTransform: 'capitalize' }}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Shares ── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[4] }}>
          <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>SHARES</Text>
          {sellWarn && (
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, marginBottom: spacing[2] }}>
              Max sell: {maxSell.toLocaleString('en-PH')} shares
            </Text>
          )}
          <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: sellWarn ? colors.expense : shares > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50 }]}>
            <TextInput
              value={sharesStr}
              onChangeText={handleAmountChange(setSharesStr)}
              placeholder="0"
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              autoFocus
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
            />
          </View>
        </View>

        {/* ── Price per share ── */}
        <View style={{ paddingHorizontal: H_PAD, marginBottom: spacing[5] }}>
          <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[2] }]}>PRICE PER SHARE</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.input, borderWidth: 1, borderColor: price > 0 ? colors.accent.primary : colors.border.subtle, paddingHorizontal: spacing[4], height: 50 }]}>
            <Text style={{ fontSize: fontSize.headingMd, color: colors.text.muted, marginRight: 4 }}>{symbol}</Text>
            <TextInput
              value={priceStr}
              onChangeText={handleAmountChange(setPriceStr)}
              placeholder={holding ? String(holding.currentPrice) : '0'}
              placeholderTextColor={colors.text.muted}
              keyboardType="decimal-pad"
              style={{ flex: 1, fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, padding: 0 }}
            />
          </View>
        </View>

        {/* ── Trade summary ── */}
        {canSave && (
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: H_PAD, padding: spacing[4], marginBottom: spacing[5] }]}>
            <Text style={[styles.label, { color: colors.text.muted, marginBottom: spacing[3] }]}>TRADE SUMMARY</Text>
            <View style={[styles.summaryRow, { marginBottom: spacing[2] }]}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>
                {txType === 'buy' ? 'Buying' : 'Selling'}
              </Text>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                {shares} shares @ {fmt(price)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.muted }}>Total</Text>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: txType === 'buy' ? colors.expense : colors.income }}>
                {txType === 'buy' ? '-' : '+'}{fmt(totalTrade)}
              </Text>
            </View>
            {txType === 'buy' && holding && (
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }}>
                New position: {(holding.shares + shares).toLocaleString('en-PH')} shares
              </Text>
            )}
          </View>
        )}

        {/* ── Error ── */}
        {error && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.expense, textAlign: 'center', marginHorizontal: H_PAD, marginBottom: spacing[3] }}>
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
              marginHorizontal: H_PAD,
              backgroundColor: (!canSave || saving)
                ? colors.bg.surfaceMuted
                : txType === 'buy'
                  ? pressed ? colors.income + 'cc' : colors.income
                  : pressed ? colors.expense + 'cc' : colors.expense,
              borderRadius: borderRadius.button,
              height: 52,
            },
          ]}
        >
          <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: (canSave && !saving) ? '#FFFFFF' : colors.text.muted }}>
            {saving ? 'Saving…' : `Confirm ${txType === 'buy' ? 'Buy' : 'Sell'}`}
          </Text>
        </Pressable>
      </ScrollView>
      <LoadingOverlay visible={saving} message="Saving…" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label:      { fontSize: 11, fontFamily: 'System', fontWeight: '600', letterSpacing: 1 },
  inputRow:   { flexDirection: 'row', alignItems: 'center' },
  toggle:     { flexDirection: 'row' },
  toggleBtn:  { alignItems: 'center', justifyContent: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saveBtn:    { alignItems: 'center', justifyContent: 'center' },
});

export default LogTransactionScreen;
