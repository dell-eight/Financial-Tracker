import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notifications.service';
import type { AppNotification } from '../../types/models';

export const NOTIFICATIONS_KEY       = ['notifications']       as const;
export const NOTIFICATIONS_COUNT_KEY = ['notifications_count'] as const;

export function useNotifications() {
  return useQuery({
    queryKey:  NOTIFICATIONS_KEY,
    queryFn:   getNotifications,
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey:  NOTIFICATIONS_COUNT_KEY,
    queryFn:   getUnreadNotificationCount,
    staleTime: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
      const previousList  = queryClient.getQueryData(NOTIFICATIONS_KEY);
      const previousCount = queryClient.getQueryData(NOTIFICATIONS_COUNT_KEY);

      queryClient.setQueryData(NOTIFICATIONS_KEY, (old: AppNotification[] | undefined) => {
        if (!old) return old;
        const now = new Date().toISOString();
        return old.map(n => n.id === id ? { ...n, readAt: now } : n);
      });
      queryClient.setQueryData(NOTIFICATIONS_COUNT_KEY, (old: number | undefined) =>
        Math.max(0, (old ?? 0) - 1),
      );
      return { previousList, previousCount };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previousList)  queryClient.setQueryData(NOTIFICATIONS_KEY,       ctx.previousList);
      if (ctx?.previousCount) queryClient.setQueryData(NOTIFICATIONS_COUNT_KEY, ctx.previousCount);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_COUNT_KEY });
    },
  });
}
