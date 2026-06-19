import { useMemo } from 'react';
import { useMonthlyHistory, useWeeklyHistory, useNetWorthHistory } from '../queries/useAnalytics';
import { useTransactions } from '../queries/useTransactions';
import { useTheme } from './useTheme';
import type { AnalyticsPeriod, NwPeriod } from '../../store/chartModal.store';
import type { NWPoint } from '../../services/finance.service';
import type { CategoryKey } from '../../theme';

export interface BarPoint  { label: string; income: number; expense: number }
export interface LinePoint { label: string; value: number }
export interface CatStat  {
  key:    CategoryKey;
  label:  string;
  icon:   string;
  amount: number;
  color:  string;
}

export interface ChartData {
  bar:      BarPoint[];
  line:     LinePoint[];
  donut:    CatStat[];
  networth: NWPoint[];
}

export function useChartData({
  analyticsPeriod,
  nwPeriod,
}: {
  analyticsPeriod: AnalyticsPeriod;
  nwPeriod:        NwPeriod;
}): ChartData {
  const { data: monthlyHistory } = useMonthlyHistory(6);
  const { data: weeklyHistory  } = useWeeklyHistory();
  const { data: txns           } = useTransactions();
  const { data: nwHist         } = useNetWorthHistory(nwPeriod);
  const theme = useTheme();

  const yearlyHistory = useMemo<BarPoint[]>(() => {
    const src = monthlyHistory ?? [];
    if (src.length === 0) return [];
    const quarters = new Map<string, BarPoint>();
    for (const m of src) {
      const qLabel = `Q${Math.ceil((src.indexOf(m) + 1) / 3)}'${new Date().getFullYear().toString().slice(2)}`;
      const cur = quarters.get(qLabel) ?? { label: qLabel, income: 0, expense: 0 };
      quarters.set(qLabel, { label: qLabel, income: cur.income + m.income, expense: cur.expense + m.expense });
    }
    return [...quarters.values()];
  }, [monthlyHistory]);

  const barData = useMemo<BarPoint[]>(() => {
    if (analyticsPeriod === 'weekly') return (weeklyHistory ?? []).map(d => ({ label: d.label, income: d.income, expense: d.expense }));
    if (analyticsPeriod === 'yearly') return yearlyHistory;
    return (monthlyHistory ?? []).map(d => ({ label: d.label, income: d.income, expense: d.expense }));
  }, [analyticsPeriod, weeklyHistory, monthlyHistory, yearlyHistory]);

  const lineData = useMemo<LinePoint[]>(() => {
    if (analyticsPeriod === 'weekly') return (weeklyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
    if (analyticsPeriod === 'yearly') return yearlyHistory.map(d => ({ label: d.label, value: d.expense }));
    return (monthlyHistory ?? []).map(d => ({ label: d.label, value: d.expense }));
  }, [analyticsPeriod, weeklyHistory, monthlyHistory, yearlyHistory]);

  const monthCats = useMemo<CatStat[]>(() => {
    const now = new Date().toISOString().substring(0, 7);
    const expTxns = (txns ?? []).filter(t => t.type === 'expense' && t.date.startsWith(now));
    const map = new Map<CategoryKey, Omit<CatStat, 'key'>>();
    for (const tx of expTxns) {
      const color = (theme.categoryColors[tx.category] as string) ?? '#6B7280';
      const curr  = map.get(tx.category) ?? { label: tx.categoryLabel, icon: tx.categoryIcon, amount: 0, color };
      map.set(tx.category, { ...curr, amount: curr.amount + tx.amount });
    }
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.amount - a.amount);
  }, [txns, theme.categoryColors]);

  const analyticsData = useMemo(
    () => ({ bar: barData, line: lineData, donut: monthCats }),
    [barData, lineData, monthCats],
  );

  const networthData = useMemo(() => nwHist ?? [], [nwHist]);

  return useMemo<ChartData>(
    () => ({ ...analyticsData, networth: networthData }),
    [analyticsData, networthData],
  );
}
