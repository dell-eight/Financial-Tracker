import { useQuery } from '@tanstack/react-query';
import { getAssets, getDebts } from '../../services/finance.service';
import type { AssetItem, DebtItem } from '../../types/models';

export const ASSETS_KEY = ['assets'] as const;
export const DEBTS_KEY  = ['debts']  as const;

export function useAssets() {
  return useQuery<AssetItem[]>({
    queryKey: ASSETS_KEY,
    queryFn:  getAssets,
    staleTime: 60_000,
  });
}

export function useDebts() {
  return useQuery<DebtItem[]>({
    queryKey: DEBTS_KEY,
    queryFn:  getDebts,
    staleTime: 60_000,
  });
}
