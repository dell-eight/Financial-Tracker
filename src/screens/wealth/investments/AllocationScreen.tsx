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
import { useCurrency } from '../../../utils/currency';
import type { AssetType, InvestmentHolding } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'Allocation'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<AssetType, string> = {
  stock:  'Stocks',
  etf:    'ETFs',
  fund:   'Mutual Funds',
  bond:   'Bonds',
  crypto: 'Crypto',
};

const TYPE_COLORS: Record<AssetType, string> = {
  stock:  '#755DEF',
  etf:    '#22C55E',
  fund:   '#3B82F6',
  bond:   '#F97316',
  crypto: '#FBBF24',
};

// ─── DonutSegment (CSS-border approximation) ──────────────────────────────────

function DonutChart({ segments }: { segments: { pct: number; color: string }[] }) {
  const size   = 160;
  const stroke = 24;

  // Draw using stacked rotated border-top rings
  // Simplified: render as stacked arc-hint with sequential conic overlap
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track */}
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: '#2A2A40' }} />
      {/* Segments via rotation — one per type */}
      {segments.reduce<{ els: React.ReactNode[]; used: number }>((acc, seg, i) => {
        if (seg.pct <= 0) return acc;
        const startDeg = acc.used * 3.6; // pct → deg
        const spanDeg  = seg.pct * 3.6;
        const el = (
          <View
            key={i}
            style={{
              position:    'absolute',
              width:       size,
              height:      size,
              borderRadius: size / 2,
              borderWidth: stroke,
              borderColor: 'transparent',
              borderTopColor:    seg.color,
              borderRightColor:  spanDeg > 90  ? seg.color : 'transparent',
              borderBottomColor: spanDeg > 180 ? seg.color : 'transparent',
              borderLeftColor:   spanDeg > 270 ? seg.color : 'transparent',
              transform: [{ rotate: `${startDeg - 90}deg` }],
            }}
          />
        );
        return { els: [...acc.els, el], used: acc.used + seg.pct };
      }, { els: [], used: 0 }).els}
    </View>
  );
}

// ─── AllocationRow ────────────────────────────────────────────────────────────

function AllocationRow({ label, value, pct, color, isLast }: { label: string; value: number; pct: number; color: string; isLast?: boolean }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily } = theme;
  const { fmtCompact: fmtShort } = useCurrency();
  return (
    <View style={{ paddingVertical: spacing[3], borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border.subtle }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: spacing[2] }} />
        <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.medium, color: colors.text.primary }}>{label}</Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{pct.toFixed(1)}%</Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginLeft: spacing[3], minWidth: 64, textAlign: 'right' }}>
          {fmtShort(value)}
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 99 }} />
      </View>
    </View>
  );
}

// ─── AllocationScreen ─────────────────────────────────────────────────────────

export function AllocationScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmtCompact: fmtShort } = useCurrency();

  const { data: holdings } = useInvestments();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  // Group by asset type
  const totalValue = useMemo(
    () => (holdings ?? []).reduce((s, h) => s + h.shares * h.currentPrice, 0),
    [holdings],
  );

  const byType = useMemo(() => {
    const map: Partial<Record<AssetType, number>> = {};
    for (const h of holdings ?? []) {
      const v = h.shares * h.currentPrice;
      map[h.assetType] = (map[h.assetType] ?? 0) + v;
    }
    return Object.entries(map).map(([type, value]) => ({
      type:  type as AssetType,
      value: value ?? 0,
      pct:   totalValue > 0 ? ((value ?? 0) / totalValue) * 100 : 0,
      color: TYPE_COLORS[type as AssetType] ?? '#6B7280',
      label: TYPE_LABELS[type as AssetType] ?? type,
    })).sort((a, b) => b.value - a.value);
  }, [holdings, totalValue]);

  // Individual holdings sorted by value
  const byHolding = useMemo(() =>
    [...(holdings ?? [])].sort((a, b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice)),
    [holdings],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Allocation</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Donut + total ── */}
        <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
          <View style={{ position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart segments={byType.map(t => ({ pct: t.pct, color: t.color }))} />
            {/* Center label */}
            <View style={{ position: 'absolute', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Total</Text>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.3 }}>
                {fmtShort(totalValue)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── By asset type ── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>By Asset Type</Text>
        </View>
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], paddingHorizontal: spacing[4], marginBottom: spacing[5] }]}>
          {byType.map((t, i) => (
            <AllocationRow
              key={t.type}
              label={t.label}
              value={t.value}
              pct={t.pct}
              color={t.color}
              isLast={i === byType.length - 1}
            />
          ))}
        </View>

        {/* ── By holding ── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>By Holding</Text>
        </View>
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, marginHorizontal: spacing[5], overflow: 'hidden' }]}>
          {byHolding.map((h, i) => {
            const value = h.shares * h.currentPrice;
            const pct   = totalValue > 0 ? (value / totalValue) * 100 : 0;
            return (
              <Pressable
                key={h.id}
                onPress={() => navigation.push('HoldingDetail', { holdingId: h.id })}
                style={({ pressed }) => [
                  styles.holdingRow,
                  {
                    paddingHorizontal: spacing[4],
                    paddingVertical:   spacing[3],
                    borderBottomWidth: i < byHolding.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border.subtle,
                    opacity:           pressed ? 0.7 : 1,
                  },
                ]}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: h.color, marginRight: spacing[3] }} />
                <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.bold, color: h.color, minWidth: 56 }}>{h.symbol}</Text>
                <Text style={{ flex: 1, fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginHorizontal: spacing[2] }} numberOfLines={1}>{h.name}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>{pct.toFixed(1)}%</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Diversification score ── */}
        <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[5] }}>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5] }]}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
              Diversification
            </Text>
            {byType.length >= 3 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[3] }}>
                <Text style={{ fontSize: 24, marginRight: spacing[3] }}>✅</Text>
                <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 22 }}>
                  Your portfolio spans {byType.length} asset types — good diversification.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing[3] }}>
                <Text style={{ fontSize: 24, marginRight: spacing[3] }}>💡</Text>
                <Text style={{ flex: 1, fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.secondary, lineHeight: 22 }}>
                  Consider adding different asset types to diversify your portfolio.
                </Text>
              </View>
            )}
          </View>
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

export default AllocationScreen;
