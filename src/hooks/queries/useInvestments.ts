import { useQuery } from '@tanstack/react-query';
import { mockGetHoldings } from '../../api';

export const HOLDINGS_KEY = ['holdings'] as const;

export function useInvestments() {
  return useQuery({
    queryKey: HOLDINGS_KEY,
    queryFn:  mockGetHoldings,
  });
}
