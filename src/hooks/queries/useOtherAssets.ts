import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOtherAssets,
  addOtherAsset,
  updateOtherAsset,
  deleteOtherAsset,
} from '../../services/finance.service';

export const OTHER_ASSETS_KEY = ['other_assets'] as const;

export function useOtherAssets() {
  return useQuery({
    queryKey: OTHER_ASSETS_KEY,
    queryFn:  getOtherAssets,
    staleTime: 60_000,
  });
}

export function useAddOtherAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addOtherAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: OTHER_ASSETS_KEY }),
  });
}

export function useUpdateOtherAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...params }: { id: string } & Parameters<typeof updateOtherAsset>[1]) =>
      updateOtherAsset(id, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: OTHER_ASSETS_KEY }),
  });
}

export function useDeleteOtherAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteOtherAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: OTHER_ASSETS_KEY }),
  });
}
