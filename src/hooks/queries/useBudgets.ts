import { useQuery } from '@tanstack/react-query';
import { mockGetBudgets } from '../../api';

export const BUDGETS_KEY = ['budgets'] as const;

export function useBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn:  mockGetBudgets,
  });
}
