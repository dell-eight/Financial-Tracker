import { useQuery } from '@tanstack/react-query';
import { getTradeHistory } from '../../services/finance.service';

export const INVESTMENT_TX_KEY = ['investment_transactions'] as const;

export function useInvestmentTransactions(filters: {
  holdingId?: string;
  accountId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...INVESTMENT_TX_KEY, filters],
    queryFn:  () => getTradeHistory(filters),
    staleTime: 30_000,
    enabled:  !!(filters.holdingId || filters.accountId),
  });
}
