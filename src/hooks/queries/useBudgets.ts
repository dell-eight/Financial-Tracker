import { useQuery } from '@tanstack/react-query';
import { getBudgets } from '../../services/finance.service';

export const BUDGETS_KEY = ['budgets'] as const;

export function useBudgets() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn:  getBudgets,
    staleTime: 60_000,
  });
}
