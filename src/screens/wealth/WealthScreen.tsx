import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useSavingsGoals } from '../../hooks/queries/useSavingsGoals';
import { useInvestments } from '../../hooks/queries/useInvestments';
import { useAssets, useDebts } from '../../hooks/queries/useNetWorth';
import { useNetWorthHistory } from '../../hooks/queries/useAnalytics';
import type { WealthStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';

type Props = StackScreenProps<WealthStackParamList, 'WealthMain'>;

type SubTab = 'networth' | 'savings' | 'investments';

const SUB_TABS: { key: SubTab; label: string; icon: string; phase: string }[] = [
  { key: 'networth',     label: 'Net Worth',   icon: '◈', phase: 'Phase 7' },
  { key: 'savings',      label: 'Savings',     icon: '🎯', phase: 'Phase 5' },
  { key: 'investments',  label: 'Investments', icon: '📈', phase: 'Phase 6' },
];

// ── Net Worth overview ────────────────────────────────────────────────────────

function NetWorthOverview({ navigation }: { navigation: Props['navigation'] }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const { data: assets  } = useAssets();
  const { data: debts   } = useDebts();
  const { data: nwHist  } = useNetWorthHistory(2);

  const totalAssets = useMemo(() => (assets ?? []).reduce((s, a) => s + a.balance, 0), [assets]);
  const totalDebts  = useMemo(() => (debts  ?? []).reduce((s, d) => s + d.balance,  0), [debts]);
  const netWorth    = totalAssets - totalDebts;

  const { deltaAmt, deltaPct } = useMemo(() => {
    const snaps = nwHist ?? [];
    if (snaps.length < 2) return { deltaAmt: 0, deltaPct: 0 };
    const curr = snaps[snaps.length - 1].nw;
    const prev = snaps[snaps.length - 2].nw;
    const amt  = curr - prev;
    const pct  = prev !== 0 ? (amt / Math.abs(prev)) * 100 : 0;
    return { deltaAmt: amt, deltaPct: pct };
  }, [nwHist]);

  const { fmt, fmtCompact: fmtShort } = useCurrency();

  // Asset category breakdown for mini bars
  const assetGroups = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of assets ?? []) {
      map[a.category] = (map[a.category] ?? 0) + a.balance;
    }
    return Object.entries(map).map(([cat, val]) => ({ cat, val })).sort((a, b) => b.val - a.val);
  }, [assets]);

  const CAT_LABELS: Record<string, string> = { cash: 'Cash', investment: 'Investments', vehicle: 'Vehicles', real_estate: 'Property', other: 'Other' };
  const CAT_COLORS: Record<string, string> = { cash: '#755DEF', investment: '#F97316', vehicle: '#EC4899', real_estate: '#22C55E', other: '#6B7280' };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Net Worth hero ── */}
      <View style={[styles.heroCard, shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Total Net Worth
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          {fmt(netWorth)}
        </Text>
        {deltaAmt !== 0 && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: deltaAmt >= 0 ? colors.income : colors.expense, marginTop: spacing[1] }}>
            {deltaAmt >= 0 ? '↑' : '↓'} {fmtShort(Math.abs(deltaAmt))} ({deltaAmt >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%) this month
          </Text>
        )}

        {/* Assets / Debts ratio bar */}
        {totalAssets > 0 && (
          <View style={{ marginTop: spacing[4] }}>
            <View style={{ height: 8, backgroundColor: colors.expense + '40', borderRadius: 99, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${Math.min((totalAssets / (totalAssets + totalDebts)) * 100, 100)}%`, backgroundColor: colors.income, borderRadius: 99 }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[1] }}>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.income }}>Assets {fmtShort(totalAssets)}</Text>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.expense }}>Debts {fmtShort(totalDebts)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Assets + Debts tiles ── */}
      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <Pressable
          onPress={() => navigation.push('AssetsDetail')}
          style={({ pressed }) => [styles.statTile, shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Assets</Text>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: 4, letterSpacing: -0.3 }}>
            {fmtShort(totalAssets)}
          </Text>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.income, marginTop: 2 }}>
            {(assets ?? []).length} items →
          </Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.push('DebtsDetail')}
          style={({ pressed }) => [styles.statTile, shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Debts</Text>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, marginTop: 4, letterSpacing: -0.3 }}>
            {fmtShort(totalDebts)}
          </Text>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {(debts ?? []).length} accounts →
          </Text>
        </Pressable>
      </View>

      {/* ── Asset breakdown mini bars ── */}
      {assetGroups.length > 0 && (
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing[3] }}>
            Asset Breakdown
          </Text>
          {assetGroups.map(({ cat, val }) => {
            const pct   = totalAssets > 0 ? (val / totalAssets) * 100 : 0;
            const color = CAT_COLORS[cat] ?? colors.accent.primary;
            return (
              <View key={cat} style={{ marginBottom: spacing[3] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.secondary }}>
                    {CAT_LABELS[cat] ?? cat}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>
                    {fmtShort(val)} · {pct.toFixed(1)}%
                  </Text>
                </View>
                <View style={{ height: 5, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99 }}>
                  <View style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 99 }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ── Savings overview ───────────────────────────────────────────────────────────

function SavingsOverview({ navigation }: { navigation: Props['navigation'] }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: goals, isLoading } = useSavingsGoals();

  const totalSaved  = useMemo(() => (goals ?? []).reduce((s, g) => s + g.savedAmount,  0), [goals]);
  const totalTarget = useMemo(() => (goals ?? []).reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const overallPct  = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const { fmtCompact: fmtShort } = useCurrency();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Summary hero ── */}
      <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Total Saved
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          {fmtShort(totalSaved)}
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
          of {fmtShort(totalTarget)} total target · {overallPct}% overall
        </Text>
        {/* Overall progress bar */}
        <View style={{ height: 6, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, marginTop: spacing[3], overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${Math.min(overallPct, 100)}%`, backgroundColor: colors.accent.primary, borderRadius: 99 }} />
        </View>
      </View>

      {/* ── Goals header row ── */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
            Savings Goals
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
            {(goals ?? []).length} active {(goals ?? []).length === 1 ? 'goal' : 'goals'}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.push('CreateGoal')}
          style={[styles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ New Goal</Text>
        </Pressable>
      </View>

      {/* ── Goal cards ── */}
      {isLoading ? (
        <View style={{ paddingVertical: spacing[8], alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      ) : (goals ?? []).length === 0 ? (
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[6], alignItems: 'center', borderWidth: 1, borderColor: colors.border.subtle }}>
          <Text style={{ fontSize: 36 }}>🎯</Text>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginTop: spacing[3] }}>
            No goals yet
          </Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], textAlign: 'center' }}>
            Create your first savings goal to start tracking your progress.
          </Text>
          <Pressable
            onPress={() => navigation.push('CreateGoal')}
            style={{ backgroundColor: colors.accent.primary, borderRadius: borderRadius.button, paddingHorizontal: spacing[5], paddingVertical: spacing[3], marginTop: spacing[4] }}
          >
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>Create Goal</Text>
          </Pressable>
        </View>
      ) : (
        (goals ?? []).map(goal => {
          const pct      = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
          const isComplete = goal.savedAmount >= goal.targetAmount;
          return (
            <Pressable
              key={goal.id}
              onPress={() => navigation.push('GoalDetail', { goalId: goal.id })}
              style={({ pressed }) => [
                shadows.card,
                {
                  backgroundColor: colors.bg.surface,
                  borderRadius:    borderRadius.card,
                  padding:         spacing[4],
                  opacity:         pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Emoji + info */}
                <View style={{ backgroundColor: goal.color + '18', borderRadius: borderRadius.full, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: spacing[3] }}>
                  <Text style={{ fontSize: 22, lineHeight: 28 }}>{goal.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }} numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                    {fmtShort(goal.savedAmount)} / {fmtShort(goal.targetAmount)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {isComplete ? (
                    <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.income }}>🎉 Done</Text>
                  ) : (
                    <>
                      <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: goal.color, letterSpacing: -0.3 }}>
                        {pct}%
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                        {fmtShort(goal.targetAmount - goal.savedAmount)} left
                      </Text>
                    </>
                  )}
                </View>
              </View>
              {/* Progress bar */}
              <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 2, marginTop: spacing[3], overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${Math.min(pct, 100)}%`, backgroundColor: isComplete ? colors.income : goal.color, borderRadius: 2 }} />
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

// ── Investments overview ───────────────────────────────────────────────────────

function InvestmentsOverview({ navigation }: { navigation: Props['navigation'] }) {
  const theme = useTheme();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { data: holdings, isLoading } = useInvestments();

  const totalValue  = useMemo(() => (holdings ?? []).reduce((s, h) => s + h.shares * h.currentPrice,    0), [holdings]);
  const totalCost   = useMemo(() => (holdings ?? []).reduce((s, h) => s + h.shares * h.avgCostPerShare, 0), [holdings]);
  const totalPnl    = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const isPositive  = totalPnl >= 0;

  const { fmt, fmtCompact: fmtShort } = useCurrency();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Portfolio hero ── */}
      <View style={[styles.heroCard, shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
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
        {/* Allocation shortcut */}
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
          style={[styles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
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
        [...(holdings ?? [])].sort((a, b) => (b.shares * b.currentPrice) - (a.shares * a.currentPrice)).map(h => {
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
                {
                  backgroundColor: colors.bg.surface,
                  borderRadius:    borderRadius.card,
                  padding:         spacing[4],
                  flexDirection:   'row',
                  alignItems:      'center',
                  opacity:         pressed ? 0.85 : 1,
                },
              ]}
            >
              {/* Symbol badge */}
              <View style={{ backgroundColor: h.color + '20', borderRadius: borderRadius.md, paddingHorizontal: spacing[2], paddingVertical: 5, minWidth: 56, alignItems: 'center', marginRight: spacing[3] }}>
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
        })
      )}
    </ScrollView>
  );
}

// ── WealthScreen ───────────────────────────────────────────────────────────────

export function WealthScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius } = theme;

  const [activeTab, setActiveTab] = useState<SubTab>('networth');

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + spacing[3], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <Text style={{ fontSize: fontSize.headingLg, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.4 }}>
          Wealth
        </Text>
      </View>

      {/* ── Sub-tab bar ── */}
      <View style={[styles.subTabBar, { paddingHorizontal: spacing[5], paddingBottom: spacing[3] }]}>
        <View style={[styles.subTabTrack, { backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3 }]}>
          {SUB_TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.subTabItem,
                  {
                    borderRadius:    borderRadius.full,
                    backgroundColor: active ? colors.bg.surfaceRaised : 'transparent',
                    paddingVertical: spacing[2],
                    paddingHorizontal: spacing[3],
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={{
                  fontSize:   fontSize.bodySm,
                  fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                  color:      active ? colors.text.primary : colors.text.muted,
                }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Sub-tab content ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'networth'    && <NetWorthOverview       navigation={navigation} />}
        {activeTab === 'savings'     && <SavingsOverview        navigation={navigation} />}
        {activeTab === 'investments' && <InvestmentsOverview    navigation={navigation} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  subTabBar: {
    width: '100%',
  },
  subTabTrack: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  subTabItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  heroCard: {},
  statTile: {},
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
  },
});

export default WealthScreen;
