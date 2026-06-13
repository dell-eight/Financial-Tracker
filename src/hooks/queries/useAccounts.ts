import { useQuery } from '@tanstack/react-query';
import { mockGetAccounts } from '../../api';

export const ACCOUNTS_KEY = ['accounts'] as const;

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn:  mockGetAccounts,
  });
}
