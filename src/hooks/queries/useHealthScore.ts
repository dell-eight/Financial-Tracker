import { useMemo } from 'react';
import { useDashboard } from './useDashboard';
import { useSavingsGoals } from './useSavingsGoals';
import { computeHealthScore } from '../../utils/healthScore';
import type { ScoreMode, HealthFactors } from '../../utils/healthScore';
import { useAppStore } from '../../store/app.store';

export interface HealthScoreFactors extends HealthFactors {
  goalCount: number;
}

export function useHealthScore(mode?: ScoreMode) {
  const storeMode  = useAppStore(s => s.healthScoreMode);
  const activeMode = mode ?? storeMode;

  const { data: dashboard, isLoading: dashLoading } = useDashboard();
  const { data: goals,     isLoading: goalLoading  } = useSavingsGoals();

  const factors = useMemo((): HealthScoreFactors | null => {
    if (!dashboard) return null;

    const emergencyMonths = dashboard.monthlyExpenses > 0
      ? (dashboard.liquidBalance ?? 0) / dashboard.monthlyExpenses : 0;

    // Both savings rate and debt ratio use the same 90-day window for a consistent baseline.
    // Fallback to 30-day values for backward-compat while cache holds pre-migration data.
    const savingsRate = dashboard.savingsRate3m ?? dashboard.savingsRate;
    const income90d   = dashboard.income90d ?? (dashboard.monthlyIncome * 3);
    const debtRatio   = income90d * 4 > 0 ? dashboard.totalDebts / (income90d * 4) : 0;

    // Weighted Σ(saved)/Σ(target) — prevents small funded goals from inflating the score.
    // Returns null when no goals exist so computeHealthScore can exclude the factor entirely.
    const goalProgress = (() => {
      if (!goals || goals.length === 0) return null;
      const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
      if (totalTarget === 0) return null;
      return Math.min(1, goals.reduce((s, g) => s + g.savedAmount, 0) / totalTarget);
    })();

    return {
      savingsRate,
      emergencyMonths,
      debtRatio,
      goalProgress,
      goalCount: goals?.length ?? 0,
    };
  }, [dashboard, goals]);

  const result = useMemo(
    () => factors ? computeHealthScore(factors, activeMode) : null,
    [factors, activeMode],
  );

  return { result, factors, isLoading: dashLoading || goalLoading };
}
