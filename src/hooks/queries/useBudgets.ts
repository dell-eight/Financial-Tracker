import { useQuery } from '@tanstack/react-query';
import { getBudgets } from '../../services/finance.service';

export const BUDGETS_KEY = ['budgets'] as const;

export function useBudgets(year?: number, month?: number) {
  const key = year !== undefined ? [...BUDGETS_KEY, year, month] : [...BUDGETS_KEY];
  return useQuery({
    queryKey: key,
    queryFn:  () => getBudgets(year, month),
    staleTime: 60_000,
  });
}
