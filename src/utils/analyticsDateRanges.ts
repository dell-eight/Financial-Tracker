import type { Transaction } from '../types/models';
import type { MonthPoint }  from '../services/finance.service';

export interface PeriodMeta {
  total:             string;
  income:            string;
  net:               string;
  delta:             string;
  vsLabel:           string;
  savingsRate:       number;
  /** null = no prior-period income data; suppress the savings delta badge */
  prevSavingsRate:   number | null;
  hasIncome:         boolean;
  thisMonthSavings:  number;
  ytdSavings:        number;
  avgSavings:        number;
}

/**
 * Pure function that computes analytics summary metrics for the given period.
 * Extracted from AnalyticsScreen's `meta` useMemo for independent testability.
 *
 * @param fmt     Currency formatter bound to the user's active currency.
 * @param currentMonth  ISO year-month prefix, e.g. "2026-06".
 */
export function computePeriodMeta(
  period:         'weekly' | 'monthly' | 'yearly',
  txns:           Transaction[]  | undefined,
  monthlyHistory: MonthPoint[]   | undefined,
  weeklyHistory:  MonthPoint[]   | undefined,
  fmt:            (n: number) => string,
  currentMonth:   string,
): PeriodMeta {
  if (period === 'weekly') {
    const wk      = weeklyHistory ?? [];
    const income  = wk.reduce((s, d) => s + d.income,  0);
    const expense = wk.reduce((s, d) => s + d.expense, 0);
    const net     = income - expense;
    const sr      = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
    const mhW     = monthlyHistory ?? [];
    const ytdW    = mhW.reduce((s, h) => s + h.savings, 0);
    const avgW    = mhW.length > 0 ? Math.round(ytdW / mhW.length) : 0;
    return {
      total: fmt(expense), income: fmt(income), net: fmt(Math.max(0, net)),
      delta: '—', vsLabel: 'this week', savingsRate: sr, prevSavingsRate: null,
      hasIncome: income > 0, thisMonthSavings: mhW[mhW.length - 1]?.savings ?? 0,
      ytdSavings: ytdW, avgSavings: avgW,
    };
  }

  if (period === 'yearly') {
    const hist    = monthlyHistory ?? [];
    const income  = hist.reduce((s, d) => s + d.income,  0);
    const expense = hist.reduce((s, d) => s + d.expense, 0);
    const net     = income - expense;
    const sr      = income > 0 ? Math.round((net / income) * 1000) / 10 : 0;
    const ytdY    = hist.reduce((s, h) => s + h.savings, 0);
    const avgY    = hist.length > 0 ? Math.round(ytdY / hist.length) : 0;
    return {
      total: fmt(expense), income: fmt(income), net: fmt(Math.max(0, net)),
      delta: '—', vsLabel: 'last 6 months', savingsRate: sr, prevSavingsRate: null,
      hasIncome: income > 0, thisMonthSavings: hist[hist.length - 1]?.savings ?? 0,
      ytdSavings: ytdY, avgSavings: avgY,
    };
  }

  // monthly
  const monthExpense    = (txns ?? [])
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);
  const monthIncome     = (txns ?? [])
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + t.amount, 0);
  const net             = monthIncome - monthExpense;
  const savingsRate     = monthIncome > 0 ? Math.round((net / monthIncome) * 1000) / 10 : 0;
  const hist            = monthlyHistory ?? [];
  const prev            = hist.length >= 2 ? hist[hist.length - 2] : null;
  const prevExp         = prev?.expense ?? 0;
  const deltaVal        = prevExp > 0 ? ((monthExpense - prevExp) / prevExp) * 100 : 0;
  const deltaStr        = prevExp > 0 ? `${Math.abs(deltaVal).toFixed(1)}% ${deltaVal <= 0 ? 'less' : 'more'}` : '—';
  const prevSR          = prev && prev.income > 0
    ? Math.round(((prev.income - prev.expense) / prev.income) * 1000) / 10
    : null;
  // Live net for current month; exclude the current-month DB entry (partial/stale) when summing
  const completedMonths = hist.filter(h => !h.month.startsWith(currentMonth));
  const ytdM            = completedMonths.reduce((s, h) => s + h.savings, 0) + net;
  const avgM            = Math.round(ytdM / (completedMonths.length + 1));
  return {
    total:            fmt(monthExpense),
    income:           fmt(monthIncome),
    net:              fmt(Math.max(0, net)),
    delta:            deltaStr,
    vsLabel:          prev ? `vs ${prev.label}` : '',
    savingsRate,
    prevSavingsRate:  prevSR,
    hasIncome:        monthIncome > 0,
    thisMonthSavings: net,
    ytdSavings:       ytdM,
    avgSavings:       avgM,
  };
}
