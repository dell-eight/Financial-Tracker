import { useQuery } from '@tanstack/react-query';
import {
  getMonthlyHistory, getWeeklyHistory, getNetWorthHistory, getIncomeStreams,
  type MonthPoint, type NWPoint, type IncomeStream,
} from '../../services/finance.service';

export const MONTHLY_HISTORY_KEY = ['monthly_history'] as const;
export const WEEKLY_HISTORY_KEY  = ['weekly_history']  as const;
export const NW_HISTORY_KEY      = ['nw_history']      as const;
export const INCOME_STREAMS_KEY  = ['income_streams']  as const;

export function useMonthlyHistory(months = 6) {
  return useQuery<MonthPoint[]>({
    queryKey: [...MONTHLY_HISTORY_KEY, months],
    queryFn:  () => getMonthlyHistory(months),
    staleTime: 60_000,
  });
}

export function useWeeklyHistory() {
  return useQuery<MonthPoint[]>({
    queryKey: WEEKLY_HISTORY_KEY,
    queryFn:  getWeeklyHistory,
    staleTime: 30_000,
  });
}

export function useNetWorthHistory(months = 12) {
  return useQuery<NWPoint[]>({
    queryKey: [...NW_HISTORY_KEY, months],
    queryFn:  () => getNetWorthHistory(months),
    staleTime: 60_000,
  });
}

export function useIncomeStreams() {
  return useQuery<IncomeStream[]>({
    queryKey: INCOME_STREAMS_KEY,
    queryFn:  getIncomeStreams,
    staleTime: 60_000,
  });
}
