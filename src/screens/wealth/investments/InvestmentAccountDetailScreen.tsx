import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useInvestments } from '../../../hooks/queries/useInvestments';
import type { WealthStackParamList } from '../../../navigation/types';
import { formatFull, formatCompact } from '../../../utils/currency';
import { useAppStore } from '../../../store/app.store';
import type { InvestmentHolding } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'InvestmentAccountDetail'>;

function fmt(n: number): string      { return formatFull(n,    useAppStore.getState().currency); }
function fmtShort(n: number): string { return formatCompact(n, useAppStore.getState().currency); }

// ─── InvestmentAccountDetailScreen ───────────────────────────────────────────

export function InvestmentAccountDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { accountId } = route.params;

  const { data: allHoldings } = useInvestments();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  // Filter to this account (fall back to all if 'default')
  const holdings = useMemo<InvestmentHolding[]>(
    () => (allHoldings ?? []).filter(h => accountId === 'default' || h.accountId === accountId),
    [allHoldings, accountId],
  );

  const totalValue    = useMemo(() => holdings.reduce((s, h) => s + h.shares * h.currentPrice,    0), [holdings]);
  const totalCost     = useMemo(() => holdings.reduce((s, h) => s + h.shares * h.avgCostPerShare, 0), [holdings]);
  const totalPnl      = totalValue - totalCost;
  const totalPnlPct   = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPositive    = totalPnl >= 0;
  const pnlColor      = isPositive ? colors.income : colors.expense;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style="light" />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Investment Account
        </Text>
        <Pressable onPress={() => navigation.push('AddHolding', { accountId })} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>+ Add</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Account hero ── */}
        <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, marginHorizontal: spacing[5], padding: spacing[5], marginBottom: spacing[5] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
            Portfolio Value
          </Text>
          <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
            {fmtShort(totalValue)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 4 }}>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: pnlColor }}>
              {isPositive ? '+' : ''}{fmt(totalPnl)}
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: pnlColor }}>
              ({isPositive ? '+' : ''}{totalPnlPct.toFixed(2)}%) total return
            </Text>
          </View>

          {/* Two-stat row */}
          <View style={{ flexDirection: 'row', gap: spacing[4], marginTop: spacing[4] }}>
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Cost Basis</Text>
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }}>{fmtShort(totalCost)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border.subtle }} />
            <View>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Holdings</Text>
              <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: 2 }}>{holdings.length}</Text>
            </View>
          </View>
        </View>

        {/* ── Holdings list ── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>Holdings</Text>
        </View>

        {holdings.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8] }}>
            <Text style={{ fontSize: 36 }}>📊</Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[3] }}>
              No holdings yet
            </Text>
            <Pressable
              onPress={() => navigation.push('AddHolding', { accountId })}
              style={({ pressed }) => [{ backgroundColor: colors.accent.primary, borderRadius: borderRadius.button, paddingHorizontal: spacing[5], paddingVertical: spacing[3], marginTop: spacing[4], opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Add First Holding</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
            {holdings.map((h, i) => {
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
                    styles.holdingRow,
                    {
                      paddingHorizontal: spacing[4],
                      paddingVertical:   spacing[4],
                      borderBottomWidth: i < holdings.length - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border.subtle,
                      opacity:           pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  {/* Symbol badge */}
                  <View style={{ backgroundColor: h.color + '20', borderRadius: borderRadius.md, paddingHorizontal: spacing[2], paddingVertical: 4, minWidth: 52, alignItems: 'center', marginRight: spacing[3] }}>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.bold, color: h.color, letterSpacing: 0.5 }}>{h.symbol}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }} numberOfLines={1}>{h.name}</Text>
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                      {h.shares.toLocaleString('en-PH')} shares
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
            })}
          </View>
        )}

        {/* ── Quick actions ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[3], marginTop: spacing[5] }}>
          <Pressable
            onPress={() => navigation.push('AddHolding', { accountId })}
            style={({ pressed }) => [{ flex: 1, height: 44, backgroundColor: colors.accent.primary, borderRadius: borderRadius.button, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add Holding</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.push('Allocation')}
            style={({ pressed }) => [{ flex: 1, height: 44, backgroundColor: colors.bg.surface, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Allocation</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:     { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  holdingRow: { flexDirection: 'row', alignItems: 'center' },
});

export default InvestmentAccountDetailScreen;
