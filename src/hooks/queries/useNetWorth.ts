import { useQuery, useQueryClient } from '@tanstack/react-query';
import { mockGetAssets, mockGetDebts } from '../../api';
import type { AssetItem, DebtItem } from '../../types/models';

export const ASSETS_KEY = ['assets'] as const;
export const DEBTS_KEY  = ['debts']  as const;

export function useAssets() {
  return useQuery<AssetItem[]>({ queryKey: ASSETS_KEY, queryFn: mockGetAssets });
}

export function useDebts() {
  return useQuery<DebtItem[]>({ queryKey: DEBTS_KEY, queryFn: mockGetDebts });
}
