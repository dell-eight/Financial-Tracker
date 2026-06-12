import { create } from 'zustand';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user:            null,
  token:           null,
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  setUser: (user, token) =>
    set({ user, token, isAuthenticated: true, error: null }),

  clearAuth: () =>
    set({ user: null, token: null, isAuthenticated: false, error: null }),

  setLoading: (isLoading) => set({ isLoading }),
  setError:   (error)     => set({ error }),
}));
