import { useQuery } from '@tanstack/react-query';
import { mockGetSavingsGoals } from '../../api';

export const SAVINGS_GOALS_KEY = ['savings_goals'] as const;

export function useSavingsGoals() {
  return useQuery({
    queryKey: SAVINGS_GOALS_KEY,
    queryFn:  mockGetSavingsGoals,
  });
}
