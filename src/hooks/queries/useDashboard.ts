import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../services/finance.service';

export const DASHBOARD_KEY = ['dashboard'] as const;

export function useDashboard() {
  return useQuery({
    queryKey:        DASHBOARD_KEY,
    queryFn:         getDashboard,
    staleTime:       0,          // always re-fetch when the dashboard mounts/focuses
    refetchOnMount:  true,
    refetchOnWindowFocus: true,
  });
}
