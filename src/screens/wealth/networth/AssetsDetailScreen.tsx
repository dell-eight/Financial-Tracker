import React, { useMemo } from 'react';
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
import { useTheme } from '../../../hooks/ui/useTheme';
import { useAssets } from '../../../hooks/queries/useNetWorth';
import { useSavingsGoals } from '../../../hooks/queries/useSavingsGoals';
import type { WealthStackParamList } from '../../../navigation/types';
import { useCurrency } from '../../../utils/currency';
import type { AssetCategory, AssetItem } from '../../../types/models';

type Props = StackScreenProps<WealthStackParamList, 'AssetsDetail'>;

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  cash:        'Banks',
  investment:  'Investments',
  real_estate: 'Real Estate',
  vehicle:     'Vehicles',
  other:       'Other Assets',
};

const CATEGORY_ORDER: AssetCategory[] = ['cash', 'investment', 'real_estate', 'vehicle', 'other'];

export function AssetsDetailScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();

  const { data: assets, isLoading } = useAssets();
  const { data: savingsGoals = [] }  = useSavingsGoals();

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
            {fmt(totalAssets)}
          </Text>
        </View>

        {/* ── Manage accounts hint ── */}
        <Pressable
          onPress={() => {
            // Navigate to Profile → My Accounts via the Home tab
            navigation.getParent()?.getParent()?.navigate('Home', {
              screen: 'Profile',
            } as any);
          }}
          style={[shadows.sm, { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent.muted, borderRadius: borderRadius.card, marginHorizontal: spacing[5], marginBottom: spacing[5], padding: spacing[4], gap: spacing[3] }]}
        >
          <Text style={{ fontSize: 20 }}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>
              Manage Accounts
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
              Add, edit or remove accounts in Profile → My Accounts
            </Text>
          </View>
          <Text style={{ fontSize: 16, color: colors.accent.primary }}>›</Text>
        </Pressable>

        {/* ── Empty state ── */}
        {!isLoading && (assets ?? []).length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: spacing[8], paddingHorizontal: spacing[6] }}>
            <Text style={{ fontSize: 48, marginBottom: spacing[3] }}>🏦</Text>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[2], textAlign: 'center' }}>
              No assets yet
            </Text>
            <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center' }}>
              Add your first account in Profile → My Accounts.
            </Text>
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
                  <View
                    key={item.id}
                    style={[
                      s.itemRow,
                      {
                        paddingHorizontal: spacing[4],
                        paddingVertical:   spacing[4],
                        borderBottomWidth: idx < items.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: colors.border.subtle,
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
                    <Text style={{ fontSize: fontSize.bodyMd, fontFamily: fontFamily.semiBold, color: item.color }}>
                      {fmtShort(item.balance)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* ── Savings Goals section ── */}
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

        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[5], paddingHorizontal: spacing[5] }}>
          Savings goals are managed from the Goals screen
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen:  { flex: 1 },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
});

export default AssetsDetailScreen;
