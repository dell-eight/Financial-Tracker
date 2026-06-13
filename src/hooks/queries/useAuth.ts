import { useMutation } from '@tanstack/react-query';
import { signIn, signUp } from '../../services/auth.service';
import { useAuthStore } from '../../store/auth.store';
import type { AuthCredentials, RegisterCredentials } from '../../types/models';

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
