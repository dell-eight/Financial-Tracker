import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useInvestments, HOLDINGS_KEY } from '../../../hooks/queries/useInvestments';
import { deleteHolding } from '../../../services/finance.service';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import { LoadingOverlay } from '../../../components/common/LoadingOverlay';
import type { InvestmentHolding } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'HoldingDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Generate deterministic 7-day price bars relative to currentPrice
function generatePriceBars(currentPrice: number): number[] {
  const seed = [0.97, 0.985, 0.978, 0.991, 0.996, 0.999, 1.0];
  return seed.map(f => currentPrice * f);
}

// ─── PriceChart ───────────────────────────────────────────────────────────────

function PriceChart({ prices, color }: { prices: number[]; color: string }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  const max   = Math.max(...prices);
  const min   = Math.min(...prices);
  const range = max - min || 1;
  const days  = ['M', 'T', 'W', 'T', 'F', 'S', 'T'];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {prices.map((p, i) => {
        const heightPct = ((p - min) / range) * 0.7 + 0.15;
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%' }}>
              <View style={{ height: `${heightPct * 100}%`, backgroundColor: i === prices.length - 1 ? color : color + '60', borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 9, fontFamily: fontFamily.regular, color: colors.text.muted }}>{days[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── StatRow ─────────────────────────────────────────────────────────────────

function StatRow({ label, value, valueColor, isLast }: { label: string; value: string; valueColor?: string; isLast?: boolean }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing[3], borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted }}>{label}</Text>
      <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: valueColor ?? colors.text.primary }}>{value}</Text>
    </View>
  );
}

// ─── HoldingDetailScreen ──────────────────────────────────────────────────────

export function HoldingDetailScreen({ navigation, route }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt } = useCurrency();
  const queryClient = useQueryClient();
  const { holdingId } = route.params;
  const [deleting, setDeleting] = useState(false);

  const { data: holdings } = useInvestments();
  const holding = useMemo<InvestmentHolding | undefined>(
    () => holdings?.find(h => h.id === holdingId),
    [holdings, holdingId],
  );

  // Must be declared before any early return to respect hooks order
  const priceBars = useMemo(
    () => holding ? generatePriceBars(holding.currentPrice) : [],
    [holding],
  );

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  if (!holding) {
    return (
      <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
        <StatusBar style={theme.statusBarStyle} />
        <View style={{ paddingTop: topPad + spacing[2], paddingHorizontal: spacing[5] }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
          </Pressable>
        </View>
        <View style={s.centered}>
          <Text style={{ fontSize: 40 }}>🔍</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>Holding not found</Text>
        </View>
      </View>
    );
  }

  const marketValue = holding.shares * holding.currentPrice;
  const totalCost   = holding.shares * holding.avgCostPerShare;
  const pnl         = marketValue - totalCost;
  const pnlPct      = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
  const isPositive  = pnl >= 0;
  const pnlColor    = isPositive ? colors.income : colors.expense;

  const TYPE_LABELS: Record<string, string> = { stock: 'Stock', etf: 'ETF', fund: 'Mutual Fund', bond: 'Bond', crypto: 'Crypto' };

  function handleDelete() {
    if (!holding) return;
    const sym = holding.symbol;
    Alert.alert('Remove Holding', `Remove ${sym} from your portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setDeleting(true);
          try {
            await deleteHolding(holdingId);
            await queryClient.invalidateQueries({ queryKey: HOLDINGS_KEY });
          } catch {
            // still navigate back even if delete fails
          } finally {
            setDeleting(false);
          }
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          {holding.symbol}
        </Text>
        <Pressable onPress={handleDelete} hitSlop={12} style={{ minWidth: 60, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.expense }}>Remove</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[6] }}>

        {/* ── Hero ── */}
        <View style={[s.hero, { paddingVertical: spacing[5], paddingHorizontal: spacing[5] }]}>
          <View style={[s.symbolBadge, { backgroundColor: holding.color + '20', borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[2] }]}>
            <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: holding.color, letterSpacing: 1 }}>
              {holding.symbol}
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2] }} numberOfLines={1}>
            {holding.name}
          </Text>
          <View style={[s.typeBadge, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], paddingVertical: 3, marginTop: spacing[1] }]}>
            <Text style={{ fontSize: 10, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5 }}>
              {TYPE_LABELS[holding.assetType] ?? holding.assetType.toUpperCase()}
            </Text>
          </View>

          {/* Current price + P&L */}
          <Text style={{ fontSize: 36, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.5, marginTop: spacing[4] }}>
            {fmt(holding.currentPrice)}
          </Text>
          <View style={[s.pnlRow, { marginTop: spacing[1] }]}>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: pnlColor }}>
              {isPositive ? '+' : ''}{fmt(pnl)}
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: pnlColor, marginLeft: spacing[2] }}>
              ({isPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* ── 7-day chart ── */}
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], padding: spacing[4], marginBottom: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, marginBottom: spacing[3] }}>7-DAY TREND</Text>
          <PriceChart prices={priceBars} color={holding.color} />
        </View>

        {/* ── Position stats ── */}
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], paddingHorizontal: spacing[4], marginBottom: spacing[4] }]}>
          <StatRow label="Shares held"      value={holding.shares.toLocaleString('en-PH')} />
          <StatRow label="Avg cost/share"   value={fmt(holding.avgCostPerShare)} />
          <StatRow label="Total cost basis" value={fmt(totalCost)} />
          <StatRow label="Market value"     value={fmt(marketValue)} valueColor={holding.color} />
          <StatRow label="Unrealised P&L"   value={`${isPositive ? '+' : ''}${fmt(pnl)}`} valueColor={pnlColor} />
          <StatRow label="Return"           value={`${isPositive ? '+' : ''}${pnlPct.toFixed(2)}%`} valueColor={pnlColor} isLast />
        </View>

        {/* ── CTAs ── */}
        <View style={[s.ctaRow, { paddingHorizontal: spacing[5], gap: spacing[3] }]}>
          <Pressable
            onPress={() => navigation.push('LogTransaction', { holdingId })}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: pressed ? colors.accent.pressed : colors.accent.primary, borderRadius: borderRadius.button, flex: 1, height: 48 },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Log Trade</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.push('Allocation')}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: colors.bg.surface, borderRadius: borderRadius.button, borderWidth: 1, borderColor: colors.border.subtle, flex: 1, height: 48, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.secondary }}>Allocation</Text>
          </Pressable>
        </View>
      </ScrollView>
      <LoadingOverlay visible={deleting} message="Removing holding…" />
    </View>
  );
}

const s = StyleSheet.create({
  screen:      { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hero:        { alignItems: 'center' },
  symbolBadge: {},
  typeBadge:   {},
  pnlRow:      { flexDirection: 'row', alignItems: 'center' },
  ctaRow:      { flexDirection: 'row' },
  ctaBtn:      { alignItems: 'center', justifyContent: 'center' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default HoldingDetailScreen;
