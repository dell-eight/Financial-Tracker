import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../../services/finance.service';

export const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn:  getAccounts,
    staleTime: 60_000,
  });
}
