import { useQuery } from '@tanstack/react-query';
import { mockGetTransactions } from '../../api';

export const TRANSACTIONS_KEY = ['transactions'] as const;

export function useTransactions() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn:  mockGetTransactions,
  });
}
