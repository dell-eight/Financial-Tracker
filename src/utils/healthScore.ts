export interface HealthFactors {
  savingsRate:     number;  // 0–100 %
  emergencyMonths: number;  // months of expenses covered
  debtRatio:       number;  // totalDebts / annualIncome (0–1+)
  goalProgress:    number;  // 0–1 average across active goals
}

export interface ScoreFactor {
  label:    string;
  weight:   number;  // e.g. 0.30
  factor:   number;  // 0–1 normalized
  rawLabel: string;  // e.g. "18.0% of income saved"
  tip:      string;
}

export function computeHealthScore(f: HealthFactors): { total: number; factors: ScoreFactor[] } {
  const savingsFactor   = Math.min(f.savingsRate / 20, 1);
  const emergencyFactor = Math.min(f.emergencyMonths / 6, 1);
  const debtFactor      = Math.min(Math.max(0, 1 - f.debtRatio / 0.30), 1);
  const goalFactor      = Math.min(Math.max(0, f.goalProgress), 1);

  const factors: ScoreFactor[] = [
    {
      label:    'Savings Rate',
      weight:   0.30,
      factor:   savingsFactor,
      rawLabel: `${f.savingsRate.toFixed(1)}% of income saved`,
      tip:      f.savingsRate >= 20
        ? "Great — you're saving at a healthy rate."
        : `Aim to save 20% of income (${(20 - f.savingsRate).toFixed(0)}% gap to close).`,
    },
    {
      label:    'Emergency Fund',
      weight:   0.25,
      factor:   emergencyFactor,
      rawLabel: `${f.emergencyMonths.toFixed(1)} months of expenses covered`,
      tip:      f.emergencyMonths >= 6
        ? 'Excellent — emergency fund is fully funded.'
        : `Build fund to 6 months of expenses (${(6 - f.emergencyMonths).toFixed(1)} months to go).`,
    },
    {
      label:    'Debt Ratio',
      weight:   0.25,
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
      label:    'Goal Progress',
      weight:   0.20,
      factor:   goalFactor,
      rawLabel: `${Math.round(goalFactor * 100)}% average goal completion`,
      tip:      goalFactor >= 1
        ? 'All goals funded!'
        : goalFactor >= 0.5
        ? 'Great progress — keep contributing to hit your goals.'
        : 'Set up automatic transfers to accelerate savings goal progress.',
    },
  ];

  const total = Math.round(
    factors.reduce((sum, sf) => sum + sf.factor * sf.weight, 0) * 100,
  );

  return { total, factors };
}

export function healthBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent',       color: '#22C55E' };
  if (score >= 60) return { label: 'Good',            color: '#755DEF' };
  if (score >= 40) return { label: 'Fair',            color: '#F97316' };
  return                   { label: 'Needs Attention', color: '#EF4444' };
}
