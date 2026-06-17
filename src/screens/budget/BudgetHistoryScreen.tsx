import React, { useMemo } from 'react';
import Animated from 'react-native-reanimated';
import { useScreenAnimation } from '../../hooks/ui/useScreenAnimation';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../hooks/ui/useTheme';
import { useBudgets } from '../../hooks/queries/useBudgets';
import type { BudgetStackParamList } from '../../navigation/types';
import { useCurrency } from '../../utils/currency';

type Props = StackScreenProps<BudgetStackParamList, 'BudgetHistory'>;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types & Constants ────────────────────────────────────────────────────────

interface MonthRecord {
  month:     string;
  year:      number;
  spent:     number;
  allocated: number;
  isReal:    boolean;
}

// Multipliers to vary mock history from current budget data
const MOCK_PCTS = [0.61, 0.92, 0.66, 0.78, 0.81];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── MonthBar ─────────────────────────────────────────────────────────────────

function MonthBar({ record, maxSpent }: { record: MonthRecord; maxSpent: number }) {
  const theme = useTheme();
  const { colors, spacing, borderRadius, fontSize, fontFamily, shadows } = theme;
  const { fmt, fmtCompact: fmtShort } = useCurrency();

  const ratio     = record.allocated > 0 ? record.spent / record.allocated : 0;
  const barWidth  = maxSpent > 0 ? (record.spent / maxSpent) * (SCREEN_W - 40 - 120) : 0;
  const isOver    = ratio > 1;
  const isNear    = ratio >= 0.8 && !isOver;
  const barColor  = isOver ? colors.expense : isNear ? colors.warning : colors.accent.primary;
  const pctColor  = isOver ? colors.expense : isNear ? colors.warning : colors.income;

  return (
    <View style={[barStyles.row, shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], marginBottom: spacing[3] }]}>
      {/* Month label */}
      <View style={{ width: 44 }}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: record.isReal ? colors.text.primary : colors.text.secondary, lineHeight: 18 }}>
          {record.month}
        </Text>
        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, lineHeight: 14 }}>
          {record.year}
        </Text>
        {record.isReal && (
          <View style={[barStyles.liveTag, { backgroundColor: colors.accent.muted, borderRadius: borderRadius.full, marginTop: 3 }]}>
            <Text style={{ fontSize: 8, fontFamily: fontFamily.semiBold, color: colors.accent.primary }}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Bar track */}
      <View style={{ flex: 1, marginHorizontal: spacing[3] }}>
        <View style={[barStyles.track, { backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, overflow: 'hidden' }]}>
          <View style={[barStyles.fill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: barColor, borderRadius: 99 }]} />
        </View>
        <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 4 }}>
          {fmt(record.spent)} of {fmtShort(record.allocated)}
        </Text>
      </View>

      {/* Percentage badge */}
      <View style={[barStyles.pctBadge, { backgroundColor: `${pctColor}15`, borderRadius: borderRadius.full, paddingHorizontal: spacing[2], paddingVertical: spacing[1] }]}>
        <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.bold, color: pctColor }}>
          {Math.round(ratio * 100)}%
        </Text>
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center' },
  liveTag:  { paddingHorizontal: 5, paddingVertical: 2, alignSelf: 'flex-start' },
  track:    { height: 8 },
  fill:     { position: 'absolute', left: 0, top: 0, height: '100%' },
  pctBadge: {},
});

// ─── BudgetHistoryScreen ──────────────────────────────────────────────────────

export function BudgetHistoryScreen({ navigation }: Props) {
  const theme  = useTheme();
  const insets = useSafeAreaInsets();
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;
  const { fmtCompact: fmtShort } = useCurrency();

  const { data: budgets } = useBudgets();

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 24);
  const btmPad = insets.bottom > 0 ? insets.bottom : 24;

  const realAllocated = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + b.limit, 0),
    [budgets],
  );
  const realSpent = useMemo(
    () => (budgets ?? []).reduce((s, b) => s + b.spent, 0),
    [budgets],
  );

  // Build 6-month history: 5 mock + current real month
  const history = useMemo<MonthRecord[]>(() => {
    const now      = new Date();
    const curMonth = now.getMonth();
    const records: MonthRecord[] = [];

    for (let i = 5; i >= 1; i--) {
      const monthIdx = ((curMonth - i) + 12) % 12;
      const year     = curMonth - i < 0 ? now.getFullYear() - 1 : now.getFullYear();
      const pct      = MOCK_PCTS[5 - i] ?? 0.70;
      records.push({
        month:     MONTH_NAMES[monthIdx],
        year,
        spent:     Math.round(realAllocated * pct),
        allocated: realAllocated,
        isReal:    false,
      });
    }

    records.push({
      month:     MONTH_NAMES[curMonth],
      year:      now.getFullYear(),
      spent:     realSpent,
      allocated: realAllocated,
      isReal:    true,
    });

    return records;
  }, [realAllocated, realSpent]);

  const maxSpent    = useMemo(() => Math.max(...history.map(h => h.spent)), [history]);
  const avgSpent    = useMemo(() => Math.round(history.reduce((s, h) => s + h.spent, 0) / history.length), [history]);
  const avgRatio    = realAllocated > 0 ? avgSpent / realAllocated : 0;
  const bestMonth   = useMemo(() => history.reduce((best, h) => h.spent < best.spent ? h : best), [history]);
  const worstMonth  = useMemo(() => history.reduce((worst, h) => h.spent > worst.spent ? h : worst), [history]);

  const [headerStyle, contentStyle] = useScreenAnimation(2);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.base }]}>
      <StatusBar style={theme.statusBarStyle} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { paddingTop: topPad + spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[3] }, headerStyle]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={{ minWidth: 60 }}>
          <Text style={{ fontSize: fontSize.bodyLg, color: colors.accent.primary, fontFamily: fontFamily.medium }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary }}>
          Budget History
        </Text>
        <View style={{ minWidth: 60 }} />
      </Animated.View>

      <Animated.View style={[{ flex: 1 }, contentStyle]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: btmPad + spacing[8] }}>

        {/* ── Summary stats ────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], marginBottom: spacing[5] }}>
          <View style={[styles.statsRow, { gap: spacing[3] }]}>
            {/* Avg spend */}
            <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flex: 1 }]}>
              <Text style={{ fontSize: 20 }}>📊</Text>
              <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.3, marginTop: spacing[2] }}>
                {fmtShort(avgSpent)}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary, marginTop: 2 }}>
                Avg monthly
              </Text>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: avgRatio > 0.9 ? colors.expense : colors.text.muted, marginTop: 2 }}>
                {Math.round(avgRatio * 100)}% of budget
              </Text>
            </View>

            {/* Best month */}
            <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flex: 1 }]}>
              <Text style={{ fontSize: 20 }}>🏆</Text>
              <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.income, letterSpacing: -0.3, marginTop: spacing[2] }}>
                {bestMonth.month}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary, marginTop: 2 }}>
                Best month
              </Text>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                {fmtShort(bestMonth.spent)} spent
              </Text>
            </View>

            {/* Worst month */}
            <View style={[styles.statCard, shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4], flex: 1 }]}>
              <Text style={{ fontSize: 20 }}>📈</Text>
              <Text style={{ fontSize: fontSize.headingMd, fontFamily: fontFamily.bold, color: colors.expense, letterSpacing: -0.3, marginTop: spacing[2] }}>
                {worstMonth.month}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.secondary, marginTop: 2 }}>
                Highest
              </Text>
              <Text style={{ fontSize: 10, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                {fmtShort(worstMonth.spent)} spent
              </Text>
            </View>
          </View>
        </View>

        {/* ── Monthly bars ─────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[4] }}>
            Last 6 Months
          </Text>
          {history.map(record => (
            <MonthBar key={`${record.month}${record.year}`} record={record} maxSpent={maxSpent} />
          ))}
        </View>

        {/* ── Category breakdown (current month) ──────────────────────────────── */}
        <View style={{ paddingHorizontal: spacing[5], marginTop: spacing[5] }}>
          <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, marginBottom: spacing[4] }}>
            This Month by Category
          </Text>
          <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, overflow: 'hidden' }]}>
            {(budgets ?? []).map((b, i) => {
              const ratio    = b.limit > 0 ? b.spent / b.limit : 0;
              const catColor = theme.categoryColors[b.category] ?? colors.accent.primary;
              const isOver   = b.spent > b.limit;
              return (
                <View
                  key={b.id}
                  style={[
                    styles.catRow,
                    {
                      paddingHorizontal: spacing[4],
                      paddingVertical:   spacing[3],
                      borderBottomWidth: i < (budgets?.length ?? 0) - 1 ? StyleSheet.hairlineWidth : 0,
                      borderBottomColor: colors.border.subtle,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16, marginRight: spacing[3] }}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.catLabelRow, { marginBottom: 4 }]}>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.medium, color: colors.text.primary, flex: 1 }} numberOfLines={1}>
                        {b.label}
                      </Text>
                      <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: isOver ? colors.expense : catColor }}>
                        {Math.round(ratio * 100)}%
                      </Text>
                    </View>
                    <View style={[styles.miniTrack, { backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, overflow: 'hidden' }]}>
                      <View style={[styles.miniFill, { width: `${Math.min(ratio * 100, 100)}%`, backgroundColor: isOver ? colors.expense : catColor, borderRadius: 99 }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow:     { flexDirection: 'row' },
  statCard:     {},
  catRow:       { flexDirection: 'row', alignItems: 'center' },
  catLabelRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniTrack:    { height: 4 },
  miniFill:     { position: 'absolute', left: 0, top: 0, height: '100%' },
});

export default BudgetHistoryScreen;
