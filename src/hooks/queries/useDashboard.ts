import { useQuery } from '@tanstack/react-query';
import { mockGetAccounts, mockGetDashboard } from '../../api';

export const DASHBOARD_KEY  = ['dashboard'] as const;
export const ACCOUNTS_KEY   = ['accounts']  as const;

export function useDashboard() {
  return useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn:  mockGetDashboard,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn:  mockGetAccounts,
  });
}
