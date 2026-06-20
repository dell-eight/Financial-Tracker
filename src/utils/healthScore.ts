export type FactorId = 'savings' | 'emergency' | 'debt' | 'goal';

export interface HealthFactors {
  savingsRate:     number;        // 0–100 % (may be negative — clamped to 0 in scoring)
  emergencyMonths: number;        // months of expenses covered
  debtRatio:       number;        // totalDebts / annualIncome (0–1+)
  goalProgress:    number | null; // 0–1 weighted across goals; null = no goals (factor excluded)
}

export interface HealthScoreWeights {
  savings:   number; // 0–100 integer, all four must sum to 100
  emergency: number;
  debt:      number;
  goal:      number;
}

export interface ScoreFactor {
  id:       FactorId; // stable key for icon/color lookup
  label:    string;
  weight:   number;   // 0–1 decimal (e.g. 0.30)
  factor:   number;   // 0–1 normalized achievement
  rawLabel: string;   // e.g. "18.0% of income saved"
  tip:      string;
}

// ── Band thresholds — single source of truth ─────────────────────────────────

export const SCORE_BANDS = {
  needsAttention: 0,
  fair:           40,
  good:           60,
  excellent:      80,
} as const;

export function healthBand(score: number): { label: string; color: string } {
  if (score >= SCORE_BANDS.excellent) return { label: 'Excellent',       color: '#22C55E' };
  if (score >= SCORE_BANDS.good)      return { label: 'Good',            color: '#755DEF' };
  if (score >= SCORE_BANDS.fair)      return { label: 'Fair',            color: '#F97316' };
  return                                     { label: 'Needs Attention', color: '#EF4444' };
}

// ── Score modes ──────────────────────────────────────────────────────────────

export type ScoreMode =
  | 'balanced'
  | 'foundation_builder'
  | 'wealth_builder'
  | 'debt_freedom'
  | 'goal_focused';

export const SCORE_PRESETS: Record<
  ScoreMode,
  { label: string; tagline: string; weights: HealthScoreWeights }
> = {
  balanced: {
    label:   'Balanced',
    tagline: 'Best for most users',
    weights: { savings: 30, emergency: 25, debt: 25, goal: 20 },
  },
  foundation_builder: {
    label:   'Foundation Builder',
    tagline: 'Build a strong financial safety net first',
    weights: { savings: 20, emergency: 45, debt: 20, goal: 15 },
  },
  wealth_builder: {
    label:   'Wealth Builder',
    tagline: 'Focus on growing savings and net worth',
    weights: { savings: 40, emergency: 25, debt: 20, goal: 15 },
  },
  debt_freedom: {
    label:   'Debt Freedom',
    tagline: 'Prioritize paying off debt',
    weights: { savings: 20, emergency: 20, debt: 45, goal: 15 },
  },
  goal_focused: {
    label:   'Goal Focused',
    tagline: 'Prioritize reaching savings goals faster',
    weights: { savings: 20, emergency: 20, debt: 20, goal: 40 },
  },
};

// ── Recommendation ────────────────────────────────────────────────────────────

interface RecommendArgs {
  savingsRate:     number;
  emergencyMonths: number;
  debtRatio:       number;
  goalProgress:    number | null;
  goalCount:       number;
}

export function recommendScoreMode(f: RecommendArgs): { primary: ScoreMode; reasons: string[] } {
  const reasons: string[] = [];
  let primary: ScoreMode = 'balanced';
  let primarySet = false;

  if (f.emergencyMonths < 3) {
    if (!primarySet) { primary = 'foundation_builder'; primarySet = true; }
    reasons.push('Your emergency fund covers less than 3 months of expenses.');
  }
  if (f.debtRatio > 0.30) {
    if (!primarySet) { primary = 'debt_freedom'; primarySet = true; }
    reasons.push(`Your debt is ${Math.round(f.debtRatio * 100)}% of annual income — above the 30% threshold.`);
  }
  if (f.goalCount > 0 && (f.goalProgress ?? 0) < 0.50) {
    if (!primarySet) { primary = 'goal_focused'; primarySet = true; }
    reasons.push('Your savings goals are less than halfway funded.');
  }
  if (f.savingsRate > 15) {
    if (!primarySet) { primary = 'wealth_builder'; primarySet = true; }
    reasons.push(`You're saving ${f.savingsRate.toFixed(0)}% of income — a great foundation for building wealth.`);
  }

  if (!primarySet) {
    reasons.push('A well-rounded view of your overall financial health.');
  }

  return { primary, reasons };
}

// ── Score computation ─────────────────────────────────────────────────────────

export function computeHealthScore(
  f: HealthFactors,
  mode: ScoreMode = 'balanced',
): { total: number; factors: ScoreFactor[] } {
  const w = SCORE_PRESETS[mode].weights;

  // Clamp savings at 0 — negative rates (overspending months) score 0, not negative
  const savingsFactor   = Math.min(Math.max(0, f.savingsRate / 20), 1);
  const emergencyFactor = Math.min(f.emergencyMonths / 6, 1);
  const debtFactor      = Math.min(Math.max(0, 1 - f.debtRatio / 0.30), 1);
  const goalFactor      = f.goalProgress !== null ? Math.min(Math.max(0, f.goalProgress), 1) : 0;

  const allFactors: ScoreFactor[] = [
    {
      id:       'savings',
      label:    'Savings Rate',
      weight:   w.savings / 100,
      factor:   savingsFactor,
      rawLabel: `${Math.max(0, f.savingsRate).toFixed(1)}% of income saved`,
      tip:      f.savingsRate >= 20
        ? "Great — you're saving at a healthy rate."
        : `Aim to save 20% of income (${(20 - Math.max(0, f.savingsRate)).toFixed(0)}% gap to close).`,
    },
    {
      id:       'emergency',
      label:    'Emergency Fund',
      weight:   w.emergency / 100,
      factor:   emergencyFactor,
      rawLabel: `${f.emergencyMonths.toFixed(1)} months of expenses covered`,
      tip:      f.emergencyMonths >= 6
        ? 'Excellent — emergency fund is fully funded.'
        : `Build fund to 6 months of expenses (${(6 - f.emergencyMonths).toFixed(1)} months to go).`,
    },
    {
      id:       'debt',
      label:    'Debt Ratio',
      weight:   w.debt / 100,
      factor:   debtFactor,
      rawLabel: f.debtRatio > 0
        ? `${(f.debtRatio * 100).toFixed(0)}% debt-to-annual-income`
        : 'No debt',
      tip:      f.debtRatio === 0
        ? "Outstanding — you're debt free!"
        : f.debtRatio <= 0.30
        ? 'Debt is manageable — keep it below 30% of annual income.'
        : 'Focus on paying down high-interest debt to improve this score.',
    },
    {
      id:       'goal',
      label:    'Goal Progress',
      weight:   w.goal / 100,
      factor:   goalFactor,
      rawLabel: f.goalProgress !== null
        ? `${Math.round(goalFactor * 100)}% weighted goal completion`
        : 'No goals set',
      tip:      f.goalProgress === null
        ? 'Set up a savings goal to start tracking progress here.'
        : goalFactor >= 1
        ? 'All goals funded!'
        : goalFactor >= 0.5
        ? 'Great progress — keep contributing to hit your goals.'
        : 'Set up automatic transfers to accelerate savings goal progress.',
    },
  ];

  // Exclude any factor whose input is null (e.g. goal when no goals exist).
  // Re-normalizing by the remaining weight sum keeps the total out of 100.
  const activeFactors = allFactors.filter(sf => {
    if (sf.id === 'goal') return f.goalProgress !== null;
    return true;
  });

  const weightSum = activeFactors.reduce((s, sf) => s + sf.weight, 0);

  if (__DEV__ && Math.abs(weightSum - 1) > 0.01) {
    console.warn(`[HealthScore] Weights sum to ${weightSum.toFixed(3)} — expected 1.0`);
  }

  const total = Math.round(
    activeFactors.reduce((sum, sf) => sum + sf.factor * sf.weight, 0) / weightSum * 100,
  );

  // Return allFactors (not activeFactors) so the UI always has all four rows available;
  // consumers check factor.id === 'goal' && goalProgress === null to hide the row.
  return { total, factors: allFactors };
}
