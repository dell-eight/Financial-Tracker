import { useMutation, useQuery } from '@tanstack/react-query';
import { signIn, signUp, getUserProfile } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { AuthCredentials, RegisterCredentials } from '../../types/models';

export const USER_PROFILE_KEY = (userId: string) => ['user_profile', userId] as const;

export function useUserProfile() {
  const userId = useAuthStore(s => s.user?.id);
  return useQuery({
    queryKey:  userId ? USER_PROFILE_KEY(userId) : ['user_profile', null],
    queryFn:   () => getUserProfile(userId!).then(r => r.profile),
    enabled:   !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const setError = useAuthStore(s => s.setError);

  return useMutation({
    mutationFn: ({ email, password }: AuthCredentials) =>
      signIn({ email, password }),
    onSuccess: ({ error }) => {
      // Session is automatically handled by the onAuthStateChange listener
      // in RootNavigator. Only surface auth errors here.
      if (error) setError(error);
    },
    onError: (err: Error) => setError(err.message),
  });
}

export function useRegister() {
  const setError = useAuthStore(s => s.setError);

  return useMutation({
    mutationFn: ({ email, password, name }: RegisterCredentials) =>
      signUp({ email, password, name }),
    onSuccess: ({ error }) => {
      if (error) setError(error);
    },
    onError: (err: Error) => setError(err.message),
  });
}

export function useLogout() {
  const clearAuth = useAuthStore(s => s.clearAuth);

  return useMutation({
    mutationFn: () => import('../../services/auth.service').then(m => m.signOut()),
    onSuccess:  () => clearAuth(),
    onError:    (err: Error) => useAuthStore.getState().setError(err.message),
  });
}
