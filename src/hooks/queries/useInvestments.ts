import { useQuery } from '@tanstack/react-query';
import { getInvestments } from '../../services/finance.service';

export const HOLDINGS_KEY = ['holdings'] as const;

export function useInvestments() {
  return useQuery({
    queryKey: HOLDINGS_KEY,
    queryFn:  getInvestments,
    staleTime: 60_000,
  });
}
