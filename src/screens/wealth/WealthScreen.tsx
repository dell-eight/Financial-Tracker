import React, { useState } from 'react';
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
import { useTheme } from '../../hooks/ui/useTheme';
import type { WealthStackParamList } from '../../navigation/types';

type Props = StackScreenProps<WealthStackParamList, 'WealthMain'>;

type SubTab = 'networth' | 'savings' | 'investments';

const SUB_TABS: { key: SubTab; label: string; icon: string; phase: string }[] = [
  { key: 'networth',     label: 'Net Worth',   icon: '◈', phase: 'Phase 7' },
  { key: 'savings',      label: 'Savings',     icon: '🎯', phase: 'Phase 5' },
  { key: 'investments',  label: 'Investments', icon: '📈', phase: 'Phase 6' },
];

// ── NetWorth placeholder ───────────────────────────────────────────────────────

function NetWorthPlaceholder({ navigation }: { navigation: Props['navigation'] }) {
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = useTheme();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      <View style={[styles.heroCard, shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Total Net Worth
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          ₱412,850
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.income, marginTop: spacing[1] }}>
          ↑ ₱3,200 this month (+0.78%)
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: spacing[3] }}>
        <Pressable
          onPress={() => navigation.push('AssetsDetail')}
          style={[styles.statTile, shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4] }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Assets</Text>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: 4, letterSpacing: -0.3 }}>₱485K</Text>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.income, marginTop: 2 }}>↑ 4 accounts</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.push('DebtsDetail')}
          style={[styles.statTile, shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4] }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted }}>Debts</Text>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, marginTop: 4, letterSpacing: -0.3 }}>₱72K</Text>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>2 accounts</Text>
        </Pressable>
      </View>

      <View style={[styles.comingCard, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5], borderWidth: 1, borderColor: colors.border.subtle }]}>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>Net Worth Module</Text>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: spacing[2], lineHeight: 22 }}>
          Full implementation in Phase 7. This will include asset balance editing, debt tracking, monthly snapshots, and a 10-year growth chart.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Savings placeholder ────────────────────────────────────────────────────────

function SavingsPlaceholder({ navigation }: { navigation: Props['navigation'] }) {
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = useTheme();

  const goals = [
    { id: '1', name: 'House Down Payment', emoji: '🏠', pct: 62, color: colors.accent.primary },
    { id: '2', name: 'Europe Trip',        emoji: '✈️', pct: 80, color: '#22C55E' },
    { id: '3', name: 'Emergency Fund',     emoji: '🆘', pct: 45, color: '#F97316' },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>Savings Goals</Text>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>3 active goals</Text>
        </View>
        <Pressable
          onPress={() => navigation.push('CreateGoal')}
          style={[styles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ New Goal</Text>
        </Pressable>
      </View>

      {goals.map(goal => (
        <Pressable
          key={goal.id}
          onPress={() => navigation.push('GoalDetail', { goalId: goal.id })}
          style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Text style={{ fontSize: 24, lineHeight: 30 }}>{goal.emoji}</Text>
              <View>
                <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{goal.name}</Text>
                <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>{goal.pct}% complete</Text>
              </View>
            </View>
            <Text style={{ fontSize: 18, color: colors.text.muted }}>›</Text>
          </View>
          <View style={{ height: 4, backgroundColor: colors.bg.surfaceMuted, borderRadius: 2, marginTop: spacing[3] }}>
            <View style={{ height: 4, width: `${goal.pct}%`, backgroundColor: goal.color, borderRadius: 2 }} />
          </View>
        </Pressable>
      ))}

      <View style={[{ backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[5], borderWidth: 1, borderColor: colors.border.subtle }]}>
        <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, lineHeight: 22 }}>
          Full savings module in Phase 5 — goal creation, contribution history, forecast, and celebration screen.
        </Text>
      </View>
    </ScrollView>
  );
}

// ── Investments placeholder ────────────────────────────────────────────────────

function InvestmentsPlaceholder({ navigation }: { navigation: Props['navigation'] }) {
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = useTheme();

  const holdings = [
    { id: '1', symbol: 'VTI',   name: 'Vanguard Total Stock ETF', value: '₱62,400', pnl: '+₱12,400', pct: '+24.9%', positive: true },
    { id: '2', symbol: 'BND',   name: 'Bond Market ETF',          value: '₱38,700', pnl: '+₱2,700',  pct: '+7.5%',  positive: true },
    { id: '3', symbol: 'VTSAX', name: 'Index Mutual Fund',        value: '₱27,000', pnl: '+₱5,000',  pct: '+22.7%', positive: true },
  ];

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      <View style={[styles.heroCard, shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Portfolio Value
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          ₱128,300
        </Text>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.income, marginTop: spacing[1] }}>
          +₱19,090 (+17.5%) total return
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>Holdings</Text>
        <Pressable
          onPress={() => navigation.push('AddHolding', { accountId: 'default' })}
          style={[styles.addBtn, { backgroundColor: colors.accent.primary, borderRadius: borderRadius.button }]}
        >
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: '#FFFFFF' }}>+ Add Holding</Text>
        </Pressable>
      </View>

      {holdings.map(h => (
        <Pressable
          key={h.id}
          onPress={() => navigation.push('HoldingDetail', { holdingId: h.id })}
          style={[shadows.card, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
        >
          <View>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.bold, color: colors.text.primary }}>{h.symbol}</Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }} numberOfLines={1}>{h.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.bodyLg, fontFamily: fontFamily.semiBold, color: colors.text.primary }}>{h.value}</Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: h.positive ? colors.income : colors.expense, marginTop: 2 }}>
              {h.pnl}  {h.pct}
            </Text>
          </View>
        </Pressable>
      ))}
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
      <StatusBar style="light" />

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
        {activeTab === 'networth'    && <NetWorthPlaceholder    navigation={navigation} />}
        {activeTab === 'savings'     && <SavingsPlaceholder     navigation={navigation} />}
        {activeTab === 'investments' && <InvestmentsPlaceholder navigation={navigation} />}
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
  comingCard: {},
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
  },
});

export default WealthScreen;
