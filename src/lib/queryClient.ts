import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:            1,
      staleTime:        5 * 60 * 1000,
      gcTime:           30 * 60 * 1000,
      // Serve from cache when offline instead of entering loading state
      networkMode:      'offlineFirst',
    },
    mutations: {
      retry:       0,
      networkMode: 'offlineFirst',
    },
  },
});
