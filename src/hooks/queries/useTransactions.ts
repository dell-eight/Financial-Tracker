import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../../services/finance.service';

export const TRANSACTIONS_KEY = ['transactions'] as const;

export function useTransactions(from?: string, to?: string) {
  const hasRange = !!from && !!to;
  return useQuery({
    queryKey:  hasRange ? ['transactions', from, to] : TRANSACTIONS_KEY,
    queryFn:   () => getTransactions(hasRange ? { from, to } : undefined),
    staleTime: hasRange ? 5 * 60_000 : 30_000,
  });
}
