import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../../../hooks/ui/useTheme';
import { useChartModalStore } from '../../../store/chartModal.store';
import { useAssets, useDebts } from '../../../hooks/queries/useNetWorth';
import { useNetWorthHistory } from '../../../hooks/queries/useAnalytics';
import { QueryError } from '../../../components/common/QueryError';
import { NetWorthChart } from '../../../components/wealth/NetWorthChart';
import type { WealthStackParamList } from '../../../navigation/types';
import type { NWPoint } from '../../../services/finance.service';
import { useCurrency } from '../../../utils/currency';

type Navigation = StackScreenProps<WealthStackParamList, 'WealthMain'>['navigation'];

const parseUTC = (dateStr: string): Date =>
  new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00Z');

type SnapshotPoint = NWPoint & { _time: number; _year: number };

const MONTH_ABBRS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fillMonths(data: NWPoint[], months: number): NWPoint[] {
  const today = new Date();
  const slots: NWPoint[] = [];
  let prevYear: number | null = null;
  for (let i = months - 1; i >= 1; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const yearMonth = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthAbbr = MONTH_ABBRS[d.getMonth()];
    const label =
      prevYear === null || year !== prevYear
        ? `${monthAbbr} '${String(year).slice(2)}`
        : monthAbbr;
    prevYear = year;
    const existing = data.find(p => !p.isLive && p.date?.startsWith(yearMonth));
    slots.push(existing ? { ...existing, label } : { label, nw: 0 });
  }
  const live = data.find(p => p.isLive);
  if (live) slots.push(live);
  return slots;
}

function groupByYear(data: NWPoint[]): NWPoint[] {
  const currentYear = new Date().getUTCFullYear();
  const snapshots: SnapshotPoint[] = data
    .filter(item => !item.isLive && !!item.date)
    .map(item => {
      const d = parseUTC(item.date!);
      return { ...item, _time: d.getTime(), _year: d.getUTCFullYear() };
    });
  const yearlyMap = new Map<number, SnapshotPoint>();
  for (const item of snapshots) {
    const existing = yearlyMap.get(item._year);
    if (!existing || item._time > existing._time) {
      yearlyMap.set(item._year, item);
    }
  }
  const historical: NWPoint[] = Array.from(yearlyMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, item]) => ({ label: String(year), nw: item.nw }));
  const livePoint = data.filter(i => i.isLive).pop();
  if (!livePoint) return historical;
  const liveEntry: NWPoint = { label: String(currentYear), nw: livePoint.nw, isLive: true };
  const filtered  = historical.filter(r => Number(r.label) !== currentYear);
  const insertAt  = filtered.findIndex(r => Number(r.label) > currentYear);
  return insertAt === -1
    ? [...filtered, liveEntry]
    : [...filtered.slice(0, insertAt), liveEntry, ...filtered.slice(insertAt)];
}

interface MilestoneDef {
  type:       string;
  threshold:  number;
  label:      string;
  emoji:      string;
  isDebtFree?: boolean;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  { type: 'positive_nw', threshold: 0,          label: 'Positive Net Worth', emoji: '🌱' },
  { type: 'nw_100k',     threshold: 100_000,     label: '₱100K Net Worth',   emoji: '💰' },
  { type: 'nw_500k',     threshold: 500_000,     label: '₱500K Net Worth',   emoji: '🚀' },
  { type: 'nw_1m',       threshold: 1_000_000,   label: 'Millionaire',       emoji: '🏆' },
  { type: 'nw_5m',       threshold: 5_000_000,   label: '₱5M Net Worth',     emoji: '💎' },
  { type: 'nw_10m',      threshold: 10_000_000,  label: '₱10M Net Worth',    emoji: '👑' },
];

const CHART_SIDE_PAD = 20;

export function NetWorthTab({ navigation }: { navigation: Navigation }) {
  const theme     = useTheme();
  useChartModalStore(s => s.open); // kept for future expand-chart integration
  const { colors, spacing, fontSize, fontFamily, borderRadius, shadows } = theme;

  const [period, setPeriod] = useState<6 | 12 | 36>(12);
  const { data: assets, isError: assetsErr, refetch: refetchAssets } = useAssets();
  const { data: debts,  isError: debtsErr,  refetch: refetchDebts  } = useDebts();
  const { data: nwHist, isError: histErr,   refetch: refetchHist   } = useNetWorthHistory(period);

  const totalAssets = useMemo(() => (assets ?? []).reduce((s, a) => s + a.balance, 0), [assets]);
  const totalDebts  = useMemo(() => (debts  ?? []).reduce((s, d) => s + d.balance,  0), [debts]);
  const netWorth    = totalAssets - totalDebts;

  const { fmt, fmtCompact: fmtShort } = useCurrency();

  const screenW = Dimensions.get('window').width;
  const chartW  = screenW - CHART_SIDE_PAD * 2;

  const { deltaAmt, deltaPct } = useMemo(() => {
    const snaps = (nwHist ?? []).filter(p => !p.isLive);
    const live  = (nwHist ?? []).find(p => p.isLive);
    if (snaps.length < 1 || !live) return { deltaAmt: 0, deltaPct: 0 };
    const curr = live.nw;
    const prev = snaps[snaps.length - 1].nw;
    const amt  = curr - prev;
    const pct  = prev !== 0 ? (amt / Math.abs(prev)) * 100 : 0;
    return { deltaAmt: amt, deltaPct: pct };
  }, [nwHist]);

  const monthlyProgress = useMemo(() => {
    const snaps = (nwHist ?? []).filter(p => !p.isLive);
    if (snaps.length < 4) return 0;
    const recent = snaps[snaps.length - 1].nw;
    const base   = snaps[snaps.length - 4].nw;
    return (recent - base) / 3;
  }, [nwHist]);

  const nextMilestone = useMemo<MilestoneDef | null>(() => {
    if (totalDebts > 0) {
      return { type: 'debt_free', threshold: 0, label: 'Debt Free', emoji: '🔓', isDebtFree: true };
    }
    return MILESTONE_DEFS.find(m => netWorth < m.threshold) ?? null;
  }, [netWorth, totalDebts]);

  const milestoneProgress = useMemo(() => {
    if (!nextMilestone || nextMilestone.isDebtFree) return 0;
    const prev = MILESTONE_DEFS[MILESTONE_DEFS.indexOf(nextMilestone) - 1];
    const base = prev?.threshold ?? 0;
    const span = nextMilestone.threshold - base;
    return span > 0 ? Math.min((netWorth - base) / span, 1) : 0;
  }, [nextMilestone, netWorth]);

  const debtFreeProgress = totalDebts > 0 && nextMilestone?.isDebtFree
    ? Math.min((1 - totalDebts / (totalDebts + totalAssets * 0.5)), 1)
    : 0;

  const progressPct = nextMilestone?.isDebtFree ? debtFreeProgress : milestoneProgress;

  const monthsAway = useMemo(() => {
    if (!nextMilestone || monthlyProgress <= 0) return null;
    if (nextMilestone.isDebtFree) return Math.ceil(totalDebts / monthlyProgress);
    const remaining = nextMilestone.threshold - netWorth;
    return remaining > 0 ? Math.ceil(remaining / monthlyProgress) : 0;
  }, [nextMilestone, monthlyProgress, netWorth, totalDebts]);

  const chartData   = period === 36 ? groupByYear(nwHist ?? []) : fillMonths(nwHist ?? [], period);
  const hasTimeline = (nwHist ?? []).filter(p => !p.isLive).length >= 1;

  if (assetsErr || debtsErr || histErr) {
    const retryAll = () => { void refetchAssets(); void refetchDebts(); void refetchHist(); };
    return <QueryError onRetry={retryAll} />;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}
    >
      {/* ── Net Worth hero ── */}
      <View style={[shadows.hero, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.cardLg, padding: spacing[5] }]}>
        <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 1, textTransform: 'uppercase' }}>
          Total Net Worth
        </Text>
        <Text style={{ fontSize: fontSize.displayXl, fontFamily: fontFamily.bold, color: colors.text.primary, marginTop: spacing[1], letterSpacing: -1 }}>
          {fmt(netWorth)}
        </Text>
        {deltaAmt !== 0 && (
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: deltaAmt >= 0 ? colors.income : colors.expense, marginTop: spacing[1] }}>
            {deltaAmt >= 0 ? '↑' : '↓'} {fmt(Math.abs(deltaAmt))} ({deltaAmt >= 0 ? '+' : ''}{deltaPct.toFixed(2)}%) vs last month
          </Text>
        )}
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
          style={({ pressed }) => [shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], opacity: pressed ? 0.8 : 1 }]}
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
          style={({ pressed }) => [shadows.card, { flex: 1, backgroundColor: colors.bg.surface, borderRadius: borderRadius.lg, padding: spacing[4], opacity: pressed ? 0.8 : 1 }]}
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

      {/* ── Net Worth Timeline ── */}
      <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, paddingTop: spacing[4], paddingBottom: spacing[3] }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[4], marginBottom: spacing[3] }}>
          <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.semiBold, color: colors.text.secondary }}>
            Net Worth Timeline
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[1], backgroundColor: colors.bg.surfaceMuted, borderRadius: borderRadius.full, padding: 3 }}>
            {([6, 12, 36] as const).map(p => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[{
                  paddingHorizontal: spacing[3],
                  paddingVertical:   4,
                  borderRadius:      borderRadius.full,
                  backgroundColor:   period === p ? colors.bg.surfaceRaised : 'transparent',
                }]}
              >
                <Text style={{
                  fontSize:   fontSize.micro,
                  fontFamily: period === p ? fontFamily.semiBold : fontFamily.regular,
                  color:      period === p ? colors.text.primary : colors.text.muted,
                }}>
                  {p === 6 ? '6M' : p === 12 ? '1Y' : '3Y'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {hasTimeline ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: CHART_SIDE_PAD }}>
            <NetWorthChart data={chartData} width={Math.max(chartW - CHART_SIDE_PAD * 2, chartData.length * 44)} />
          </ScrollView>
        ) : (
          <View style={{ paddingVertical: spacing[6], alignItems: 'center', paddingHorizontal: spacing[5] }}>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.semiBold, color: colors.text.primary, textAlign: 'center' }}>
              Your timeline builds here
            </Text>
            <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, textAlign: 'center', marginTop: spacing[2] }}>
              Keep tracking — your net worth history appears month by month.
            </Text>
          </View>
        )}

        {monthlyProgress !== 0 && (
          <View style={{
            flexDirection:   'row',
            alignItems:      'center',
            paddingHorizontal: spacing[4],
            paddingTop:      spacing[3],
            borderTopWidth:  1,
            borderTopColor:  colors.border.subtle,
            marginTop:       spacing[2],
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Monthly Progress
              </Text>
              <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                3-month average
              </Text>
            </View>
            <Text style={{
              fontSize:   fontSize.headingSm,
              fontFamily: fontFamily.bold,
              color:      monthlyProgress >= 0 ? colors.income : colors.expense,
              letterSpacing: -0.3,
            }}>
              {monthlyProgress >= 0 ? '+' : ''}{fmtShort(monthlyProgress)}/mo
            </Text>
          </View>
        )}
      </View>

      {/* ── Next Milestone ── */}
      {nextMilestone && (
        <View style={[shadows.sm, { backgroundColor: colors.bg.surface, borderRadius: borderRadius.card, padding: spacing[4] }]}>
          <Text style={{ fontSize: fontSize.micro, fontFamily: fontFamily.semiBold, color: colors.text.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing[3] }}>
            Next Milestone
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
            <Text style={{ fontSize: 32, marginRight: spacing[3] }}>{nextMilestone.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.text.primary, letterSpacing: -0.3 }}>
                {nextMilestone.label}
              </Text>
              <Text style={{ fontSize: fontSize.bodySm, fontFamily: fontFamily.regular, color: colors.text.muted, marginTop: 2 }}>
                {nextMilestone.isDebtFree
                  ? `${fmtShort(totalDebts)} remaining`
                  : `${fmtShort(nextMilestone.threshold - netWorth)} to go`
                }
                {monthsAway != null && monthsAway > 0 && monthsAway < 120
                  ? ` · ~${monthsAway} mo away`
                  : ''}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.headingSm, fontFamily: fontFamily.bold, color: colors.accent.primary }}>
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: colors.bg.surfaceMuted, borderRadius: 99, overflow: 'hidden' }}>
            <View style={{
              height:          '100%',
              width:           `${Math.min(progressPct * 100, 100)}%`,
              backgroundColor: colors.accent.primary,
              borderRadius:    99,
            }} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}
