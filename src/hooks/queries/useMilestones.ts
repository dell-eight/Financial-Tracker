import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllMilestones, markMilestoneCelebrated } from '../../services/finance.service';

export const MILESTONES_KEY = ['wealth_milestones'] as const;

export function useAllMilestones() {
  return useQuery({
    queryKey: MILESTONES_KEY,
    queryFn:  getAllMilestones,
    staleTime: 60_000,
  });
}

export function useMarkCelebrated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (milestoneId: string) => markMilestoneCelebrated(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MILESTONES_KEY });
    },
  });
}
