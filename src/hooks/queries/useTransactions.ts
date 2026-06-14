import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../../services/finance.service';

export const TRANSACTIONS_KEY = ['transactions'] as const;

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn:  getTransactions,
    staleTime: 30_000,
  });
}
