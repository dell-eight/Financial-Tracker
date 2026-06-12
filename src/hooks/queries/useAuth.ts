import { useMutation } from '@tanstack/react-query';
import { mockLogin, mockRegister } from '../../api';
import { useAuthStore } from '../../store/auth.store';
import type { AuthCredentials, RegisterCredentials } from '../../types/models';

export function useLogin() {
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: ({ email, password }: AuthCredentials) =>
      mockLogin(email, password),
    onSuccess: ({ user, token }) => {
      setUser(user, token);
    },
  });
}

export function useRegister() {
  const setUser = useAuthStore(s => s.setUser);

  return useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      mockRegister(credentials),
    onSuccess: ({ user, token }) => {
      setUser(user, token);
    },
  });
}
