import { useQuery } from '@tanstack/react-query';
import { getSavingsGoals } from '../../services/finance.service';

export const SAVINGS_GOALS_KEY = ['savings_goals'] as const;

export function useSavingsGoals() {
  return useQuery({
    queryKey: SAVINGS_GOALS_KEY,
    queryFn:  getSavingsGoals,
    staleTime: 60_000,
  });
}
